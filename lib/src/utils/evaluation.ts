/**
 * Modular DDOM Expression Evaluator
 * Ultra-concise, predictable signal resolution with function call support.
 * Signals preserved for accessors, auto-unwrapped only in templates.
 * 
 * @fileoverview Provides safe evaluation of JavaScript expressions, property access,
 * and template literals for DDOM applications. Features automatic signal detection
 * and unwrapping, complex chain resolution, and safe function calls.
 * 
 */

/**
 * Automatically unwraps TC39 signals by calling their .get() method.
 * Only used in template contexts where values need to be displayed.
 * 
 * @param {any} value - The value to potentially unwrap
 * @returns {any} The unwrapped value if it's a signal, otherwise the original value
 * 
 * @example
 * const signal = new Signal(42);
 * unwrapSignal(signal); // 42
 * unwrapSignal("hello"); // "hello"
 */
const unwrapSignal = (value: any): any => 
  value?.get && typeof value.get === 'function' ? value.get() : value;

/**
 * Core property resolver that preserves signals and handles function calls.
 * Traverses object property paths while maintaining signal objects.
 * 
 * @param {any} obj - The root object to traverse
 * @param {string} path - Property path to resolve (e.g., 'user.name', 'items[0]')
 * @param {any} [fallback=null] - Value to return if resolution fails
 * @returns {any} The resolved value, preserving signals
 * 
 * @example
 * resolveProperty(obj, 'user.name'); // Returns user.name (may be a signal)
 * resolveProperty(obj, 'this.$coords().lat'); // Calls function, accesses property
 */
export const resolveProperty = (obj: any, path: string, fallback: any = null): any => {
  try {
    return evaluateChain(obj, path) ?? fallback;
  } catch (error) {
    console.warn('Property resolution failed:', path, error);
    return fallback;
  }
};

/**
 * Chain evaluator using regex-based parsing with optional chaining support.
 * Handles complex property chains including function calls, array indexing, and optional chaining.
 * 
 * @param {any} obj - The starting object for chain evaluation
 * @param {string} path - The property chain path to evaluate
 * @returns {any} The final resolved value from the chain
 * 
 * @example
 * evaluateChain(obj, 'user.getName().toUpperCase()'); 
 * evaluateChain(obj, 'user?.profile?.name'); // Optional chaining
 * evaluateChain(obj, 'this.$currentCoords()?.lat'); // Mixed optional chaining
 */
const evaluateChain = (obj: any, path: string): any => {
  // Enhanced regex to capture optional chaining markers
  const segments = path.match(/(\?\.)?\s*([a-zA-Z_$][\w$]*(?:\([^)]*\))?|\[\d+\])/g) || [];
  
  return segments.reduce((current, segment) => {
    // Check for optional chaining marker
    const isOptional = segment.startsWith('?.');
    const cleanSegment = segment.replace(/^\?\./, '').trim();
    
    // Return undefined for optional chaining if current is null/undefined
    if (isOptional && current == null) return undefined;
    
    // Always unwrap signals before accessing properties
    if (current?.get && typeof current.get === 'function') {
      current = current.get();
      // For optional chaining, return undefined if unwrapped signal is null
      if (isOptional && current == null) return undefined;
    }
    
    if (!current) return current;
    
    // Function call: name(args)
    const funcMatch = cleanSegment.match(/^([a-zA-Z_$][\w$]*)\(([^)]*)\)$/);
    if (funcMatch) {
      const [, name, argsStr] = funcMatch;
      const func = current[name];
      if (typeof func === 'function') {
        const args = parseArgs(argsStr, current);
        return func.call(current, ...args);
      }
      return isOptional ? undefined : undefined; // Consistent behavior
    }
    
    // Array index: [123]
    const indexMatch = cleanSegment.match(/^\[(\d+)\]$/);
    if (indexMatch) {
      return current[parseInt(indexMatch[1])];
    }
    
    // Property access: name
    return current[cleanSegment];
  }, obj);
};

/**
 * Ultra-concise argument parser using regex to handle function call arguments.
 * Respects quoted strings, nested parentheses, and brackets while splitting on commas.
 * 
 * @param {string} argsStr - The arguments string from a function call
 * @param {any} context - Context object for resolving argument references
 * @returns {any[]} Array of parsed and resolved argument values
 * 
 * @example
 * parseArgs('user.name, "hello world", func(a, b)', context);
 * // Returns: [resolvedUserName, "hello world", functionResult]
 */
