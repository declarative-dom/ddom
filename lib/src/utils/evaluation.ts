/**
 * Modular DDOM Expression Evaluator
 * Ultra-concise, predictable signal resolution with function call support
 */

// Core signal unwrapper - handles $-prefixed properties automatically
const unwrapSignal = (value: any): any => 
  value?.get && typeof value.get === 'function' ? value.get() : value;

/**
 * Property resolver - returns raw values including signal objects (no unwrapping)
 * Used for property access where we want to preserve signal objects
 * 
 * @param obj - The object to traverse
 * @param path - Property path (e.g., 'user.name', 'this.$data')
 * @param fallback - Value to return if path resolution fails
 * @returns The resolved value (signals are NOT unwrapped)
 */
export function resolveProperty(obj: any, path: string, fallback: any = null): any {
  if (!obj || !path) return fallback;
  
  try {
    return path.split(/[.\[\]]+/)
      .filter(Boolean)
      .reduce((current, key) => current?.[key], obj) ?? fallback;
  } catch (error) {
    console.warn('resolveProperty failed for path:', path, error);
    return fallback;
  }
}

/**
 * Ultra-concise chain evaluator using regex-based parsing.
 * Handles complex property chains including function calls and array indexing.
 */
function evaluateChain(obj: any, path: string): any {
  // Split path into segments: properties, function calls, array indices
  const segments = path.match(/([a-zA-Z_$][\w$]*(?:\([^)]*\))?|\[\d+\])/g) || [];
  
  return segments.reduce((current, segment) => {
    if (!current) return current;
    
    // Function call: name(args)
    const funcMatch = segment.match(/^([a-zA-Z_$][\w$]*)\(([^)]*)\)$/);
    if (funcMatch) {
      const [, name, argsStr] = funcMatch;
      const func = current[name];
      if (typeof func === 'function') {
        const args = argsStr ? argsStr.split(',').map(arg => {
          const trimmed = arg.trim();
          return isLiteral(trimmed) ? parseLiteral(trimmed) : unwrapSignal(current[trimmed]);
        }) : [];
        return func.call(current, ...args);
      }
      return undefined;
    }
    
    // Array index: [123]
    const indexMatch = segment.match(/^\[(\d+)\]$/);
    if (indexMatch) {
      return current[parseInt(indexMatch[1])];
    }
    
    // Property access: name
    return current[segment];
  }, obj);
}

/**
 * Template property resolver - unwraps signals automatically
 * Used for template evaluation where we want the actual values
 */
function resolveTemplatePropertyPath(obj: any, path: string, fallback: any = null): any {
  if (!obj || !path) return fallback;
  
  try {
    const result = evaluateChain(obj, path);
    return unwrapSignal(result) ?? fallback;
  } catch (error) {
    console.warn('resolveTemplatePropertyPath failed for path:', path, error);
    return fallback;
  }
}

