/**
 * Array Mapping Logic
 * 
 * Applies declarative object templates or string templates to transform array items.
 * Follows the Rule of Least Power - no imperative functions, only declarative templates.
 */

import { resolveAccessor, resolveTemplate } from '../../utils/evaluation';

const ACCESSOR_REGEX = /^(item|index|window|document)/;

/**
 * Applies a mapping template to items
 * Supports only declarative templates: object templates and string templates
 */
export function applyMapping(items: any[], mapTemplate: any): any[] {
  try {
    if (typeof mapTemplate === 'string') {
      // String template mapping
      return items.map((item, index) => transformTemplate(mapTemplate, item, index));
    } else if (typeof mapTemplate === 'object' && mapTemplate !== null) {
      // Object template mapping
      return items.map((item, index) => transformObject(mapTemplate, item, index));
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
function transformTemplate(template: string, item: any, index: number): string {
  try {
    // Create evaluation context with item, index, and common globals
    const context = {
      item: item,
      index: index,
      window: globalThis.window,
      document: globalThis.document
    };

    // Use shared evaluation function for consistency
    return resolveTemplate(template, context);
  } catch (error) {
    console.warn(`String template evaluation failed: "${template}"`, error);
    return String(template);
  }
}

/**
 * Transforms an object template with item context
 */
function transformObject(template: object, item: any, index: number): any {
  if (Array.isArray(template)) {
    // Handle arrays recursively
    return template.map(element => transformObject(element, item, index));
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
        result[key] = transformTemplate(value, item, index);
      } else if (ACCESSOR_REGEX.test(value)) {
        // Use shared operand resolution for property accessors like 'item[0]', 'item[1].name'
        const resolved = evaluateAccessor(value, item, index);
        result[key] = resolved;
      } else {
        // Direct value string
        result[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Nested objects - recurse
      result[key] = transformObject(value, item, index);
    } else {
      // Direct values (strings, numbers, booleans, etc.)
      result[key] = value;
    }
  });

  return result;
}


/**
 * Evaluates a property accessor string like 'item.id' or 'index' 
 * with the given item and index values
 */
export function evaluateAccessor(accessor: string, item: any, index: number): any {
  // Special cases for array mapping context
  if (accessor === 'item') return item;
  if (accessor === 'index') return index;

  const context = {
    item: item,
    index: index,
    window: globalThis.window,
    document: globalThis.document
  };

  return resolveAccessor(context, accessor, accessor);
}