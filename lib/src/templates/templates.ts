import {
	Signal,
	createEffect
} from '../events';

/**
 * Resolves a signal address string to the actual signal object.
 * Supports addresses like "window.todos", "this.parentNode.items", etc.
 * 
 * @param address - The signal address string
 * @param contextNode - The context node for resolving "this" references
 * @returns The resolved signal object or null if not found
 */
export function resolveSignalAddress(address: string, contextNode: Node): Signal.State<any> | Signal.Computed<any> | null {
  try {
    const resolved = new Function('return ' + address).call(contextNode);
    
    // Check if it's a signal
    if (resolved && (Signal.isState(resolved) || Signal.isComputed(resolved))) {
      return resolved;
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to resolve signal address "${address}":`, error);
    return null;
  }
}

/**
 * Creates a reactive property using a direct Signal.State object.
 * This ensures proper dependency tracking with the TC39 Signals polyfill.
 * 
 * @param el - The element to attach the property to
 * @param property - The property name
 * @param initialValue - The initial value for the property
 * @returns The Signal.State instance
 */
export function createReactiveProperty(el: any, property: string, initialValue: any): Signal.State<any> {
  const signal = new Signal.State(initialValue);
  el[property] = signal;
  return signal;
}

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
 * 
 * @param el - The DOM element
 * @param property - The property name to bind
 * @param template - The template string
 * @returns A cleanup function to dispose of the effect
 */
export function bindReactiveProperty(
  el: any, 
  property: string, 
  template: string
): () => void {
  const computedValue = computedTemplate(template, el);
  
  const cleanup = createEffect(() => {
    const newValue = computedValue.get();
    
    // Only update if the value actually changed
    if (el[property] !== newValue) {
      el[property] = newValue;
    }
  });

  // If there's a global cleanup collector, add this cleanup to it
  const globalCollector = (globalThis as any).__ddom_cleanup_collector;
  if (globalCollector && Array.isArray(globalCollector)) {
    globalCollector.push(cleanup);
  }

  return cleanup;
}

/**
 * Sets up reactive template binding for an attribute.
 * Creates a computed signal and effect that updates the attribute when template dependencies change.
 * 
 * @param el - The DOM element
 * @param attribute - The attribute name to bind
 * @param template - The template string
 * @returns A cleanup function to dispose of the effect
 */
export function bindReactiveAttribute(
  el: Element, 
  attribute: string, 
  template: string
): () => void {
  const computedValue = computedTemplate(template, el);
  
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
  });

  // If there's a global cleanup collector, add this cleanup to it
  const globalCollector = (globalThis as any).__ddom_cleanup_collector;
  if (globalCollector && Array.isArray(globalCollector)) {
    globalCollector.push(cleanup);
  }

  return cleanup;
}
