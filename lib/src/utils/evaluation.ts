/**
 * Expression Evaluation Utilities
 * 
 * Shared utilities for evaluating JavaScript expressions, property access,
 * and template literals across all namespaces.
 */

/**
 * Checks if a string is a simple property name (no dots, no function calls)
 */
export function isNestedProperty(str: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[\d+\])*$/.test(str);
}

/**
 * Checks if a string is a function call with arguments (e.g., "Object.entries(arg)", "method()")
 */
export function isFunctionCallWithArgs(str: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*\([^)]*\)$/.test(str);
}

/**
 * Checks if a string is a simple function call (e.g., "this.method()", "obj.func()")
 */
export function isFunctionCall(str: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*\(\)$/.test(str);
}

/**
 * Checks if a string represents a literal value (string, number, boolean, null, undefined)
 */
function isLiteral(str: string): boolean {
  return /^(['"`]).*\1$|^\d+$|^(true|false|null|undefined)$/.test(str.trim());
}

/**
 * Checks if an object is a signal
 */
export function isSignal(obj: any): boolean {
  return obj && typeof obj === 'object' && typeof obj.get === 'function';
}

/**
 * Enhanced function call evaluator with support for safe global functions.
 * Supports Object.*, Array.*, JSON.*, and context method calls.
 * 
 * @param expr - Function call expression (e.g., "Object.entries(window.$examples)")
 * @param context - The context object for resolving arguments and methods
 * @returns The result of the function call
 */
function evaluateFunction(expr: string, context: any): any {
  const functionMatch = expr.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\(([^)]*)\)$/);
  if (!functionMatch) {
    return null;
  }
  
  const [, functionPath, argsString] = functionMatch;
  console.debug('🔧 Evaluating function call:', functionPath, 'with args:', argsString);
  
  // Parse arguments safely
  const args = argsString.trim() ? argsString.split(',').map(arg => {
    const trimmed = arg.trim();
    if (!trimmed) return undefined;
    
    // Handle literals
    if (isLiteral(trimmed)) {
      return parseLiteral(trimmed);
    }
    
    // Resolve from context with automatic signal resolution
    return resolveTemplateProperty(context, trimmed);
  }).filter(arg => arg !== undefined) : [];
  
  console.debug('🔧 Parsed function args:', args);
  
  // Handle safe global functions
  try {
    switch (functionPath) {
      case 'Object.entries':
        return Object.entries(args[0] || {});
      case 'Object.keys':
        return Object.keys(args[0] || {});
      case 'Object.values':
        return Object.values(args[0] || {});
      case 'Array.from':
        return Array.from(args[0] || []);
      case 'Array.isArray':
        return Array.isArray(args[0]);
      case 'JSON.stringify':
        return JSON.stringify(args[0], args[1], args[2]);
      case 'JSON.parse':
        return JSON.parse(args[0]);
      default:
        // Handle method calls on context objects
        const pathParts = functionPath.split('.');
        const methodName = pathParts.pop();
        const objectPath = pathParts.join('.');
        
        if (objectPath) {
          const obj = resolveTemplateProperty(context, objectPath);
          if (obj && typeof obj[methodName!] === 'function') {
            console.debug('🔧 Calling method:', methodName, 'on object:', obj);
            return obj[methodName!](...args);
          }
        } else {
          // Direct function call from context
          const fn = resolveTemplateProperty(context, functionPath);
          if (typeof fn === 'function') {
            console.debug('🔧 Calling function:', functionPath, 'from context');
            return fn(...args);
          }
        }
        
        console.warn('Function not found or not callable:', functionPath);
        return null;
    }
  } catch (error) {
    console.warn('Function call failed:', functionPath, error);
    return null;
  }
}

/**
 * Safe property resolver with fallback support
 * Supports both dots (obj.prop.subprop) and brackets (obj[0], obj['key'], obj[0].name)
 * 
 * @param obj - The object to traverse
 * @param path - Property path (e.g., 'user.name', 'items[0]', 'data[0].name')
 * @param fallback - Value to return if path resolution fails
 * @returns The resolved value, auto-resolved signal value, or fallback
 */
export function resolveProperty(obj: any, path: string, fallback: any = null): any {
  if (!obj || !path) return fallback;
  
  try {
    const resolved = path.split(/[.\[\]]+/).filter(Boolean).reduce((o, k) => o?.[k], obj);
    return resolved ?? fallback;
  } catch (error) {
    console.warn('resolveTemplatePropertyWithoutSignals failed for path:', path, error);
    return fallback;
  }
}

/**
 * Property resolver with automatic signal resolution and function call support.
 * 
 * @param obj - The object to traverse
 * @param path - Property path (e.g., 'user.name', 'items[0]', 'data[0].name') or function call ('this.method()')
 * @param fallback - Value to return if path resolution fails
 * @returns The resolved value, auto-resolved signal value, function call result, or fallback
 */