// Literal value detector and parser
const isLiteral = (str: string): boolean => 
  /^(['"`]).*\1$|^\d+(\.\d+)?$|^(true|false|null|undefined)$/.test(str.trim());

const parseLiteral = (str: string): any => {
  const trimmed = str.trim();
  if (/^(['"`])/.test(trimmed)) return trimmed.slice(1, -1);
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;
  return trimmed;
};

// Function call evaluator with safe globals
const evaluateFunction = (expr: string, context: any): any => {
  const match = expr.match(/^([a-zA-Z_$][\w.$]*)\(([^)]*)\)$/);
  if (!match) return null;
  
  const [, funcPath, argsStr] = match;
  const args = argsStr ? argsStr.split(',').map(arg => {
    const trimmed = arg.trim();
    return isLiteral(trimmed) ? parseLiteral(trimmed) : resolveTemplatePropertyPath(context, trimmed);
  }) : [];

  // Safe globals
  const globals: Record<string, Function> = {
    'Object.entries': Object.entries,
    'Object.keys': Object.keys,
    'Object.values': Object.values,
    'Array.from': Array.from,
    'Array.isArray': Array.isArray,
    'JSON.stringify': JSON.stringify,
    'JSON.parse': JSON.parse
  };

  if (globals[funcPath]) {
    return globals[funcPath](...args);
  }

  // Context method calls
  const pathParts = funcPath.split('.');
  const methodName = pathParts.pop()!;
  const objPath = pathParts.join('.');
  
  // Resolve object
  const obj = objPath ? resolveProperty(context, objPath) : context;
  const method = obj?.[methodName];
  
  return typeof method === 'function' ? method.call(obj, ...args) : null;
};

// Comparison operators
const operators = {
  '===': (a: any, b: any) => a === b,
  '!==': (a: any, b: any) => a !== b,
  '==': (a: any, b: any) => a == b,
  '!=': (a: any, b: any) => a != b,
  '>=': (a: any, b: any) => a >= b,
  '<=': (a: any, b: any) => a <= b,
  '>': (a: any, b: any) => a > b,
  '<': (a: any, b: any) => a < b
} as const;

export type Operator = keyof typeof operators;

/**
 * Evaluates comparison expressions like "a < b", "count >= 5", etc.
 * Can be used by both template evaluation and array filtering.
 * Returns the comparison result, or null if the expression is not a comparison.
 */
export function evaluateComparison(expr: string, context: any): any {
  for (const [op, fn] of Object.entries(operators)) {
    const regex = new RegExp(`\\s+${op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`);
    if (regex.test(expr)) {
      const [left, right] = expr.split(regex).map(s => s.trim());
      const leftVal = isLiteral(left) ? parseLiteral(left) : resolveTemplatePropertyPath(context, left);
      const rightVal = isLiteral(right) ? parseLiteral(right) : resolveTemplatePropertyPath(context, right);
      return fn(leftVal, rightVal);
    }
  }
  return null;
}

// Expression evaluator with operator precedence
const evaluateExpression = (expr: string, context: any): any => {
  // Ternary: condition ? true : false
  const ternaryMatch = expr.match(/^(.+?)\s*\?\s*(.+?)\s*:\s*(.+)$/);
  if (ternaryMatch) {
    const [, condition, truthy, falsy] = ternaryMatch;
    const conditionResult = evaluateComparison(condition.trim(), context) ?? 
                           resolveTemplatePropertyPath(context, condition.trim());
    const resultPath = conditionResult ? truthy.trim() : falsy.trim();
    return isLiteral(resultPath) ? parseLiteral(resultPath) : resolveTemplatePropertyPath(context, resultPath);
  }

  // Logical OR: fallback chaining
  if (expr.includes('||')) {
    return expr.split('||')
      .map(p => p.trim())
      .reduce((result, path) => result ?? 
        (isLiteral(path) ? parseLiteral(path) : resolveTemplatePropertyPath(context, path)), undefined);
  }

  // Logical AND: truthy chaining
  if (expr.includes('&&')) {
    return expr.split('&&')
      .map(p => p.trim())
      .reduce((result, path) => result && 
        (isLiteral(path) ? parseLiteral(path) : resolveTemplatePropertyPath(context, path)), true);
  }

  // Comparison
  const comparisonResult = evaluateComparison(expr, context);
  if (comparisonResult !== null) return comparisonResult;

  // Function call
  if (expr.includes('(') && expr.includes(')')) {
    return evaluateFunction(expr, context);
  }

  // Simple property access - use template path for unwrapping
  return resolveTemplatePropertyPath(context, expr);
};

/**
 * Safe template literal resolver with automatic signal resolution.
 * Supports ternary operators, logical operators, and property access.
 * NO eval, NO new Function - completely safe for user-generated content.
 *
 * @param template - The template string to resolve
 * @param context - The object to use as context for property resolution
 * @returns The template string resolved with safe evaluation
 */
export function resolveTemplate(template: string, context: object): string {
  try {
    console.debug('🔧 resolveTemplate called with template:', template, 'context:', context);
    console.debug('🔧 Context this object properties:', Object.getOwnPropertyNames((context as any).this || {}).filter(k => k.startsWith('$')));
    
    const result = template.replace(/\$\{([^}]+)\}/g, (match, expr) => {
      try {
        const result = evaluateExpression(expr.trim(), context);
        console.debug('🔧 Expression evaluation:', expr.trim(), '→', result);
        return String(result ?? match);
      } catch (error) {
        console.warn('Template evaluation failed:', error);
        return match;
      }
    });
    
    console.debug('🔧 Template result:', result);
    return result;
  } catch (error) {
    console.warn(`Template evaluation failed: ${error}, Template: ${template}`);
    return template;
  }
}

/**
 * Property resolver for non-template contexts - preserves signal objects
 */
export function resolveTemplateProperty(obj: any, path: string, fallback: any = null): any {
  try {
    // Function call with args
    if (path.includes('(') && path.includes(')')) {
      return evaluateFunction(path, obj);
    }
    
    // Simple property access WITHOUT signal unwrapping
    return resolveProperty(obj, path, fallback);
  } catch (error) {
    console.warn('Property resolution failed:', path, error);
    return fallback;
  }
}

/**
 * Resolves an operand value (can be direct value, property path, or template)
 * Uses only safe evaluation - no eval, no new Function, no arbitrary code execution
 * 
 * @param operand - The operand to resolve (string, template, or direct value)
 * @param item - The item/context that becomes `this` during resolution
 * @param additionalContext - Additional context properties (optional)
 * @returns The resolved value
 */
export function resolveOperand(operand: any, item: any, additionalContext?: any): any {
  if (typeof operand !== 'string') return operand;

  console.debug('🔍 resolveOperand called with operand:', operand, 'item:', item);

  const context = buildContext(item, additionalContext);

  // Template literal
  if (operand.includes('${')) {
    return resolveTemplate(operand, context);
  }

  // Property access or function call
  return resolveTemplateProperty(context, operand);
}

// Utility type guards
export function isNestedProperty(str: string): boolean {
  return /^[a-zA-Z_$][\w$]*(\.[a-zA-Z_$][\w$]*|\[\d+\])*$/.test(str);
}

export function isFunctionCall(str: string): boolean {
  return /^[a-zA-Z_$][\w.$]*\([^)]*\)$/.test(str);
}

export function isFunctionCallWithArgs(str: string): boolean {
  return /^[a-zA-Z_$][\w.$]*\([^)]*\)$/.test(str) && str.includes('(') && !str.match(/\(\s*\)$/);
}

export function isSignal(obj: any): boolean {
  return obj && typeof obj === 'object' && typeof obj.get === 'function';
}

// Context builder for DDOM components
export const buildContext = (component: any, additionalProps?: any) => ({
  this: component,
  window: globalThis.window,
  document: globalThis.document,
  ...additionalProps,
  // Auto-include all $-prefixed properties from component
  ...Object.fromEntries(
    Object.entries(component || {})
      .filter(([key]) => key.startsWith('$'))
      .map(([key, value]) => [key, value])
  )
});

// Enhanced resolver that auto-builds DDOM context
export const resolveDDOMTemplate = (template: string, component: any, additionalProps?: any): string =>
  resolveTemplate(template, buildContext(component, additionalProps));