const parseArgs = (argsStr: string, context: any): any[] => {
  if (!argsStr.trim()) return [];
  
  // Regex to split on commas while respecting quotes and nested parens/brackets
  const args = argsStr.match(/(?:[^,"'()\[\]]+|"[^"]*"|'[^']*'|\([^)]*\)|\[[^\]]*\])+/g) || [];
  
  return args.map(arg => {
    const trimmed = arg.replace(/^,+|,+$/g, '').trim(); // Remove leading/trailing commas
    return isLiteral(trimmed) ? parseLiteral(trimmed) : resolveProperty(context, trimmed);
  });
};

/**
 * Detects if a string represents a literal value.
 * Supports strings, numbers, booleans, null, and undefined.
 * 
 * @param {string} str - The string to test
 * @returns {boolean} True if the string is a literal value
 * 
 * @example
 * isLiteral('"hello"'); // true
 * isLiteral('42'); // true
 * isLiteral('true'); // true
 * isLiteral('user.name'); // false
 */
const isLiteral = (str: string): boolean => 
  /^(['"`]).*\1$|^\d+(\.\d+)?$|^(true|false|null|undefined)$/.test(str.trim());

/**
 * Parses a literal string into its actual JavaScript value.
 * Handles strings, numbers, booleans, null, and undefined.
 * 
 * @param {string} str - The literal string to parse
 * @returns {any} The parsed JavaScript value
 * 
 * @example
 * parseLiteral('"hello"'); // "hello"
 * parseLiteral('42'); // 42
 * parseLiteral('true'); // true
 * parseLiteral('null'); // null
 */
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

/**
 * Function call evaluator with safe global function support.
 * Provides access to common JavaScript globals while preventing arbitrary code execution.
 * 
 * @param {string} expr - The function call expression to evaluate
 * @param {any} context - Context object for resolving function and arguments
 * @returns {any} The result of the function call, or null if function not found/safe
 * 
 * @example
 * evaluateFunction('Object.entries(data)', context);
 * evaluateFunction('user.getName()', context);
 * evaluateFunction('Math.max(1, 2, 3)', context);
 */
const evaluateFunction = (expr: string, context: any): any => {
  const match = expr.match(/^([a-zA-Z_$][\w.$]*)\(([^)]*)\)$/);
  if (!match) return null;
  
  const [, funcPath, argsStr] = match;
  const args = parseArgs(argsStr, context).map(arg => 
    arg?._resolveLater ? resolveProperty(context, arg._resolveLater) : arg
  );

  // Safe globals - prevents arbitrary code execution
  const globals: Record<string, Function> = {
    'Object.entries': Object.entries,
    'Object.keys': Object.keys,
    'Object.values': Object.values,
    'Array.from': Array.from,
    'Array.isArray': Array.isArray,
    'JSON.stringify': JSON.stringify,
    'JSON.parse': JSON.parse,
    'Date': ((...args: any[]) => new (Date as any)(...args)) as (...args: any[]) => Date,
    'Date.now': Date.now
  };

  if (globals[funcPath]) {
    return globals[funcPath](...args);
  }

  // Context method calls - resolve object path and call method
  const obj = resolveProperty(context, funcPath.split('.').slice(0, -1).join('.')) || context;
  const methodName = funcPath.split('.').pop()!;
  const method = obj?.[methodName];
  
  return typeof method === 'function' ? method.call(obj, ...args) : null;
};

/**
 * Comparison operators for safe expression evaluation.
 * Maps operator strings to their corresponding functions.
 */
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
 * Evaluates comparison expressions safely without eval().
 * Supports all common comparison operators with proper precedence.
 * 
 * @param {string} expr - The comparison expression to evaluate
 * @param {any} context - Context for resolving operand values
 * @returns {any} The comparison result, or null if not a comparison expression
 * 
 * @example
 * evaluateComparison('user.age >= 18', context); // true/false
 * evaluateComparison('count < 10', context); // true/false
 * evaluateComparison('status === "active"', context); // true/false
 */
export const evaluateComparison = (expr: string, context: any): any => {
  for (const [op, fn] of Object.entries(operators)) {
    const regex = new RegExp(`\\s+${op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`);
    if (regex.test(expr)) {
      const [left, right] = expr.split(regex).map(s => s.trim());
      const leftVal = isLiteral(left) ? parseLiteral(left) : unwrapSignal(resolveProperty(context, left));
      const rightVal = isLiteral(right) ? parseLiteral(right) : unwrapSignal(resolveProperty(context, right));
      return fn(leftVal, rightVal);
    }
  }
  return null;
};

/**
 * Safe expression evaluator with operator precedence support.
 * Handles ternary operators, logical operators, comparisons, and function calls
 * without using eval() or Function constructor.
 * 
 * @param {string} expr - The expression to evaluate
 * @param {any} context - Context object for variable resolution
 * @returns {any} The evaluated result
 * 
 * @example
 * evaluateExpression('user.age >= 18 ? "adult" : "minor"', context);
 * evaluateExpression('name || "Unknown"', context);
 * evaluateExpression('isActive && user.name', context);
 */
const evaluateExpression = (expr: string, context: any): any => {
  console.debug('🔍 evaluateExpression called with:', expr, 'context keys:', Object.keys(context));
  
  // Ternary: condition ? true : false
  const ternaryMatch = expr.match(/^(.+?)\s*\?\s*(.+?)\s*:\s*(.+)$/);
  if (ternaryMatch) {
    const [, condition, truthy, falsy] = ternaryMatch;
    const conditionResult = evaluateComparison(condition.trim(), context) ?? 
                           unwrapSignal(resolveProperty(context, condition.trim()));
    const resultPath = conditionResult ? truthy.trim() : falsy.trim();
    return isLiteral(resultPath) ? parseLiteral(resultPath) : unwrapSignal(resolveProperty(context, resultPath));
  }

  // Logical OR: fallback chaining
  if (expr.includes('||')) {
    return expr.split('||')
      .map(p => p.trim())
      .reduce((result, path) => result ?? 
        (isLiteral(path) ? parseLiteral(path) : unwrapSignal(resolveProperty(context, path))), undefined);
  }

  // Logical AND: truthy chaining
  if (expr.includes('&&')) {
    return expr.split('&&')
      .map(p => p.trim())
      .reduce((result, path) => result && 
        (isLiteral(path) ? parseLiteral(path) : unwrapSignal(resolveProperty(context, path))), true);
  }

  // Comparison
  const comparisonResult = evaluateComparison(expr, context);
  if (comparisonResult !== null) return comparisonResult;

  // Function call - only if the entire expression is a function call
  if (/^[a-zA-Z_$][\w.$]*\([^)]*\)$/.test(expr)) {
    const result = unwrapSignal(evaluateFunction(expr, context));
    console.debug('🔍 Function call in evaluateExpression:', expr, '→', result);
    return result;
  }

  // Complex property chain (may include function calls) - use chain evaluator
  if (expr.includes('(') || expr.includes('.')) {
    const result = unwrapSignal(resolveProperty(context, expr));
    console.debug('🔍 Property chain in evaluateExpression:', expr, '→', result);
    return result;
  }

  // Simple property access - unwrap for template context
  const result = unwrapSignal(resolveProperty(context, expr));
  console.debug('🔍 Property access in evaluateExpression:', expr, '→', result);
  return result;
};

/**
 * Main template literal resolver with automatic signal unwrapping.
 * Processes ${...} expressions in template strings using safe evaluation.
 * 
 * @param {string} template - The template string containing ${...} expressions
 * @param {any} context - Context object for resolving template variables
 * @returns {string} The resolved template string with expressions evaluated
 * 
 * @example
 * resolveTemplate('Hello ${user.name}!', context); // "Hello John!"
 * resolveTemplate('Count: ${items.length || 0}', context); // "Count: 5"
 * resolveTemplate('${user.age >= 18 ? "adult" : "minor"}', context); // "adult"
 */
export const resolveTemplate = (template: string, context: any): string =>
  template.replace(/\$\{([^}]+)\}/g, (match, expr) => {
    try {
      const result = evaluateExpression(expr.trim(), context);
      return String(result ?? match);
    } catch (error) {
      console.warn('Template evaluation failed:', error);
      return match;
    }
  });

/**
 * Property resolver for non-template contexts that preserves signals.
 * Returns actual signal objects rather than their unwrapped values,
 * allowing for manual .get()/.set() operations.
 * 
 * @param {any} context - Context object to resolve properties from
 * @param {string} path - Property path or function call to resolve
 * @param {any} [fallback=null] - Value to return if resolution fails
 * @returns {any} The resolved value, preserving signal objects
 * 
 * @example
 * resolveTemplateProperty(context, 'user.$name'); // Returns signal object
 * resolveTemplateProperty(context, 'this.$count'); // Returns signal object
 * resolveTemplateProperty(context, 'getData()'); // Returns function result
 */
export const resolveTemplateProperty = (context: any, path: string, fallback: any = null): any => {
  try {
    // Handle property accessor strings (not template literals)
    if (typeof path === 'string' && !path.includes('${') && !path.includes('(')) {
      // Special case: 'this.$name' as a string should resolve to the signal
      if (path.startsWith('this.') || path.startsWith('window.') || path.startsWith('document.')) {
        return resolveProperty(context, path, fallback);
      }
      // Regular strings are returned as-is
      return path;
    }
    
    // Function call with args - return result directly
    if (path.includes('(') && path.includes(')')) {
      return evaluateFunction(path, context);
    }
    
    // Property access - preserve signals
    return resolveProperty(context, path, fallback);
  } catch (error) {
    console.warn('Property resolution failed:', path, error);
    return fallback;
  }
};

/**
 * Operand resolver for array operations that unwraps values when needed.
 * Used in array mapping, filtering, and other collection operations where
 * the final values are typically needed rather than signal objects.
 * 
 * @param {any} operand - The operand to resolve (string path, template, or direct value)
 * @param {any} item - The current item context (becomes 'this' in resolution)
 * @param {any} [additionalContext] - Additional context properties to include
 * @returns {any} The resolved and potentially unwrapped value
 * 
 * @example
 * resolveOperand('${item.name}', item, context); // "John" (unwrapped)
 * resolveOperand('item.active', item, context); // true (unwrapped)
 * resolveOperand(42, item, context); // 42 (direct value)
 */
export const resolveOperand = (operand: any, item: any, additionalContext?: any): any => {
  if (typeof operand !== 'string') return operand;

  const context = {
    this: item,
    window: globalThis.window,
    document: globalThis.document,
    ...additionalContext
  };

  // Template literal - auto-unwrap
  if (operand.includes('${')) {
    return resolveTemplate(operand, context);
  }

  // Property access - preserve signals unless explicitly unwrapping
  const result = resolveTemplateProperty(context, operand);
  
  // For array operations, we usually want the unwrapped value
  return unwrapSignal(result);
};

/**
 * Validates if a string is a valid property accessor pattern.
 * Supports property chains, array indexing, and optional function calls.
 * 
 * @param {string} str - The string to validate
 * @returns {boolean} True if the string is a valid accessor pattern
 * 
 * @example
 * isValidAccessor('user.name'); // true
 * isValidAccessor('items[0].data'); // true
 * isValidAccessor('getData()'); // true
 * isValidAccessor('user..name'); // false
 */
export const isValidAccessor = (str: string): boolean =>
  /^[a-zA-Z_$][\w$]*(\.[a-zA-Z_$][\w$]*|\[\d+\])*(\(\))?$/.test(str);

/**
 * Detects if a string represents a function call with arguments.
 * 
 * @param {string} str - The string to test
 * @returns {boolean} True if the string is a function call pattern
 * 
 * @example
 * isFunctionCall('getData()'); // true
 * isFunctionCall('process(arg1, arg2)'); // true
 * isFunctionCall('user.name'); // false
 */
export const isFunctionCall = (str: string): boolean =>
  /^[a-zA-Z_$][\w.$]*\([^)]*\)$/.test(str);

/**
 * Detects if an object is a Signal.
 * 
 * @param {any} obj - The object to test
 * @returns {boolean} True if the object is a Signal
 * 
 * @example
 * isSignal(new Signal(42)); // true
 * isSignal({}); // false
 */
export const isSignal = (obj: any): boolean =>
  obj && typeof obj === 'object' && typeof obj.get === 'function';


/**
 * Context builder for DDOM components that automatically includes signals.
 * Scans component for $-prefixed properties and includes them in context.
 * 
 * @param {any} component - The DDOM component object
 * @param {any} [additionalProps] - Additional properties to include in context
 * @returns {object} Complete context object with component signals and globals
 * 
 * @example
 * const context = buildContext(component, { extra: 'data' });
 * // Returns: { this: component, window: globalThis.window, $count: signal, ... }
 */
export const buildContext = (component: any, additionalProps?: any) => ({
  this: component,
  window: globalThis.window,
  document: globalThis.document,
  ...additionalProps,
  // Auto-include all $-prefixed properties from component
  ...Object.fromEntries(
    Object.entries(component)
      .filter(([key]) => key.startsWith('$'))
  )
});

/**
 * Default export containing all public API methods.
 * Provides both individual functions and convenient DDOM-specific methods.
 */
export default {
  evaluateComparison,
  resolveTemplate,
  resolveTemplateProperty,
  resolveProperty,
  resolveOperand,
  buildContext,
  isValidAccessor,
  isFunctionCall,
  isSignal
};