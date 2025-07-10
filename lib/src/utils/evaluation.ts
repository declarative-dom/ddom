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
 * Simple accessor expression resolver that preserves signals and handles function calls.
 * Used for direct property access, namespace configs, and maintaining reactivity.
 * Does NOT unwrap signals - returns them as-is for manual .get()/.set() operations.
 * 
 * @param {any} obj - The root object to traverse
 * @param {string} path - Property path to resolve (e.g., 'user.name', 'this.$coords().lat')
 * @param {any} [fallback=null] - Value to return if resolution fails
 * @returns {any} The resolved value, preserving signal objects
 * 
 * @example
 * resolveAccessor(obj, 'user.$name'); // Returns Signal object
 * resolveAccessor(obj, 'this.$coords().lat'); // Calls function, accesses property
 * resolveAccessor(obj, 'items[0].data'); // Array access with property
 */
export const resolveAccessor = (obj: any, path: string, fallback: any = null): any => {
  try {
    return evaluateChain(obj, path) ?? fallback;
  } catch (error) {
    console.warn('Accessor expression resolution failed:', path, error);
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
  console.debug('🔍 evaluateChain called with:', path);

  // Split on dots first, then handle array indices within each part
  const parts = path.split('.');
  console.debug('🔍 evaluateChain parts:', parts);

  return parts.reduce((current, part, index) => {
    console.debug('🔍 evaluateChain processing part:', part, 'current:', current);
    
    // Handle optional chaining - check for ? at the END of the part (from ?.split)
    const isOptional = part.endsWith('?');
    const cleanPart = part.replace(/\?$/, '').trim();
    console.debug('🔍 evaluateChain isOptional:', isOptional, 'cleanPart:', cleanPart);

    if (isOptional && current == null) {
      console.debug('🔍 evaluateChain optional chain stopped at null');
      return undefined;
    }

    // Always unwrap signals before accessing properties
    if (current?.get && typeof current.get === 'function') {
      console.debug('🔍 evaluateChain unwrapping signal');
      current = current.get();
      if (isOptional && current == null) return undefined;
    }

    if (!current) return current;

    // Handle array access with property: item[1]
    const arrayMatch = cleanPart.match(/^([a-zA-Z_$][\w$]*)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, baseName, indexStr] = arrayMatch;
      const base = current[baseName];
      return base ? base[parseInt(indexStr)] : undefined;
    }

    // Handle function call: method()
    const funcMatch = cleanPart.match(/^([a-zA-Z_$][\w$]*)\(([^)]*)\)$/);
    if (funcMatch) {
      const [, name, argsStr] = funcMatch;
      const func = current[name];
      if (typeof func === 'function') {
        const args = parseArgs(argsStr, current);
        return func.call(current, ...args);
      }
      return undefined;
    }

    // Simple property access
    const result = current[cleanPart];
    console.debug('🔍 evaluateChain property access result:', result);
    return result;
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
    console.debug('🔍 parseArgs processing:', trimmed);
    const result = isLiteral(trimmed) ? parseLiteral(trimmed) : resolveAccessor(context, trimmed);
    console.debug('🔍 parseArgs result:', trimmed, '→', result);
    return result;
  });
};

/**
 * Value type classification with regex patterns and functions.
 * Simplified for template display and concatenation use cases.
 */
