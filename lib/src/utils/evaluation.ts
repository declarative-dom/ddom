/**
 * Expression Evaluation Utilities
 * 
 * Shared utilities for evaluating JavaScript expressions, property access,
 * and template literals across all namespaces.
 */

/**
 * Checks if a string is a simple property name (no dots, no function calls)
 */
export function isSimpleProperty(str: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
}

/**
 * Gets a nested property from an object using dot notation
 */
export function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? current[key] : undefined;
  }, obj);
}

/**
 * Evaluates a JavaScript expression with item and context
 */
export function evaluateExpression(expression: string, item: any, context: any): any {
  try {
    // Create a safe evaluation context
    const evalContext = {
      item,
      window: globalThis.window,
      document: globalThis.document,
      ...context
    };
    
    // Replace 'item.' with direct property access for cleaner expressions
    const processedExpression = expression.replace(/\bitem\./g, 'item.');
    
    // Create a function that evaluates the expression with the context
    const func = new Function(
      'item', 'window', 'document', 'context',
      `with(context) { return ${processedExpression}; }`
    );
    
    return func(item, evalContext.window, evalContext.document, evalContext);
  } catch (error) {
    console.warn(`Expression evaluation failed: "${expression}"`, error);
    return undefined;
  }
}

/**
 * Resolves an operand value (can be direct value, property path, or expression)
 */
export function resolveOperand(operand: any, item: any, context: any): any {
  // Direct values
  if (typeof operand !== 'string') {
    return operand;
  }
  
  // Simple property access (e.g., "name", "rating")
  if (isSimpleProperty(operand)) {
    return getNestedProperty(item, operand);
  }
  
  // Complex expressions - evaluate as JavaScript with item and context
  return evaluateExpression(operand, item, context);
}
