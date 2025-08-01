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

import { Signal } from '../core/signals';
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
 * getValue(signal); // 42
 * getValue("hello"); // "hello"
 */
const getValue = (value: any): any =>
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
 * getProperty('user.$name', obj); // Returns Signal object
 * getProperty('this.$coords().lat', obj); // Calls function, accesses property
 * getProperty('items[0].data', obj); // Array access with property
 */
const getProperty = (path: string, context: any, fallback: any = null): any => {
  if (!path) {
    return fallback;
  }
  try {
    if (VALUE_PATTERNS.COMPLEX_ACCESSOR.test(path)) {
      // if it's an advanced accessor, evaluate the chain
      return traversePropertyPath(path, context) ?? fallback;
    } else if (Object.hasOwn(context, path)) {
      // if it's a basic accessor, return the property directly
      return context[path] ?? fallback;
    } else {
      // For optional chaining or unresolved accessors, return fallback (undefined) instead of the path string
      // This ensures failed resolution is properly communicated up the chain
      if (VALUE_PATTERNS.GLOBAL_ACCESSOR.test(path)) {
        return fallback; // Don't return the path string for failed global accessors
      }
      return path ?? fallback; // Only return path for non-accessor strings
    }
  } catch (error) {
    console.warn('Accessor resolution failed:', path, error);
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
 * traversePropertyPath('user.getName().toUpperCase()', obj); 
 * traversePropertyPath('user?.profile?.name', obj); // Optional chaining
 * traversePropertyPath('this.$currentCoords()?.lat', obj); // Mixed optional chaining
 */
const traversePropertyPath = (path: string, obj: any): any => {
  // Parse path segments with optional chaining information
  const parts = path.split(/(\?\.|\.)/).reduce((acc, seg) => {
    if (seg === '?.' || seg === '.') {
      acc.optional = seg === '?.';
    } else if (seg) {
      acc.result.push({ name: seg, isOptional: acc.optional });
      acc.optional = false;
    }
    return acc;
  }, { result: [] as Array<{ name: string; isOptional: boolean }>, optional: false }).result;  return parts.reduce((current, { name: part, isOptional }) => {
    // If this is an optional access and current is null/undefined, return undefined
    if (isOptional && current == null) {
      return undefined;
    }

    // Helper function to unwrap signals when needed
    const unwrap = (val: any) => 
      val?.get && typeof val.get === 'function' ? val.get() : val;

    // Use unwrapped current or fallback to obj
    current = unwrap(current) ?? obj;
    if (current == null && isOptional) return undefined;

    // Handle array access with property: item[1]
    const arrayMatch = part.match(VALUE_PATTERNS.ARRAY_ACCESS);
    if (arrayMatch) {
      const [, baseName, indexStr] = arrayMatch;
      const base = current[baseName];
      return base ? base[parseInt(indexStr)] : undefined;
    }

    // Handle function call: method()
    const funcMatch = part.match(VALUE_PATTERNS.FUNCTION_PARSE);
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
    return current[part];
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
    return isLiteral(trimmed) ? parseValue(trimmed) : getProperty(trimmed, context);
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
 * parseValue('"hello"'); // "hello"
 * parseValue('42'); // 42
 * parseValue('true'); // true
 * parseValue('null'); // null
 */
const parseValue = (str: string): any => {
  const trimmed = str.trim();
  if (VALUE_PATTERNS.LITERAL_STRING.test(trimmed)) return trimmed.slice(1, -1);
  if (VALUE_PATTERNS.LITERAL_NUMBER.test(trimmed)) return Number(trimmed);
  return { 'true': true, 'false': false, 'null': null, 'undefined': undefined }[trimmed] ?? trimmed;
};

/**
 * Function call evaluator with safe global function support.
 * Uses VALUE_PATTERNS for consistent pattern matching.
 * 
 * @param {string} expr - The function call expression to evaluate
 * @param {any} context - Context object for resolving function and arguments
 * @returns {any} The result of the function call, or null if function not found/safe
 */
const callFunction = (expr: string, context: any): any => {
  if (!VALUE_PATTERNS.FUNCTION_CALL.test(expr)) return null;

  const match = expr.match(VALUE_PATTERNS.FUNCTION_PARSE);
  if (!match) return null;

  const [, funcPath, argsStr] = match;

  // Parse arguments with the same context that has access to window, etc.
  const args = parseArgs(argsStr, context);

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
    const unwrappedArgs = args.map(arg => getValue(arg));
    return globals[funcPath](...unwrappedArgs);
  }

  // Context method calls - cleaner resolution using reduce
  const pathParts = funcPath.split('.');
  const methodName = pathParts.pop()!;
  const targetPath = pathParts.join('.');
  
  const target = targetPath ? getProperty(targetPath, context) : context;
  const method = target?.[methodName];

  return typeof method === 'function' ? method.call(target, ...args) : null;
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
    let leftValue;
    if (typeof filter.leftOperand === 'function') {
      // If left operand is a function, call it with context
      leftValue = filter.leftOperand.call(context.item);
    } else {
      leftValue = getValue(getProperty(filter.leftOperand, context));
    }
    const rightValue = getValue(getProperty(filter.rightOperand, context));

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
    console.warn('Filter eval error:', error, filter);
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
 * compareValues('user.age >= 18', context); // true/false
 * compareValues('status === "active"', context); // true/false
 */
const compareValues = (expr: string, context: any): boolean | null => {
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
  // Helper function to resolve and unwrap values
  const resolve = (path: string) => {
    const resolved = getProperty(path, context);
    return getValue(resolved);
  };

  // String concatenation: operand + operand (simple case)
  if (expr.includes(' + ') && !expr.includes('?')) {
    const parts = expr.split(' + ').map(part => {
      const trimmed = part.trim();
      if (isLiteral(trimmed)) return parseValue(trimmed);

      // Handle function calls in concatenation
      if (VALUE_PATTERNS.FUNCTION_CALL.test(trimmed)) {
        const result = callFunction(trimmed, context);
        return getValue(result);
      }
      // Resolve and unwrap automatically
      return resolve(trimmed);
    });
    return parts.join('');
  }

  // Unary NOT operators: !expression or !!expression
  // Handle this early so it works in ternary conditions, but not for ternary expressions themselves
  const unaryMatch = expr.match(VALUE_PATTERNS.UNARY_NOT);
  if (unaryMatch && !VALUE_PATTERNS.TERNARY.test(expr)) {
    const [, operator, operand] = unaryMatch;
    const trimmedOperand = operand.trim();
    
    // Resolve the operand value
    let value;
    if (isLiteral(trimmedOperand)) {
      value = parseValue(trimmedOperand);
    } else {
      const resolved = getProperty(trimmedOperand, context);
      value = getValue(resolved);
    }
    
    // Apply the NOT operator(s)
    if (operator === '!') {
      return !value;
    } else if (operator === '!!') {
      return !!value;
    }
  }

  // Ternary: condition ? true : false
  if (VALUE_PATTERNS.TERNARY.test(expr)) {
    const ternaryMatch = expr.match(VALUE_PATTERNS.TERNARY);
    if (ternaryMatch) {
      const [, condition, truthy, falsy] = ternaryMatch;

      // Evaluate condition: use recursive evaluation to handle all expression types
      let conditionResult;
      const trimmedCondition = condition.trim();
      
      // Check if condition contains operators or unary NOT
      if (trimmedCondition.includes(' ') || VALUE_PATTERNS.UNARY_NOT.test(trimmedCondition)) {
        // Use recursive evaluation for complex conditions
        conditionResult = evaluateTemplateExpression(trimmedCondition, context);
      } else {
        // Simple property access
        const resolved = getProperty(trimmedCondition, context);
        conditionResult = getValue(resolved);
      }

      const resultPath = conditionResult ? truthy.trim() : falsy.trim();

      // IMPORTANT: If the result branch contains operators, evaluate it as an expression!
      if (isLiteral(resultPath)) {
        return parseValue(resultPath);
      } else if (resultPath.includes(' + ') || resultPath.includes('(')) {
        // It's an expression, evaluate it recursively
        return evaluateTemplateExpression(resultPath, context);
      } else {
        // Simple property access
        return resolve(resultPath);
      }
    }
  }

  // Logical OR: first || second || third
  if (expr.includes(' || ')) {
    for (const part of expr.split(' || ')) {
      const trimmed = part.trim();
      const value = isLiteral(trimmed) ? parseValue(trimmed) : resolve(trimmed);
      if (value) return value;
    }
    return undefined;
  }

  // Logical AND: first && second && third
  if (expr.includes(' && ')) {
    let result = true;
    for (const part of expr.split(' && ')) {
      const trimmed = part.trim();
      const value = isLiteral(trimmed) ? parseValue(trimmed) : resolve(trimmed);
      result = result && value;
      if (!result) return false;
    }
    return result;
  }

  // Simple comparison - use existing compareValues
  const comparisonResult = compareValues(expr, context);
  if (comparisonResult !== null) return comparisonResult;

  // Function call - only if the entire expression is a function call
  if (VALUE_PATTERNS.FUNCTION_CALL.test(expr)) {
    const result = callFunction(expr, context);
    return getValue(result);
  }

  // Simple property access - resolve and unwrap
  return resolve(expr);
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
      // If result is undefined (like from failed optional chaining), return the original match
      // This allows resolveConfig to detect unresolved templates
      return result !== undefined ? String(result) : match;
    } catch (error) {
      console.warn('Template eval error:', error);
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
 * resolveExpression('user.$name', context); // Returns signal object
 * resolveExpression('this.$count', context); // Returns signal object
 * resolveExpression('getData()', context); // Returns function result
 */
const resolveExpression = (path: string, context: any, fallback: any = null): any => {
  try {
    // Handle property accessor strings (not template literals)
    if (typeof path === 'string' && !path.includes('${') && !path.includes('(')) {
      if (VALUE_PATTERNS.GLOBAL_ACCESSOR.test(path)) {
        if (path.includes('?.')) {
          // Handle optional chaining - create deferred accessor
          return createAccessorSignal(path, context);
        }
        return getProperty(path, context, fallback);
      }
      // Regular strings are returned as-is
      return path;
    }

    // Function call with args - return result directly
    if (VALUE_PATTERNS.FUNCTION_CALL.test(path)) {
      return callFunction(path, context);
    }

    // Property access - preserve signals
    return getProperty(path, context, fallback);
  } catch (error) {
    console.warn('Property resolution failed:', path, error);
    return fallback;
  }
};

/**
 * Operand resolver for array operations that preserves signal reactivity.
 * Used in array mapping, filtering, and other collection operations.
 * 
 * Key behavior:
 * - Template literals (${...}) are evaluated and unwrapped
 * - Direct property accessors preserve signals for reactivity
 * - Optional chaining (?.property) creates deferred signal accessors
 * 
 * @param {any} operand - The operand to resolve (string path, template, or direct value)
 * @param {any} item - The current item context (becomes 'this' in resolution)
 * @param {any} [additionalContext] - Additional context properties to include
 * @returns {any} The resolved value (signal or unwrapped depending on context)
 * 
 * @example
 * resolveOperand('${item.name}', item, context); // "John" (unwrapped)
 * resolveOperand('this.$data', item, context); // Signal object (preserved)
 * resolveOperand('this.$data?.message', item, context); // Deferred accessor signal
 */
const resolveOperand = (operand: any, item: any, additionalContext?: any): any => {
  if (typeof operand !== 'string') return operand;

  const context = createContext(item, additionalContext);

  // Template literal - auto-unwrap for final values
  if (operand.includes('${')) {
    return resolveTemplate(operand, context);
  }

  // Direct property access - preserve signals for reactivity
  return resolveExpression(operand, context);
};


/**
 * Creates a deferred accessor for optional chaining on signals.
 * This handles cases like 'this.$data?.message' where the signal may not have resolved yet.
 * Returns a function that can be called to get the current value safely.
 * 
 * @param {string} path - The property path with optional chaining (e.g., 'this.$data?.message')
 * @param {any} context - Context for resolving the base signal
 * @returns {any} A function that resolves the value or the resolved value directly
 * 
 * @example
 * createAccessorSignal('this.$data?.message', context); // Function that safely gets $data.message
 */
const createAccessorSignal = (path: string, context: any): any => {
  // Split on the first ?. to separate base signal from property chain
  const [basePath, ...propertyParts] = path.split('?.');
  const propertyChain = propertyParts.join('?.');

  try {
    // Resolve the base signal
    const base = getProperty(basePath.trim(), context);

    // If it's not a signal, resolve the full path normally with optional chaining
    if (!VALUE_PATTERNS.SIGNAL(base)) {
      // Convert ?. back to regular property access and resolve
      const safePath = path.replace(/\?\./g, '.');
      return getProperty(safePath, context);
    }

    // For signals, return a special deferred accessor object
    return new Signal.Computed(() => {
      // Resolve the base signal value
      const baseValue = base.get();
      if (baseValue == null) return undefined; // Handle null/undefined base

      // Resolve the full property chain on the base value
      return traversePropertyPath(propertyChain, baseValue);
    });
  } catch (error) {
    console.warn('Deferred accessor creation failed:', path, error);
    return undefined;
  }
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
 * const context = createContext(component, { extra: 'data' });
 * // Returns: { this: component, window: globalThis.window, $count: signal, ... }
 */
const createContext = (component: any, additionalProps?: any) => ({
  this: component,
  window: globalThis.window,
  document: globalThis.document,
  ...additionalProps,
});

/**
 * Default export containing all public API methods.
 * Provides both individual functions and convenient DDOM-specific methods.
 */
export {
  compareValues,
  evaluateFilter,
  getProperty,
  resolveOperand,
  resolveTemplate,
  resolveExpression,
  getValue,
};