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

import { isLiteral, VALUE_PATTERNS } from '../utils/detection';

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
 * @param {string} path - Property path to resolve (e.g., 'user.name', 'this.$coords().lat')
 * @param {any} context - The root object to traverse
 * @param {any} [fallback=null] - Value to return if resolution fails
 * @returns {any} The resolved value, preserving signal objects
 * 
 * @example
 * resolveAccessor('user.$name', obj); // Returns Signal object
 * resolveAccessor('this.$coords().lat', obj); // Calls function, accesses property
 * resolveAccessor('items[0].data', obj); // Array access with property
 */
const resolveAccessor = (path: string, context: any, fallback: any = null): any => {
  if (!path) {
    return fallback;
  }
  try {
    if (VALUE_PATTERNS.COMPLEX_ACCESSOR.test(path)) {
      // if it's an advanced accessor, evaluate the chain
      return evaluateChain(path, context) ?? fallback;
    } else if (Object.hasOwn(context, path)) {
      // if it's a basic accessor, return the property directly
      return context[path] ?? fallback;
    } else {
      return path ?? fallback;
    }
  } catch (error) {
    console.warn('Accessor expression resolution failed:', path, error);
    return fallback;
  }
};

/**
 * Chain evaluator using regex-based parsing with optional chaining support.
 * Handles complex property chains including function calls, array indexing, and optional chaining.
 * 
 * @param {string} path - The property chain path to evaluate
 * @param {any} obj - The starting object for chain evaluation
 * @returns {any} The final resolved value from the chain
 * 
 * @example
 * evaluateChain('user.getName().toUpperCase()', obj); 
 * evaluateChain('user?.profile?.name', obj); // Optional chaining
 * evaluateChain('this.$currentCoords()?.lat', obj); // Mixed optional chaining
 */
