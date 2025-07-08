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
 * Gets a nested property from an object using dot notation and bracket notation.
 * Supports both dots (obj.prop.subprop) and brackets (obj[0], obj['key'], obj[0].name)
 * 
 * @param obj - The object to traverse
 * @param path - Property path (e.g., 'user.name', 'items[0]', 'data[0].name')
 * @returns The resolved value or null if not found
 */
export function resolveProperty(obj: any, path: string): any {
  if (!obj || !path) return null;
  
  try {
    // Simple and elegant path resolution supporting both dots and brackets
    return path.split(/[.\[\]]+/).filter(Boolean).reduce((o, k) => o?.[k], obj);
  } catch (error) {
    console.warn('resolveProperty failed for path:', path, error);
    return null;
  }
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
 * Evaluates JavaScript template literals using an object as context.
 * Uses explicit .get() calls for signal access in templates.
 *
 * @param template - The template string to evaluate as a JavaScript template literal
 * @param context - The object to use as context ('this') for template evaluation
 * @returns The template string evaluated with the context
 */
export function resolveTemplate(
  template: string,
  context: object
): string {
  try {
    console.debug('🔧 resolveTemplate called with template:', template, 'context:', context);
    console.debug('🔧 Context properties:', Object.keys(context as any).filter(k => k.startsWith('$')));
    
    // Extract context variables to make them available as direct variables in template scope
    const contextKeys = Object.keys(context as any);
    const contextValues = Object.values(context as any);
    
    // Create function with context variables as parameters
    const templateFunction = new Function(...contextKeys, `return \`${template}\`;`);
    const result = templateFunction(...contextValues);
    
    console.debug('🔧 Template result:', result);
    return result;
  } catch (error) {
    console.warn(`Template evaluation failed: ${error}, Template: ${template}`);
    console.debug('🔧 Available context properties:', Object.keys(context as any).filter(k => k.startsWith('$')));
    return template;
  }
}

/**
 * Resolves an operand value (can be direct value, property path, or expression)
 */
export function resolveOperand(operand: any, item: any, context?: any): any {
  // Direct values
  if (typeof operand !== 'string') {
    return operand;
  }
  
  console.debug('🔍 resolveOperand called with operand:', operand, 'item:', item, 'context:', context);
  
  // Simple property access (e.g., "item.name", "window.rating")
  if (isNestedProperty(operand)) {
    const result = resolveProperty(item, operand);
    console.debug('🔍 resolveProperty result:', result, 'for operand:', operand);
    return result;
  }
  
  // Complex expressions - evaluate as JavaScript with item and context
  return evaluateExpression(operand, item, context);
}