export function resolveTemplateProperty(obj: any, path: string, fallback: any = null): any {
  if (!obj || !path) return fallback;
  
  try {
    // Check if it's a function call with arguments
    if (isFunctionCallWithArgs(path)) {
      return evaluateFunction(path, obj);
    }
    
    // Check if it's a simple function call
    if (isFunctionCall(path)) {
      const functionPath = path.replace(/\(\)$/, ''); // Remove the ()
      const resolved = resolveProperty(obj, functionPath, fallback);
      
      // Call the function if it exists
      if (typeof resolved === 'function') {
        console.debug('🎯 Calling function:', path, 'on context');
        return resolved.call(obj); // Use call to preserve 'this' context
      } else {
        console.warn('Attempted to call non-function:', path, 'resolved to:', resolved);
        return fallback;
      }
    }
    
    // Regular property resolution
    const resolved = resolveProperty(obj, path, fallback);
    
    // 🎯 AUTO-RESOLVE SIGNALS! No explicit .get() needed
    if (isSignal(resolved)) {
      console.debug('🎯 Auto-resolving signal:', path, '→', resolved.get());
      return resolved.get();
    }
    
    return resolved ?? fallback;
  } catch (error) {
    console.warn('resolveTemplateProperty failed for path:', path, error);
    return fallback;
  }
}

/**
 * Safe template literal resolver with automatic signal resolution.
 * Supports ternary operators, logical operators, and property access.
 * NO eval, NO new Function - completely safe for user-generated content.
 *
 * @param template - The template string to resolve
 * @param context - The object to use as context for property resolution
 * @returns The template string resolved with safe evaluation
 */
export function resolveTemplate(
  template: string,
  context: object
): string {
  try {
    console.debug('🔧 resolveTemplate called with template:', template, 'context:', context);
    console.debug('🔧 Context properties:', Object.keys(context as any).filter(k => k.startsWith('$')));
    
    const result = template.replace(/\$\{([^}]+)\}/g, (match, expr) => {
      const trimmed = expr.trim();
      
      // Handle safe expressions (ternary, logical operators, comparisons)
      // Single regex to detect any operator: ?, ||, &&, ===, !==, ==, !=, <=, >=, <, >
      if (/\?|(\|\|)|(\&\&)|(===)|(!=)|(==)|(<=)|(>=)|(<)|(>)/.test(trimmed)) {
        const evaluated = evaluateSafeExpression(trimmed, context);
        return String(evaluated ?? match);
      }
      
      // Simple property access with automatic signal resolution
      const resolved = resolveTemplateProperty(context, trimmed, match);
      return String(resolved);
    });
    
    console.debug('🔧 Template result:', result);
    return result;
  } catch (error) {
    console.warn(`Template evaluation failed: ${error}, Template: ${template}`);
    console.debug('🔧 Available context properties:', Object.keys(context as any).filter(k => k.startsWith('$')));
    return template;
  }
}

/**
 * Safe comparison operators for template expressions and filters
 */
const OPERATORS = {
  '===': (a: any, b: any) => a === b,
  '!==': (a: any, b: any) => a !== b,
  '==': (a: any, b: any) => a == b,
  '!=': (a: any, b: any) => a != b,
  '<': (a: any, b: any) => a < b,
  '<=': (a: any, b: any) => a <= b,
  '>': (a: any, b: any) => a > b,
  '>=': (a: any, b: any) => a >= b,
  'includes': (a: any, b: any) => {
    if (typeof a === 'string' && typeof b === 'string') {
      return a.includes(b);
    }
    if (Array.isArray(a)) {
      return a.includes(b);
    }
    return false;
  },
  'startsWith': (a: any, b: any) => typeof a === 'string' && typeof b === 'string' && a.startsWith(b),
  'endsWith': (a: any, b: any) => typeof a === 'string' && typeof b === 'string' && a.endsWith(b),
  'in': (a: any, b: any) => {
    if (Array.isArray(b)) return b.includes(a);
    if (typeof b === 'object' && b !== null) return a in b;
    return false;
  },
  'regex': (a: any, b: any) => {
    if (typeof a !== 'string') return false;
    const regex = b instanceof RegExp ? b : new RegExp(b);
    return regex.test(a);
  }
} as const;

export type Operator = keyof typeof OPERATORS;

/**
 * Evaluates comparison expressions like "a < b", "count >= 5", etc.
 * Can be used by both template evaluation and array filtering.
 * Returns the comparison result, or null if the expression is not a comparison.
 */
