/**
 * Array Mapping Logic
 * 
 * Applies declarative object templates or string templates to transform array items.
 * Follows the Rule of Least Power - no imperative functions, only declarative templates.
 */

import { evaluateAccessor, parseTemplateLiteral } from '../../utils/evaluation';

const ACCESSOR_REGEX = /^(item|index|window|document)$/;

/**
 * Applies a mapping template to items
 * Supports only declarative templates: object templates and string templates
 */
export function applyMapping(items: any[], mapTemplate: any): any[] {
  try {
    if (typeof mapTemplate === 'string') {
      // String template mapping
      return items.map((item, index) => transformStringTemplate(mapTemplate, item, index));
    } else if (typeof mapTemplate === 'object' && mapTemplate !== null) {
      // Object template mapping
      return items.map((item, index) => transformObjectTemplate(mapTemplate, item, index));
    } else {
      // Direct value mapping (primitive values)
      return items.map(() => mapTemplate);
    }
  } catch (error) {
    console.warn('Mapping template failed:', error);
    return items; // Return original items on error
  }
}

/**
 * Transforms a string template with item context
 */
function transformStringTemplate(template: string, item: any, index: number): string {
  try {
    // Create evaluation context with item, index, and common globals
    const context = {
      item,
      index,
      window: globalThis.window,
      document: globalThis.document
    };
    
    // Use shared evaluation function for consistency
    return parseTemplateLiteral(template, context);
  } catch (error) {
    console.warn(`String template evaluation failed: "${template}"`, error);
    return String(template);
  }
}

/**
 * Transforms an object template with item context
 */
function transformObjectTemplate(template: any, item: any, index: number): any {
  if (Array.isArray(template)) {
    // Handle arrays recursively
    return template.map(element => transformObjectTemplate(element, item, index));
  }
  
  if (typeof template !== 'object' || template === null) {
    // Handle primitive values
    return template;
  }
  
  // Transform object properties
  const result: any = {};

  Object.entries(template).forEach(([key, value]) => {
    if (typeof value === 'string') {
      if (value.includes('${')) {
        // String template properties - evaluate with item context
        result[key] = transformStringTemplate(value, item, index);
      } else if (ACCESSOR_REGEX.test(value)) {
        // Use shared operand resolution for naked accessors like 'item', 'index'
        console.debug('🔍 Evaluating accessor:', value, 'with item:', item, 'index:', index);
        result[key] = evaluateAccessor(value, item, index);
      } else {
        // Direct value string
        result[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Nested objects - recurse
      result[key] = transformObjectTemplate(value, item, index);
    } else {
      // Direct values (strings, numbers, booleans, etc.)
      result[key] = value;
    }
  });
  
  return result;
}
