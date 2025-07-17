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
import type { ElementSpec, DOMNode } from '../dom/types';

/**
 * Interface for signal-like objects that can be unwrapped
 */
interface SignalLike {
  get(): PropertyValue;
}

/**
 * Valid DDOM property values that can be assigned to element properties
 */
type PropertyValue = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined
  | Function
  | object
  | PropertyValue[];

/**
 * Context object for property evaluation and template resolution
 * More flexible typing to accommodate the various context shapes in DDOM
 */
type EvaluationContext = Record<string, any> & {
  // Common DDOM context properties that may be present
  window?: any;
  document?: any;
  this?: any; // Could be ElementSpec or other context objects
};

/**
 * Type guard to check if a value is a signal-like object
 */
function isSignalLike(value: PropertyValue): value is SignalLike {
  return typeof value === 'object' && value !== null && 'get' in value && typeof (value as any).get === 'function';
}

/**
 * Automatically unwraps TC39 signals by calling their .get() method.
 * Only used in template contexts where values need to be displayed.
 * 
 * @param {PropertyValue} value - The value to potentially unwrap
 * @returns {PropertyValue} The unwrapped value if it's a signal, otherwise the original value
 * 
 * @example
 * const signal = new Signal(42);
 * unwrapSignal(signal); // 42
 * unwrapSignal("hello"); // "hello"
 */
const unwrapSignal = (value: PropertyValue): PropertyValue =>
  isSignalLike(value) ? value.get() : value;

/**
 * Simple accessor expression resolver that preserves signals and handles function calls.
 * Used for direct property access, namespace configs, and maintaining reactivity.
 * Does NOT unwrap signals - returns them as-is for manual .get()/.set() operations.
 * 
 * @param {EvaluationContext} obj - The root object to traverse
 * @param {string} path - Property path to resolve (e.g., 'user.name', 'this.$coords().lat')
 * @param {PropertyValue} [fallback=null] - Value to return if resolution fails
 * @returns {PropertyValue} The resolved value, preserving signal objects
 * 
 * @example
 * resolveAccessor(obj, 'user.$name'); // Returns Signal object
 * resolveAccessor(obj, 'this.$coords().lat'); // Calls function, accesses property
 * resolveAccessor(obj, 'items[0].data'); // Array access with property
 */