export function evaluateComparison(expr: string, context: any): any {
  // Try all operators, longest first to handle <=, >=, etc. before <, >
  const operatorKeys = Object.keys(OPERATORS).sort((a, b) => b.length - a.length);
  
  for (const op of operatorKeys) {
    // Make sure we only split on the operator if it's surrounded by spaces or at word boundaries
    const opRegex = new RegExp(`\\s+${op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`);
    if (opRegex.test(expr)) {
      const parts = expr.split(opRegex);
      if (parts.length === 2) {
        const [left, right] = parts.map(p => p.trim());
        
        // Resolve both operands
        const leftValue = isLiteral(left) ? parseLiteral(left) : resolveTemplateProperty(context, left);
        const rightValue = isLiteral(right) ? parseLiteral(right) : resolveTemplateProperty(context, right);
        
        console.debug('🔍 Comparison:', leftValue, op, rightValue, '→', OPERATORS[op as Operator](leftValue, rightValue));
        
        // Apply the operator
        const operator = OPERATORS[op as Operator];
        if (operator) {
          return operator(leftValue, rightValue);
        }
      }
    }
  }
  
  return null; // Not a comparison expression
}

/**
 * Safe expression evaluator for complex template expressions.
 * Supports ternary operators, logical operators, comparison operators, and literal values.
 * NO eval, NO new Function - completely safe for user-generated content.
 */
function evaluateSafeExpression(expr: string, context: any): any {
  console.debug('🔍 evaluateSafeExpression called with:', expr);
  
  // Ternary operator: condition ? true : false
  const ternaryMatch = expr.match(/^(.+?)\s*\?\s*(.+?)\s*:\s*(.+)$/);
  if (ternaryMatch) {
    const [, condition, truthy, falsy] = ternaryMatch;
    console.debug('🔍 Ternary parts:', { condition: condition.trim(), truthy: truthy.trim(), falsy: falsy.trim() });
    
    const conditionValue = evaluateComparison(condition.trim(), context);
    console.debug('🔍 Condition evaluation result:', conditionValue);
    
    if (conditionValue === null) {
      // Not a comparison, try direct property resolution
      const directCondition = resolveTemplateProperty(context, condition.trim());
      console.debug('🔍 Direct condition result:', directCondition);
      const resultPath = directCondition ? truthy.trim() : falsy.trim();
      return isLiteral(resultPath) ? parseLiteral(resultPath) : resolveTemplateProperty(context, resultPath);
    } else {
      const resultPath = conditionValue ? truthy.trim() : falsy.trim();
      console.debug('🔍 Selected path:', resultPath, 'based on condition:', conditionValue);
      return isLiteral(resultPath) ? parseLiteral(resultPath) : resolveTemplateProperty(context, resultPath);
    }
  }
  
  // Logical OR: fallback chaining
  if (expr.includes('||')) {
    return expr.split('||').map(p => p.trim()).reduce((result, path) => 
      result ?? (isLiteral(path) ? parseLiteral(path) : resolveTemplateProperty(context, path)), undefined);
  }
  
  // Logical AND: truthy chaining  
  if (expr.includes('&&')) {
    return expr.split('&&').map(p => p.trim()).reduce((result, path) => 
      result && (isLiteral(path) ? parseLiteral(path) : resolveTemplateProperty(context, path)), true);
  }
  
  // Try comparison evaluation
  const comparisonResult = evaluateComparison(expr, context);
  if (comparisonResult !== null) {
    return comparisonResult;
  }
  
  // Simple property access
  return resolveTemplateProperty(context, expr);
}

/**
 * Parses a literal string into its actual value
 */
function parseLiteral(str: string): any {
  const trimmed = str.trim();
  if (/^(['"`])/.test(trimmed)) return trimmed.slice(1, -1);
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;
  return trimmed;
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
  // Direct values
  if (typeof operand !== 'string') {
    return operand;
  }
  
  console.debug('🔍 resolveOperand called with operand:', operand, 'item:', item);
  
  // Assemble the full context automatically
  const context = {
    this: item,           // item becomes `this`
    window: globalThis.window,
    document: globalThis.document,
    ...additionalContext  // Any additional properties
  };
  
  // Template literal - use safe template resolver
  if (operand.includes('${')) {
    return resolveTemplate(operand, context);
  }
  
  // Simple property access (e.g., "this.name", "window.rating", "item.value")
  if (isNestedProperty(operand)) {
    // Special handling for naked "item" - map it to "this"
    const resolvedOperand = operand === 'item' ? 'this' : operand;
    const result = resolveProperty(context, resolvedOperand);
    console.debug('🔍 resolveProperty result:', result, 'for operand:', operand);
    return result;
  }
  
  // Function call with arguments (e.g., "Object.entries(window.$examples)", "this.method(arg)")
  if (isFunctionCallWithArgs(operand)) {
    const result = resolveTemplateProperty(context, operand);
    console.debug('🔍 Function call with args result:', result, 'for operand:', operand);
    return result;
  }
  
  // Function call (e.g., "this.method()", "window.helper()")
  if (isFunctionCall(operand)) {
    const result = resolveTemplateProperty(context, operand);
    console.debug('🔍 Function call result:', result, 'for operand:', operand);
    return result;
  }
  
  // Direct string value
  return operand;
}