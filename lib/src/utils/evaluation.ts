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
  console.debug('🔍 getNestedProperty called with obj:', obj, 'path:', path);
  const result = path.split('.').reduce((current, key) => {
    console.debug('🔍 Looking for key:', key, 'in:', current);
    return current && typeof current === 'object' ? current[key] : undefined;
  }, obj);
  console.debug('🔍 getNestedProperty result:', result);
  return result;
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
export function parseTemplateLiteral(
  template: string,
  context: object
): string {
  try {
    console.debug('🔧 parseTemplateLiteral called with template:', template, 'context:', context);
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
  if (isSimpleProperty(operand)) {
    const result = getNestedProperty(item, operand);
    console.debug('🔍 getNestedProperty result:', result, 'for operand:', operand);
    return result;
  }
  
  // Complex expressions - evaluate as JavaScript with item and context
  return evaluateExpression(operand, item, context);
}



/**
 * Evaluates a property accessor string like 'item.id' or 'index' 
 * with the given item and index values
 */
export function evaluateAccessor(accessor: string, item: any, index: number): any {
  const context = { index, item };
  
  // Handle direct accessor resolution - the context object is what we search in
  return resolveOperand(accessor, context, context);
}