const resolveAccessor = (obj: EvaluationContext, path: string, fallback: PropertyValue = null): PropertyValue => {
  if (!path) {
    return fallback;
  }
  try {
    if (VALUE_PATTERNS.COMPLEX_ACCESSOR.test(path)) {
      // if it's an advanced accessor, evaluate the chain
      return evaluateChain(obj, path) ?? fallback;
    } else if (Object.hasOwn(obj, path)) {
      // if it's a basic accessor, return the property directly
      return obj[path] ?? fallback;
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
 * @param {EvaluationContext} obj - The starting object for chain evaluation
 * @param {string} path - The property chain path to evaluate
 * @returns {PropertyValue} The final resolved value from the chain
 * 
 * @example
 * evaluateChain(obj, 'user.getName().toUpperCase()'); 
 * evaluateChain(obj, 'user?.profile?.name'); // Optional chaining
 * evaluateChain(obj, 'this.$currentCoords()?.lat'); // Mixed optional chaining
 */
const evaluateChain = (obj: EvaluationContext, path: string): PropertyValue => {
  const parts = path.split('.');

  return parts.reduce((current: any, part, _index) => {
    // Handle optional chaining - check for ? at the END of the part (from ?.split)
    const isOptional = VALUE_PATTERNS.OPTIONAL_CHAIN.test(part);
    const cleanPart = part.replace(VALUE_PATTERNS.OPTIONAL_CHAIN, '').trim();

    if (isOptional && current == null) {
      return undefined;
    }

    // Always unwrap signals before accessing properties
    if (isSignalLike(current)) {
      current = current.get();
      if (isOptional && current == null) return undefined;
    }

    if (!current) return current;

    // Handle array access with property: item[1]
    const arrayMatch = cleanPart.match(VALUE_PATTERNS.ARRAY_ACCESS);
    if (arrayMatch) {
      const [, baseName, indexStr] = arrayMatch;
      const base = (current as any)[baseName];
      return base ? base[parseInt(indexStr)] : undefined;
    }

    // Handle function call: method()
    const funcMatch = cleanPart.match(VALUE_PATTERNS.FUNCTION_PARSE);
    if (funcMatch) {
      const [, name, argsStr] = funcMatch;
      const func = (current as any)[name];
      if (typeof func === 'function') {
        const args = parseArgs(argsStr, current);
        return func.call(current, ...args);
      }
      return undefined;
    }

    // Simple property access
    return (current as any)[cleanPart];
  }, obj);
};

/**
 * Ultra-concise argument parser using regex to handle function call arguments.
 * Respects quoted strings, nested parentheses, and brackets while splitting on commas.
 * 
 * @param {string} argsStr - The arguments string from a function call
 * @param {EvaluationContext} context - Context object for resolving argument references
 * @returns {PropertyValue[]} Array of parsed and resolved argument values
 * 
 * @example
 * parseArgs('user.name, "hello world", func(a, b)', context);
 * // Returns: [resolvedUserName, "hello world", functionResult]
 */
const parseArgs = (argsStr: string, context: EvaluationContext): PropertyValue[] => {
  if (!argsStr.trim()) return [];

  // Regex to split on commas while respecting quotes and nested parens/brackets
  const args = argsStr.match(VALUE_PATTERNS.ARG_SPLIT) || [];

  return args.map(arg => {
    const trimmed = arg.replace(/^,+|,+$/g, '').trim(); // Remove leading/trailing commas
    return isLiteral(trimmed) ? parseLiteral(trimmed) : resolveAccessor(context, trimmed);
  });
};

/**
 * Parses a literal string into its actual JavaScript value.
 * Uses VALUE_PATTERNS for consistent classification.
 * 
 * @param {string} str - The literal string to parse
 * @returns {PropertyValue} The parsed JavaScript value
 * 
 * @example
 * parseLiteral('"hello"'); // "hello"
 * parseLiteral('42'); // 42
 * parseLiteral('true'); // true
 * parseLiteral('null'); // null
 */
const parseLiteral = (str: string): PropertyValue => {
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
 * @param {EvaluationContext} context - Context object for resolving function and arguments
 * @returns {PropertyValue} The result of the function call, or null if function not found/safe
 */
const evaluateFunction = (expr: string, context: EvaluationContext): PropertyValue => {
  if (!VALUE_PATTERNS.FUNCTION_CALL.test(expr)) return null;

  const match = expr.match(VALUE_PATTERNS.FUNCTION_PARSE);
  if (!match) return null;

  const [, funcPath, argsStr] = match;

  // Parse arguments with the same context that has access to window, etc.
  const args = parseArgs(argsStr, context).map(arg =>
    (arg as any)?._resolveLater ? resolveAccessor(context, (arg as any)._resolveLater) : arg
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
    'Date': ((...args: unknown[]) => new Date(...(args as ConstructorParameters<typeof Date>))) as (...args: unknown[]) => Date,
    'Date.now': Date.now
  };

  if (globals[funcPath]) {
    // Unwrap any signal arguments for global functions
    const unwrappedArgs = args.map(arg => unwrapSignal(arg));
    return globals[funcPath](...unwrappedArgs);
  }

  // Context method calls - resolve object path and call method
  const obj = resolveAccessor(context, funcPath.split('.').slice(0, -1).join('.')) || context;
  const methodName = funcPath.split('.').pop()!;
  const method = (obj as any)?.[methodName];

  return typeof method === 'function' ? method.call(obj, ...args) : null;
};



/**
 * Efficient comparison evaluator built around FilterCriteria.
 * Performs single operator lookup and evaluation for optimal performance.
 * 
 * @param {Record<string, unknown>} filter - The filter criteria with left/right operands and operator
 * @param {Record<string, unknown>} context - Context for resolving operand values
 * @returns {boolean} The comparison result
 * 
 * @example
 * evaluateFilter({ leftOperand: 'item.age', operator: '>=', rightOperand: 18 }, context);
 * evaluateFilter({ leftOperand: 'item.name', operator: 'includes', rightOperand: 'John' }, context);
 */
/**
 * Evaluation function for filter operations in array processing.
 * 
 * @param {Record<string, any>} filter - The filter criteria
 * @param {EvaluationContext} context - Context object for resolving operands
 * @returns {boolean} Whether the filter condition is satisfied
 */
const evaluateFilter = (filter: Record<string, any>, context: EvaluationContext): boolean => {
  try {
    // Resolve operand values
    const leftValue = unwrapSignal(resolveAccessor(context, filter.leftOperand as string));
    const rightValue = unwrapSignal(resolveAccessor(context, filter.rightOperand as string));

    // Direct operator lookup for maximum performance
    switch (filter.operator) {
      case '===': return leftValue === rightValue;
      case '!==': return leftValue !== rightValue;
      case '==': return leftValue == rightValue;
      case '!=': return leftValue != rightValue;
      case '>=': return (leftValue as any) >= (rightValue as any);
      case '<=': return (leftValue as any) <= (rightValue as any);
      case '>': return (leftValue as any) > (rightValue as any);
      case '<': return (leftValue as any) < (rightValue as any);
      case '&&': return Boolean(leftValue) && Boolean(rightValue);
      case '||': return Boolean(leftValue) || Boolean(rightValue);
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
/**
 * Comparison evaluator for template expressions and filter operations.
 * 
 * @param {string} expr - The comparison expression to evaluate  
 * @param {EvaluationContext} context - Context object for resolving operands
 * @returns {boolean | null} The comparison result, or null if expression is invalid
 */
const evaluateComparison = (expr: string, context: EvaluationContext): boolean | null => {
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
 * @param {Record<string, unknown>} context - Context object for variable resolution
 * @returns {unknown} The evaluated result with signals unwrapped
 */
/**
 * Template expression evaluator with support for concatenation, conditionals, and function calls.
 * 
 * @param {string} expr - The template expression to evaluate
 * @param {EvaluationContext} context - Context object for resolving variables and functions
 * @returns {PropertyValue} The evaluated result of the template expression
 */
const evaluateTemplateExpression = (expr: string, context: EvaluationContext): PropertyValue => {
  // String concatenation: operand + operand (simple case)
  if (expr.includes(' + ') && !expr.includes('?')) {
    const parts = expr.split(' + ').map(part => {
      const trimmed = part.trim();
      if (isLiteral(trimmed)) return parseLiteral(trimmed);

      // Handle function calls in concatenation
      if (VALUE_PATTERNS.FUNCTION_CALL.test(trimmed)) {
        const result = evaluateFunction(trimmed, context);
        return isSignalLike(result) ? result.get() : result;
      }

      // Resolve and unwrap automatically
      const resolved = resolveAccessor(context, trimmed);
      return isSignalLike(resolved) ? resolved.get() : resolved;
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
          conditionResult = isSignalLike(resolved) ? resolved.get() : resolved;
        }
      } else {
        const resolved = resolveAccessor(context, condition.trim());
        conditionResult = isSignalLike(resolved) ? resolved.get() : resolved;
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
        return isSignalLike(resolved) ? resolved.get() : resolved;
      }
    }
  }

  // Logical OR: first || second || third
  if (expr.includes(' || ')) {
    for (const part of expr.split(' || ')) {
      const trimmed = part.trim();
      const value = isLiteral(trimmed) ? parseLiteral(trimmed) : (() => {
        const resolved = resolveAccessor(context, trimmed);
        return isSignalLike(resolved) ? resolved.get() : resolved;
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
        return isSignalLike(resolved) ? resolved.get() : resolved;
      })();
      result = result && Boolean(value);
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
    return isSignalLike(result) ? result.get() : result;
  }

  // Simple property access - resolve and unwrap
  const resolved = resolveAccessor(context, expr);
  return isSignalLike(resolved) ? resolved.get() : resolved;
};



/**
 * Main template literal resolver with automatic signal unwrapping.
 * Processes ${...} expressions in template strings using safe evaluation.
 * 
 * @param {string} template - The template string containing ${...} expressions
 * @param {Record<string, unknown>} context - Context object for resolving template variables
 * @returns {string} The resolved template string with expressions evaluated
 * 
 * @example
 * resolveTemplate('Hello ${user.name}!', context); // "Hello John!"
 * resolveTemplate('Count: ${items.length || 0}', context); // "Count: 5"
 * resolveTemplate('${user.age >= 18 ? "adult" : "minor"}', context); // "adult"
 */
/**
 * Template literal resolver with embedded expression evaluation.
 * 
 * @param {string} template - Template string with ${...} expressions
 * @param {EvaluationContext} context - Context object for resolving template variables
 * @returns {string} The resolved template string with expressions evaluated
 */
const resolveTemplate = (template: string, context: EvaluationContext): string =>
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
 * @param {Record<string, unknown>} context - Context object to resolve properties from
 * @param {string} path - Property path or function call to resolve
 * @param {unknown} [fallback=null] - Value to return if resolution fails
 * @returns {unknown} The resolved value, preserving signal objects
 * 
 * @example
 * resolveTemplateProperty(context, 'user.$name'); // Returns signal object
 * resolveTemplateProperty(context, 'this.$count'); // Returns signal object
 * resolveTemplateProperty(context, 'getData()'); // Returns function result
 */
/**
 * Template property resolver that handles property access and template evaluation.
 * 
 * @param {EvaluationContext} context - Context object for property resolution
 * @param {string} path - Property path or template expression
 * @param {PropertyValue} [fallback=null] - Fallback value if resolution fails
 * @returns {PropertyValue} The resolved property value or evaluated template
 */
const resolveTemplateProperty = (context: EvaluationContext, path: string, fallback: PropertyValue = null): PropertyValue => {
  try {
    // Handle property accessor strings (not template literals)
    if (typeof path === 'string' && !path.includes('${') && !path.includes('(')) {
      // Special case: 'this.$name' as a string should resolve to the signal
      if (VALUE_PATTERNS.GLOBAL_ACCESSOR.test(path)) {
        return resolveAccessor(context, path, fallback);
      }
      // Regular strings are returned as-is
      return path;
    }

    // Function call with args - return result directly
    if (VALUE_PATTERNS.FUNCTION_CALL.test(path)) {
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
 * @param {unknown} operand - The operand to resolve (string path, template, or direct value)
 * @param {Record<string, unknown>} item - The current item context (becomes 'this' in resolution)
 * @param {Record<string, unknown>} [additionalContext] - Additional context properties to include
 * @returns {unknown} The resolved and potentially unwrapped value
 * 
 * @example
 * resolveOperand('${item.name}', item, context); // "John" (unwrapped)
 * resolveOperand('item.active', item, context); // true (unwrapped)
 * resolveOperand(42, item, context); // 42 (direct value)
 */
/**
 * Operand resolver for array operations and template contexts.
 * 
 * @param {PropertyValue} operand - The operand to resolve (may be a string path or direct value)
 * @param {Record<string, any>} item - The current item context for array operations
 * @param {EvaluationContext} [additionalContext] - Additional context for resolution
 * @returns {PropertyValue} The resolved operand value
 */
const resolveOperand = (operand: PropertyValue, item: Record<string, any>, additionalContext?: EvaluationContext): PropertyValue => {
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
 * Context builder for DDOM components that automatically includes signals.
 * Scans component for $-prefixed properties and includes them in context.
 * 
 * @param {Record<string, unknown>} component - The DDOM component object
 * @param {Record<string, unknown>} [additionalProps] - Additional properties to include in context
 * @returns {Record<string, unknown>} Complete context object with component signals and globals
 * 
 * @example
 * const context = buildContext(component, { extra: 'data' });
 * // Returns: { this: component, window: globalThis.window, $count: signal, ... }
 */
/**
 * Context builder for component evaluation with additional properties.
 * 
 * @param {EvaluationContext} component - The base component context
 * @param {EvaluationContext} [additionalProps] - Additional properties to merge
 * @returns {EvaluationContext} Combined evaluation context
 */
const buildContext = (component: EvaluationContext, additionalProps?: EvaluationContext): EvaluationContext => ({
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
  resolveTemplate,
  resolveTemplateProperty,
  resolveAccessor,
  resolveOperand,
  buildContext,
};