const evaluateChain = (path: string, obj: any): any => {
  const parts = path.split('.');

  return parts.reduce((current, part, _index) => {
    // Handle optional chaining - check for ? at the END of the part (from ?.split)
    const isOptional = VALUE_PATTERNS.OPTIONAL_CHAIN.test(part);
    const cleanPart = part.replace(VALUE_PATTERNS.OPTIONAL_CHAIN, '').trim();

    if (isOptional && current == null) {
      return undefined;
    }

    // Always unwrap signals before accessing properties
    if (current?.get && typeof current.get === 'function') {
      current = current.get();
      if (isOptional && current == null) return undefined;
    }

    if (!current) return current;

    // Handle array access with property: item[1]
    const arrayMatch = cleanPart.match(VALUE_PATTERNS.ARRAY_ACCESS);
    if (arrayMatch) {
      const [, baseName, indexStr] = arrayMatch;
      const base = current[baseName];
      return base ? base[parseInt(indexStr)] : undefined;
    }

    // Handle function call: method()
    const funcMatch = cleanPart.match(VALUE_PATTERNS.FUNCTION_PARSE);
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
    return current[cleanPart];
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

  // Regex to split on commas while respecting quotes and nested parens/brackets  // Regex to split on commas while respecting quotes and nested parens/brackets
  const args = argsStr.match(VALUE_PATTERNS.ARG_SPLIT) || [];

  return args.map(arg => {
    const trimmed = arg.replace(/^,+|,+$/g, '').trim(); // Remove leading/trailing commas
    return isLiteral(trimmed) ? parseLiteral(trimmed) : resolveAccessor(trimmed, context);
  });
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

  const match = expr.match(VALUE_PATTERNS.FUNCTION_PARSE);
  if (!match) return null;

  const [, funcPath, argsStr] = match;

  // Parse arguments with the same context that has access to window, etc.
  const args = parseArgs(argsStr, context).map(arg =>
    arg?._resolveLater ? resolveAccessor(arg._resolveLater, context) : arg
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
    // Unwrap any signal arguments for global functions
    const unwrappedArgs = args.map(arg => unwrapSignal(arg));
    return globals[funcPath](...unwrappedArgs);
  }

  // Context method calls - resolve object path and call method
  const obj = resolveAccessor(funcPath.split('.').slice(0, -1).join('.'), context) || context;
  const methodName = funcPath.split('.').pop()!;
  const method = obj?.[methodName];

  return typeof method === 'function' ? method.call(obj, ...args) : null;
};



/**
 * Efficient comparison evaluator built around FilterCriteria.
 * Performs single operator lookup and evaluation for optimal performance.
 * 
 * @param {FilterCriteria} filter - The filter criteria with left/right operands and operator
 * @param {any} context - Context for resolving operand values
 * @returns {boolean} The comparison result
 * 
 * @example
 * evaluateFilter({ leftOperand: 'item.age', operator: '>=', rightOperand: 18 }, context);
 * evaluateFilter({ leftOperand: 'item.name', operator: 'includes', rightOperand: 'John' }, context);
 */
const evaluateFilter = (filter: any, context: any): boolean => {
  try {
    // Resolve operand values
    const leftValue = unwrapSignal(resolveAccessor(filter.leftOperand, context));
    const rightValue = unwrapSignal(resolveAccessor(filter.rightOperand, context));

    // Direct operator lookup for maximum performance
    switch (filter.operator) {
      case '===': return leftValue === rightValue;
      case '!==': return leftValue !== rightValue;
      case '==': return leftValue == rightValue;
      case '!=': return leftValue != rightValue;
      case '>=': return leftValue >= rightValue;
      case '<=': return leftValue <= rightValue;
      case '>': return leftValue > rightValue;
      case '<': return leftValue < rightValue;
      case '&&': return leftValue && rightValue;
      case '||': return leftValue || rightValue;
      case '!': return !leftValue;
      case 'includes': return String(leftValue).includes(String(rightValue));
      case 'startsWith': return String(leftValue).startsWith(String(rightValue));
      case 'endsWith': return String(leftValue).endsWith(String(rightValue));
      default:
        console.warn(`Unknown filter operator: ${filter.operator}`);
        return true; // Don't filter out on unknown operators
    }
  } catch (error) {
    console.warn('Filter evaluation failed:', error, filter);
    return true; // Don't filter out on errors
  }
};

/**
 * Template comparison evaluator that extracts FilterCriteria from string expressions.
 * Uses regex to parse comparison expressions and convert them to FilterCriteria format.
 * 
 * @param {string} expr - The comparison expression string (e.g., "user.age >= 18")
 * @param {any} context - Context for resolving template variables
 * @returns {boolean | null} The comparison result, or null if not a comparison expression
 * 
 * @example
 * evaluateComparison('user.age >= 18', context); // true/false
 * evaluateComparison('status === "active"', context); // true/false
 */
const evaluateComparison = (expr: string, context: any): boolean | null => {
  // Operator patterns ordered by specificity (longer operators first)
  const match = expr.trim().match(VALUE_PATTERNS.COMPARISON_OPS);

  if (match) {
    const [, left, operator, right] = match;

    // Create FilterCriteria and evaluate using the main filter function
    const filter = {
      leftOperand: left.trim(),
      operator: operator,
      rightOperand: right.trim()
    };

    return evaluateFilter(filter, context);
  }

  return null; // Not a comparison expression
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
  // String concatenation: operand + operand (simple case)
  if (expr.includes(' + ') && !expr.includes('?')) {
    const parts = expr.split(' + ').map(part => {
      const trimmed = part.trim();
      if (isLiteral(trimmed)) return parseLiteral(trimmed);

      // Handle function calls in concatenation
      if (VALUE_PATTERNS.FUNCTION_CALL.test(trimmed)) {
        const result = evaluateFunction(trimmed, context);
        return unwrapSignal(result);
      }        // Resolve and unwrap automatically
        const resolved = resolveAccessor(trimmed, context);
        return unwrapSignal(resolved);
    });
    return parts.join('');
  }

  // Ternary: condition ? true : false
  if (VALUE_PATTERNS.TERNARY.test(expr)) {
    const ternaryMatch = expr.match(VALUE_PATTERNS.TERNARY);
    if (ternaryMatch) {
      const [, condition, truthy, falsy] = ternaryMatch;

      // Evaluate condition: spaces = comparison, no spaces = truthiness
      let conditionResult;
      if (condition.trim().includes(' ')) {
        conditionResult = evaluateComparison(condition.trim(), context);
        if (conditionResult === null) {
          const resolved = resolveAccessor(context, condition.trim());
          conditionResult = unwrapSignal(resolved);
        }
      } else {
        const resolved = resolveAccessor(context, condition.trim());
        conditionResult = unwrapSignal(resolved);
      }

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
        return unwrapSignal(resolved);
      }
    }
  }

  // Logical OR: first || second || third
  if (expr.includes(' || ')) {
    for (const part of expr.split(' || ')) {
      const trimmed = part.trim();
      const value = isLiteral(trimmed) ? parseLiteral(trimmed) : (() => {
        const resolved = resolveAccessor(trimmed, context);
        return unwrapSignal(resolved);
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
        const resolved = resolveAccessor(trimmed, context);
        return unwrapSignal(resolved);
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
    return unwrapSignal(result);
  }

  // Simple property access - resolve and unwrap
  const resolved = resolveAccessor(expr, context);
  return unwrapSignal(resolved);
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
const resolveTemplate = (template: string, context: any): string =>
  template.replace(VALUE_PATTERNS.TEMPLATE_REPLACEMENT, (match, expr) => {
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
 * @param {string} path - Property path or function call to resolve
 * @param {any} context - Context object to resolve properties from
 * @param {any} [fallback=null] - Value to return if resolution fails
 * @returns {any} The resolved value, preserving signal objects
 * 
 * @example
 * resolveTemplateProperty('user.$name', context); // Returns signal object
 * resolveTemplateProperty('this.$count', context); // Returns signal object
 * resolveTemplateProperty('getData()', context); // Returns function result
 */
const resolveTemplateProperty = (path: string, context: any, fallback: any = null): any => {
  try {
    // Handle property accessor strings (not template literals)
    if (typeof path === 'string' && !path.includes('${') && !path.includes('(')) {
      // Special case: 'this.$name' as a string should resolve to the signal
      if (VALUE_PATTERNS.GLOBAL_ACCESSOR.test(path)) {
        return resolveAccessor(path, context, fallback);
      }
      // Regular strings are returned as-is
      return path;
    }

    // Function call with args - return result directly
    if (VALUE_PATTERNS.FUNCTION_CALL.test(path)) {
      return evaluateFunction(path, context);
    }

    // Property access - preserve signals
    return resolveAccessor(path, context, fallback);
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
const resolveOperand = (operand: any, item: any, additionalContext?: any): any => {
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
  const result = resolveTemplateProperty(operand, context);

  return result;
};


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
const buildContext = (component: any, additionalProps?: any) => ({
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
export {
  evaluateComparison,
  evaluateFilter,
  resolveAccessor,
  resolveOperand,
  resolveTemplate,
  resolveTemplateProperty,
  unwrapSignal,
};