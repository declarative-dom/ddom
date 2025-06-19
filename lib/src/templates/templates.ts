import {
	Signal,
	createEffect,
	ComponentSignalWatcher
} from '../events';

import {
  resolvePropertyAccessor
} from '../accessors';

/**
 * Evaluates JavaScript template literals using DOM nodes as context.
 * Uses native JavaScript template literal syntax with the context node as 'this'.
 * 
 * @param template - The template string to evaluate as a JavaScript template literal
 * @param contextNode - The DOM node to use as the context ('this') for template evaluation
 * @returns The template string evaluated with the context
 */
export function parseTemplateLiteral(template: string, contextNode: Node): string {
  try {
    return new Function('return `' + template + '`').call(contextNode);
  } catch (error) {
    console.warn(`Template evaluation failed: ${error}, Template: ${template}`);
    return template;
  }
}

/**
 * Detects if a template string contains reactive expressions (${...}).
 * Simple detection - just looks for ${. To display literal ${} in text,
 * escape the dollar sign with a backslash: \${
 * 
 * @param template - The template string to check
 * @returns True if the template contains reactive expressions
 */
export function isTemplateLiteral(template: string): boolean {
  return template.includes('${');
}

/**
 * Creates a template function bound to a specific context.
 * 
 * @param template - The template string to bind
 * @returns A function that evaluates the template with the given context
 */
export const bindTemplate = (template: string) => (context: any) => 
  new Function('return `' + template + '`').call(context);

/**
 * Creates a Computed Signal that automatically re-evaluates a template
 * when its dependencies change.
 * 
 * @param template - The template string to make reactive
 * @param contextNode - The DOM node to use as context
 * @returns A Computed Signal that re-evaluates the template when dependencies change
 */
export function computedTemplate(template: string, contextNode: Node): Signal.Computed<string> {
  const templateFn = bindTemplate(template);
  
  return new Signal.Computed(() => {
    try {
      return templateFn(contextNode);
    } catch (error) {
      console.warn(`Computed template evaluation failed: ${error}, Template: ${template}`);
      return template;
    }
  });
}

/**
 * Sets up reactive template binding for a property.
 * Creates a computed signal and effect that updates the property when template dependencies change.
 * Uses AbortController for modern cleanup pattern and component-specific watcher when available.
 * 
 * @param el - The DOM element
 * @param property - The property name to bind
 * @param template - The template string
 * @returns A cleanup function to dispose of the effect
 */
export function bindPropertyTemplate(
  el: any, 
  property: string, 
  template: string
): () => void {
  const computedValue = computedTemplate(template, el);
  
  // Use component-specific watcher if available, otherwise fall back to global
  const componentWatcher = (globalThis as any).__ddom_component_watcher as ComponentSignalWatcher | undefined;
  
  const cleanup = createEffect(() => {
    const newValue = computedValue.get();
    
    // Only update if the value actually changed
    if (el[property] !== newValue) {
      el[property] = newValue;
    }
  }, componentWatcher);

  // Use AbortController signal for automatic cleanup if available
  const signal = (globalThis as any).__ddom_abort_signal;
  if (signal && !signal.aborted) {
    signal.addEventListener('abort', cleanup, { once: true });
  }

  return cleanup;
}

/**
 * Sets up reactive template binding for an attribute.
 * Creates a computed signal and effect that updates the attribute when template dependencies change.
 * Uses AbortController for modern cleanup pattern and component-specific watcher when available.
 * 
 * @param el - The DOM element
 * @param attribute - The attribute name to bind
 * @param template - The template string
 * @returns A cleanup function to dispose of the effect
 */
export function bindAttributeTemplate(
  el: Element, 
  attribute: string, 
  template: string
): () => void {
  const computedValue = computedTemplate(template, el);
  
  // Use component-specific watcher if available, otherwise fall back to global
  const componentWatcher = (globalThis as any).__ddom_component_watcher as ComponentSignalWatcher | undefined;
  
  const cleanup = createEffect(() => {
    const newValue = computedValue.get();
    const currentValue = el.getAttribute(attribute);
    
    // Only update if the value actually changed
    if (currentValue !== newValue) {
      if (newValue === null || newValue === undefined || newValue === '') {
        el.removeAttribute(attribute);
      } else {
        el.setAttribute(attribute, String(newValue));
      }
    }
  }, componentWatcher);

  // Use AbortController signal for automatic cleanup if available
  const signal = (globalThis as any).__ddom_abort_signal;
  if (signal && !signal.aborted) {
    signal.addEventListener('abort', cleanup, { once: true });
  }

  return cleanup;
}
