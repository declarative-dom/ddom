import {
	Signal,
	SignalNode,
	createEffect
} from '../events';

/**
* Creates a template function bound to a specific context.
* This is the core building block for fine-grained reactivity.
* 
* @param template - The template string to bind
* @returns A function that evaluates the template with the given context
*/
export const bindTemplate = (template: string) => (context: any) => 
  new Function('return `' + template + '`').call(context);

/**
* Creates a Computed Signal that automatically re-evaluates a template
* when its dependencies change. This enables fine-grained reactivity.
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
* Evaluates JavaScript template literals using DOM nodes as context.
* Uses native JavaScript template literal syntax with the context node as 'this'.
* Supports direct property access, method calls, and complex expressions.
* 
* @param template - The template string to evaluate as a JavaScript template literal
* @param contextNode - The DOM node to use as the context ('this') for template evaluation
* @returns The template string evaluated with the context
* 
* @example
* ```typescript
* const element = document.querySelector('#myElement') as HTMLElement;
* element.firstName = 'John';
* element.getAttribute = (attr) => attr === 'id' ? 'myElement' : null;
* 
* // Property access
* evalTemplate('Hello, ${this.firstName}', element); // "Hello, John"
* 
* // Method calls
* evalTemplate('ID: ${this.getAttribute("id")}', element); // "ID: myElement"
* 
* // Complex expressions
* evalTemplate('${this.firstName.toUpperCase()}', element); // "JOHN"
* ```
*/
export function evalTemplate(template: string, contextNode: Node): string {
  try {
    // Create a function that evaluates the template literal with the contextNode as 'this'
    return new Function('return `' + template + '`').call(contextNode);
  } catch (error) {
    // If evaluation fails, return the original template
    console.warn(`Template evaluation failed: ${error}, Template: ${template}`);
    return template;
  }
}

/**
* Detects if a template string contains reactive expressions (${...}).
* Used to determine if fine-grained reactivity should be applied.
* 
* @param template - The template string to check
* @returns True if the template contains reactive expressions
*/
export function hasReactiveExpressions(template: string): boolean {
  return /\$\{.*?\}/.test(template);
}

/**
* Sets up fine-grained reactivity for a property by creating a Computed Signal
* and an effect that updates the specific DOM property when the template changes.
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
* Sets up fine-grained reactivity for an attribute by creating a Computed Signal
* and an effect that updates the specific DOM attribute when the template changes.
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