const VALUE_PATTERNS = {
  TEMPLATE: /\$\{/,           // Template literals: 'Hello ${name}'
  ACCESSOR: /^(window\.|document\.|this\.)/,  // Property accessors: 'window.data'
  // ACCESSOR: /^[a-zA-Z_$][\w$]*(\.[a-zA-Z_$][\w$]*|\[\d+\](\.[a-zA-Z_$][\w$]*)*)*(\(\))?$/,  // more complex property accessors detection (not used currently)
  FUNCTION_CALL: /^[a-zA-Z_$][\w.$]*\([^)]*\)$/,  // Function calls: 'getData()', 'user.getName()'
  LITERAL_STRING: /^(['"`]).*\1$/,  // Quoted strings: '"hello"', "'world'"
  LITERAL_NUMBER: /^\d+(\.\d+)?$/,  // Numbers: '42', '3.14'
  LITERAL_BOOLEAN: /^(true|false)$/,  // Booleans: 'true', 'false'
  LITERAL_NULL: /^(null|undefined)$/,  // Null values: 'null', 'undefined'
  HAS_OPERATORS: /(\|\||&&|===|!==|==|!=|>=|<=|>|<|\+|includes|startsWith|endsWith|matches|in)/,
  TERNARY: /^(.+?)\s*(?<!\?)\?\s*(?!\.)(.+?)\s*:\s*(.+)$/,
  SIGNAL: (v: any) => v?.get && typeof v.get === 'function',
  FUNCTION: (v: any) => typeof v === 'function'
} as const;

/**
 * Detects if a string represents a literal value.
 * Uses VALUE_PATTERNS for consistent classification.
 */
const isLiteral = (str: string): boolean => {
  const trimmed = str.trim();
  return VALUE_PATTERNS.LITERAL_STRING.test(trimmed) ||
    VALUE_PATTERNS.LITERAL_NUMBER.test(trimmed) ||
    VALUE_PATTERNS.LITERAL_BOOLEAN.test(trimmed) ||
    VALUE_PATTERNS.LITERAL_NULL.test(trimmed);
};

/**
 * Parses a literal string into its actual JavaScript value.
 * Uses VALUE_PATTERNS for consistent classification.
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
  if (VALUE_PATTERNS.LITERAL_STRING.test(trimmed)) return trimmed.slice(1, -1);
  if (VALUE_PATTERNS.LITERAL_NUMBER.test(trimmed)) return Number(trimmed);
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;
  return trimmed;
};

/**
 * Function call evaluator with safe global function support.
 * Uses VALUE_PATTERNS for consistent pattern matching.
 * 
 * @param {string} expr - The function call expression to evaluate
 * @param {any} context - Context object for resolving function and arguments
 * @returns {any} The result of the function call, or null if function not found/safe
 */
const evaluateFunction = (expr: string, context: any): any => {
  if (!VALUE_PATTERNS.FUNCTION_CALL.test(expr)) return null;

  const match = expr.match(/^([a-zA-Z_$][\w.$]*)\(([^)]*)\)$/);
  if (!match) return null;

  const [, funcPath, argsStr] = match;

  // Parse arguments with the same context that has access to window, etc.
  const args = parseArgs(argsStr, context).map(arg =>
    arg?._resolveLater ? resolveAccessor(context, arg._resolveLater) : arg
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
    console.debug('🔍 Calling global function:', funcPath, 'with args:', args);
    // Unwrap any signal arguments for global functions
    const unwrappedArgs = args.map(arg => unwrapSignal(arg));
    console.debug('🔍 Unwrapped args:', unwrappedArgs);
    return globals[funcPath](...unwrappedArgs);
  }

  // Context method calls - resolve object path and call method
  const obj = resolveAccessor(context, funcPath.split('.').slice(0, -1).join('.')) || context;
  const methodName = funcPath.split('.').pop()!;
  const method = obj?.[methodName];

  return typeof method === 'function' ? method.call(obj, ...args) : null;
};



/**
 * Simple comparison evaluator - no tokenization, just basic operators.
 * Handles both property-based and value-based comparisons for filter.ts compatibility.
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
export type Operator = '===' | '!==' | '==' | '!=' | '>=' | '<=' | '>' | '<' | 'includes' | 'startsWith' | 'endsWith';

/**
 * Simple comparison evaluator - no tokenization, just basic operators.
 * Handles both property-based and value-based comparisons for filter.ts compatibility.
 * 
 * @param {string} expr - The comparison expression to evaluate
 * @param {any} context - Context for resolving operand values
 * @returns {any} The comparison result, or null if not a comparison expression
 */
export const evaluateComparison = (expr: string, context: any): any => {
  const operators = ['===', '!==', '==', '!=', '>=', '<=', '>', '<', 'includes', 'startsWith', 'endsWith'];

  for (const op of operators) {
    if (expr.includes(` ${op} `)) {
      const [left, right] = expr.split(` ${op} `).map(s => s.trim());

      // Handle both property resolution and direct values (for filter.ts)
      let leftVal, rightVal;

      if (context.hasOwnProperty('leftValue') && context.hasOwnProperty('rightValue')) {
        // Direct values from filter.ts
        leftVal = context.leftValue;
        rightVal = context.rightValue;
      } else {
        // Property resolution for templates
        leftVal = isLiteral(left) ? parseLiteral(left) : (() => {
          const resolved = resolveAccessor(context, left);
          return VALUE_PATTERNS.SIGNAL(resolved) ? resolved.get() : resolved;
        })();

        rightVal = isLiteral(right) ? parseLiteral(right) : (() => {
          const resolved = resolveAccessor(context, right);
          return VALUE_PATTERNS.SIGNAL(resolved) ? resolved.get() : resolved;
        })();
      }

      switch (op) {
        case '===': return leftVal === rightVal;
        case '!==': return leftVal !== rightVal;
        case '==': return leftVal == rightVal;
        case '!=': return leftVal != rightVal;
        case '>=': return leftVal >= rightVal;
        case '<=': return leftVal <= rightVal;
        case '>': return leftVal > rightVal;
        case '<': return leftVal < rightVal;
        case 'includes': return String(leftVal).includes(String(rightVal));
        case 'startsWith': return String(leftVal).startsWith(String(rightVal));
        case 'endsWith': return String(leftVal).endsWith(String(rightVal));
      }
    }
  }

  return null;
};

/**
 * Template expression evaluator using simple sequential parsing.
 * Handles the core template use cases without complex tokenization.
 * 
 * @param {string} expr - The template expression to evaluate
 * @param {any} context - Context object for variable resolution
 * @returns {any} The evaluated result with signals unwrapped
 */
const evaluateTemplateExpression = (expr: string, context: any): any => {
  console.debug('🔍 evaluateTemplateExpression called with:', expr);

  // String concatenation: operand + operand (simple case)
  if (expr.includes(' + ') && !expr.includes('?')) {
    console.debug('🔍 String concatenation detected');
    const parts = expr.split(' + ').map(part => {
      const trimmed = part.trim();
      if (isLiteral(trimmed)) return parseLiteral(trimmed);

      // Handle function calls in concatenation
      if (VALUE_PATTERNS.FUNCTION_CALL.test(trimmed)) {
        const result = evaluateFunction(trimmed, context);
        return VALUE_PATTERNS.SIGNAL(result) ? result.get() : result;
      }

      // Resolve and unwrap automatically
      const resolved = resolveAccessor(context, trimmed);
      return VALUE_PATTERNS.SIGNAL(resolved) ? resolved.get() : resolved;
    });
    return parts.join('');
  }

  // Ternary: condition ? true : false
  if (VALUE_PATTERNS.TERNARY.test(expr)) {
    const ternaryMatch = expr.match(VALUE_PATTERNS.TERNARY);
    if (ternaryMatch) {
      const [, condition, truthy, falsy] = ternaryMatch;
      console.debug('🔍 Ternary detected - condition:', condition, 'truthy:', truthy, 'falsy:', falsy);

      // Evaluate condition: spaces = comparison, no spaces = truthiness
      let conditionResult;
      if (condition.trim().includes(' ')) {
        conditionResult = evaluateComparison(condition.trim(), context);
        if (conditionResult === null) {
          const resolved = resolveAccessor(context, condition.trim());
          conditionResult = VALUE_PATTERNS.SIGNAL(resolved) ? resolved.get() : resolved;
        }
      } else {
        const resolved = resolveAccessor(context, condition.trim());
        conditionResult = VALUE_PATTERNS.SIGNAL(resolved) ? resolved.get() : resolved;
      }

      console.debug('🔍 Condition result:', conditionResult);

      const resultPath = conditionResult ? truthy.trim() : falsy.trim();

      // IMPORTANT: If the result branch contains operators, evaluate it as an expression!
      if (isLiteral(resultPath)) {
        return parseLiteral(resultPath);
      } else if (resultPath.includes(' + ') || resultPath.includes('(')) {
        // It's an expression, evaluate it recursively
        return evaluateTemplateExpression(resultPath, context);
      } else {
        // Simple property access
        const resolved = resolveAccessor(context, resultPath);
        return VALUE_PATTERNS.SIGNAL(resolved) ? resolved.get() : resolved;
      }
    }
  }

  // Logical OR: first || second || third
  if (expr.includes(' || ')) {
    for (const part of expr.split(' || ')) {
      const trimmed = part.trim();
      const value = isLiteral(trimmed) ? parseLiteral(trimmed) : (() => {
        const resolved = resolveAccessor(context, trimmed);
        return VALUE_PATTERNS.SIGNAL(resolved) ? resolved.get() : resolved;
      })();
      if (value) return value;
    }
    return undefined;
  }

  // Logical AND: first && second && third
  if (expr.includes(' && ')) {
    let result = true;
    for (const part of expr.split(' && ')) {
      const trimmed = part.trim();
      const value = isLiteral(trimmed) ? parseLiteral(trimmed) : (() => {
        const resolved = resolveAccessor(context, trimmed);
        return VALUE_PATTERNS.SIGNAL(resolved) ? resolved.get() : resolved;
      })();
      result = result && value;
      if (!result) return false;
    }
    return result;
  }

  // Simple comparison - use existing evaluateComparison
  const comparisonResult = evaluateComparison(expr, context);
  if (comparisonResult !== null) return comparisonResult;

  // Function call - only if the entire expression is a function call
  if (VALUE_PATTERNS.FUNCTION_CALL.test(expr)) {
    const result = evaluateFunction(expr, context);
    console.debug('🔍 Function call:', expr, '→', result);
    return VALUE_PATTERNS.SIGNAL(result) ? result.get() : result;
  }

  // Simple property access - resolve and unwrap
  const resolved = resolveAccessor(context, expr);
  const result = VALUE_PATTERNS.SIGNAL(resolved) ? resolved.get() : resolved;
  console.debug('🔍 Property access:', expr, '→', result);
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
      const result = evaluateTemplateExpression(expr.trim(), context);
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
        return resolveAccessor(context, path, fallback);
      }
      // Regular strings are returned as-is
      return path;
    }

    // Function call with args - return result directly
    if (path.includes('(') && path.includes(')')) {
      return evaluateFunction(path, context);
    }

    // Property access - preserve signals
    return resolveAccessor(context, path, fallback);
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

  return result;
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
  VALUE_PATTERNS.ACCESSOR.test(str)

/**
 * Detects if a string represents a function call with arguments.
 * Uses VALUE_PATTERNS for consistent pattern matching.
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
  VALUE_PATTERNS.FUNCTION_CALL.test(str);

/**
 * Detects if an object is a Signal.
 * Uses VALUE_PATTERNS for consistent pattern matching.
 * 
 * @param {any} obj - The object to test
 * @returns {boolean} True if the object is a Signal
 * 
 * @example
 * isSignal(new Signal(42)); // true
 * isSignal({}); // false
 */
export const isSignal = (obj: any): boolean =>
  VALUE_PATTERNS.SIGNAL(obj);


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
  resolveAccessor,
  resolveOperand,
  buildContext,
  isValidAccessor,
  isFunctionCall,
  isSignal
};