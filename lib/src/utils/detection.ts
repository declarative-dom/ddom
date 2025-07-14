/**
 * Value Pattern Definitions for DDOM Expression Evaluation
 * 
 * Centralized regex patterns and type detection functions for consistent
 * expression parsing, template processing, and value classification.
 * 
 * Uses getter functions for global regex patterns to avoid state persistence issues.
 */

/**
 * Comprehensive value type classification with regex patterns and functions.
 * Centralized pattern matching for expression evaluation, template processing, and type detection.
 */
const VALUE_PATTERNS = {
  /**
   * Template literal detection pattern.
   * Matches strings containing ${...} template expressions.
   * @example
   * VALUE_PATTERNS.TEMPLATE.test('Hello ${name}'); // true
   * VALUE_PATTERNS.TEMPLATE.test('Count: ${items.length}'); // true
   * VALUE_PATTERNS.TEMPLATE.test('Static string'); // false
   */
  TEMPLATE: /\$\{/,

  /**
   * Template literal replacement pattern (GETTER - fresh instance each access).
   * Matches ${...} expressions in template strings for processing.
   * @example
   * 'Hello ${name}!'.replace(VALUE_PATTERNS.TEMPLATE_REPLACEMENT, ...); 
   * // Replaces all ${...} expressions
   */
  TEMPLATE_REPLACEMENT: /\$\{([^}]+)\}/g,

  /**
   * Global accessor pattern for window, document, and this references.
   * Matches property access starting with special global objects required by DDOM.
   * @example
   * VALUE_PATTERNS.GLOBAL_ACCESSOR.test('window.location'); // true
   * VALUE_PATTERNS.GLOBAL_ACCESSOR.test('this.$data'); // true
   * VALUE_PATTERNS.GLOBAL_ACCESSOR.test('document.body'); // true
   * VALUE_PATTERNS.GLOBAL_ACCESSOR.test('user.name'); // false
   */
  GLOBAL_ACCESSOR: /^(window\.|document\.|this\.)/,

  /**
   * Valid accessor pattern for general property chains.
   * Validates property access patterns including chains, array indexing, and function calls.
   * @example
   * VALUE_PATTERNS.VALID_ACCESSOR.test('user.name'); // true
   * VALUE_PATTERNS.VALID_ACCESSOR.test('items[0].data'); // true
   * VALUE_PATTERNS.VALID_ACCESSOR.test('getData()'); // true
   * VALUE_PATTERNS.VALID_ACCESSOR.test('this.$fullName()'); // true
   * VALUE_PATTERNS.VALID_ACCESSOR.test('user..name'); // false (invalid double dot)
   * VALUE_PATTERNS.VALID_ACCESSOR.test('123invalid'); // false (invalid start)
   */
  VALID_ACCESSOR: /^[a-zA-Z_$][\w$]*(\.[a-zA-Z_$][\w$]*|\[\d+\])*(\(\))?$/,

  /**
   * Function call pattern with optional arguments.
   * Matches function calls including method chains and nested calls.
   * @example
   * VALUE_PATTERNS.FUNCTION_CALL.test('getData()'); // true
   * VALUE_PATTERNS.FUNCTION_CALL.test('user.getName()'); // true
   * VALUE_PATTERNS.FUNCTION_CALL.test('process(arg1, arg2)'); // true
   * VALUE_PATTERNS.FUNCTION_CALL.test('user.name'); // false
   */
  FUNCTION_CALL: /^[a-zA-Z_$][\w.$]*\([^)]*\)$/,

  /**
   * Argument splitting pattern for function calls (GETTER - fresh instance each access).
   * Respects quoted strings, nested parentheses, and brackets while splitting on commas.
   * @example
   * 'arg1, "hello world", func(x)'.match(VALUE_PATTERNS.ARG_SPLIT); 
   * // ['arg1', '"hello world"', 'func(x)']
   */
  ARG_SPLIT: /(?:[^,"'([]+|"[^"]*"|'[^']*'|\([^)]*\)|\[[^\]]*\])+/g,

  /**
   * Quoted string literal pattern.
   * Matches strings enclosed in single, double, or backtick quotes.
   * @example
   * VALUE_PATTERNS.LITERAL_STRING.test('"hello"'); // true
   * VALUE_PATTERNS.LITERAL_STRING.test("'world'"); // true
   * VALUE_PATTERNS.LITERAL_STRING.test('`template`'); // true
   * VALUE_PATTERNS.LITERAL_STRING.test('unquoted'); // false
   */
  LITERAL_STRING: /^(['"`]).*\1$/,

  /**
   * Numeric literal pattern for integers and decimals.
   * Matches whole numbers and floating-point numbers.
   * @example
   * VALUE_PATTERNS.LITERAL_NUMBER.test('42'); // true
   * VALUE_PATTERNS.LITERAL_NUMBER.test('3.14'); // true
   * VALUE_PATTERNS.LITERAL_NUMBER.test('0'); // true
   * VALUE_PATTERNS.LITERAL_NUMBER.test('text'); // false
   */
  LITERAL_NUMBER: /^\d+(\.\d+)?$/,

  /**
   * Boolean literal pattern.
   * Matches JavaScript boolean keywords.
   * @example
   * VALUE_PATTERNS.LITERAL_BOOLEAN.test('true'); // true
   * VALUE_PATTERNS.LITERAL_BOOLEAN.test('false'); // true
   * VALUE_PATTERNS.LITERAL_BOOLEAN.test('yes'); // false
   */
  LITERAL_BOOLEAN: /^(true|false)$/,

  /**
   * Null/undefined literal pattern.
   * Matches JavaScript null and undefined keywords.
   * @example
   * VALUE_PATTERNS.LITERAL_NULL.test('null'); // true
   * VALUE_PATTERNS.LITERAL_NULL.test('undefined'); // true
   * VALUE_PATTERNS.LITERAL_NULL.test('empty'); // false
   */
  LITERAL_NULL: /^(null|undefined)$/,

  /**
   * Operator detection pattern for expressions.
   * Matches logical, comparison, arithmetic, and method operators.
   * @example
   * VALUE_PATTERNS.HAS_OPERATORS.test('a >= b'); // true
   * VALUE_PATTERNS.HAS_OPERATORS.test('name.includes("test")'); // true (includes method)
   * VALUE_PATTERNS.HAS_OPERATORS.test('x && y'); // true
   * VALUE_PATTERNS.HAS_OPERATORS.test('simple'); // false
   */
  HAS_OPERATORS: /(\|\||&&|===|!==|==|!=|>=|<=|>|<|\+|includes|startsWith|endsWith|matches|in)/,

  /**
   * Ternary operator pattern with negative lookbehind/lookahead.
   * Matches conditional expressions while avoiding optional chaining conflicts.
   * @example
   * VALUE_PATTERNS.TERNARY.test('age >= 18 ? "adult" : "minor"'); // true
   * VALUE_PATTERNS.TERNARY.test('user ? user.name : "Guest"'); // true
   * VALUE_PATTERNS.TERNARY.test('user?.name'); // false (optional chaining)
   */
  TERNARY: /^(.+?)\s*(?<!\?)\?\s*(?!\.)(.+?)\s*:\s*(.+)$/,

  /**
   * Advanced accessor pattern for complex property chains.
   * Matches property access with dots, brackets, and optional function calls.
   * @example
   * VALUE_PATTERNS.COMPLEX_ACCESSOR.test('user.profile.name'); // true
   * VALUE_PATTERNS.COMPLEX_ACCESSOR.test('items[0].data'); // true
   * VALUE_PATTERNS.COMPLEX_ACCESSOR.test('getData().result'); // true
   * VALUE_PATTERNS.COMPLEX_ACCESSOR.test('simple'); // false
   */
  COMPLEX_ACCESSOR: /[.[\s(]/,

  /**
   * Array index access pattern with property.
   * Matches property access combined with array indexing.
   * @example
   * 'items[0]'.match(VALUE_PATTERNS.ARRAY_ACCESS); // ['items[0]', 'items', '0']
   * 'users[5]'.match(VALUE_PATTERNS.ARRAY_ACCESS); // ['users[5]', 'users', '5']
   * 'data.items[0]'.match(VALUE_PATTERNS.ARRAY_ACCESS); // null (too complex)
   */
  ARRAY_ACCESS: /^([a-zA-Z_$][\w$]*)\[(\d+)\]$/,

  /**
   * Function call with arguments pattern for parsing.
   * Captures function name and arguments string for detailed parsing.
   * @example
   * 'getData()'.match(VALUE_PATTERNS.FUNCTION_PARSE); // ['getData()', 'getData', '']
   * 'process(a, b)'.match(VALUE_PATTERNS.FUNCTION_PARSE); // ['process(a, b)', 'process', 'a, b']
   */
  FUNCTION_PARSE: /^([a-zA-Z_$][\w.$]*)\(([^)]*)\)$/,

  /**
   * Comparison operator pattern for expressions.
   * Ordered by specificity with longer operators first to prevent conflicts.
   * @example
   * 'a === b'.match(VALUE_PATTERNS.COMPARISON_OPS); // ['a === b', 'a', '===', 'b']
   * 'name.includes("test")'.match(VALUE_PATTERNS.COMPARISON_OPS); // ['name.includes("test")', 'name', 'includes', '"test"']
   */
  COMPARISON_OPS: /^(.+?)\s*(===|!==|>=|<=|==|!=|>|<|includes|startsWith|endsWith|&&|\|\|)\s*(.+)$/,

  /**
   * Optional chaining detection pattern.
   * Detects question mark at the end of property parts (from ?.split).
   * @example
   * VALUE_PATTERNS.OPTIONAL_CHAIN.test('user?'); // true
   * VALUE_PATTERNS.OPTIONAL_CHAIN.test('profile?'); // true
   * VALUE_PATTERNS.OPTIONAL_CHAIN.test('name'); // false
   */
  OPTIONAL_CHAIN: /\?$/,

  /**
   * Signal object detector function.
   * Identifies TC39 Signal objects by checking for .get() method.
   * @example
   * VALUE_PATTERNS.SIGNAL(new Signal(42)); // true
   * VALUE_PATTERNS.SIGNAL({ get: () => 'value' }); // true
   * VALUE_PATTERNS.SIGNAL({}); // false
   */
  SIGNAL: (v: unknown) => v && typeof v === 'object' && 'get' in v && typeof (v as any).get === 'function',

  /**
   * Function type detector.
   * Identifies JavaScript function objects.
   * @example
   * VALUE_PATTERNS.FUNCTION(() => {}); // true
   * VALUE_PATTERNS.FUNCTION(function() {}); // true
   * VALUE_PATTERNS.FUNCTION({}); // false
   */
  FUNCTION: (v: unknown) => typeof v === 'function',
} as const;

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
const isValidAccessor = (str: string): boolean =>
  VALUE_PATTERNS.VALID_ACCESSOR.test(str)

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
const isFunctionCall = (str: string): boolean =>
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
const isSignal = (obj: unknown): boolean =>
  VALUE_PATTERNS.SIGNAL(obj);

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

export {
  VALUE_PATTERNS,
  isValidAccessor,
  isFunctionCall,
  isSignal,
  isLiteral,
};