/**
 * DOM Property Binding System
 * 
 * This module handles all DOM mutations and property binding logic for the DDOM library.
 * It provides a clean interface for applying property resolutions to DOM elements,
 * separating pure property resolution logic from side-effect operations.
 * 
 * The binding system supports:
 * - Reactive property binding with signals and computed values
 * - Direct property assignment for static values
 * - DOM attribute manipulation with automatic type conversion
 * - CSS style property binding with reactive updates
 * - Event handler attachment
 * - Namespace property handling (arrays, storage, etc.)
 * 
 * This is where the "rubber meets the road" for DDOM's declarative-to-imperative
 * translation. All DOM mutations are centralized here to maintain clean separation
 * of concerns and enable easier testing and debugging.
 * 
 * @module dom/binding
 * @version 0.4.0
 * @author Declarative DOM Working Group
 */

import { DOMSpec, DOMNode } from '../types';
import { PropertyResolution } from '../core/properties';
import { DOMSpecOptions } from './element';
import { createEffect, Signal } from '../core/signals';
import { processProperty } from '../core/properties';

/**
 * Applies a property resolution to a DOM element (side-effect function).
 * This is where all DOM mutations happen, separated from pure property resolution logic.
 * Handles different assignment types including namespace properties, reactive bindings,
 * direct assignments, attributes, and event handlers.
 * 
 * Note: Style handling is delegated to specific modules (elements.ts or custom-elements.ts)
 * because they have different patterns for selector generation and style application.
 * 
 * @param spec - The declarative DOM specification object containing the property
 * @param el - The target DOM node to apply the property resolution to
 * @param key - The property name being resolved and applied
 * @param resolution - The resolved property information including value and assignment type
 * @param options - Optional configuration for DOM operations (ignoreKeys, css flags, etc.)
 * @returns void - This function performs side effects on the DOM element
 * 
 * @example
 * ```typescript
 * const resolution = resolveProperty('textContent', 'Hello World', element);
 * applyPropertyResolution(spec, element, 'textContent', resolution);
 * ```
 * 
 * @example
 * ```typescript
 * // Applying a reactive property
 * const resolution = resolveProperty('value', signal, inputElement);
 * applyPropertyResolution(spec, inputElement, 'value', resolution);
 * ```
 */
export function applyPropertyResolution(
  spec: DOMSpec,
  el: DOMNode,
  key: string,
  resolution: PropertyResolution,
  options: DOMSpecOptions = {}
): void {
  switch (resolution.assignmentType) {
    case 'namespace':
      // For namespace properties like Array children, don't assign to element
      // The namespace handler already created the signal, no assignment needed
      break;

    case 'special':
      // Delegate to the existing property handlers for special cases
      processProperty(spec, el, key, resolution.value, options);
      break;

    case 'direct':
      // Direct property assignment
      if (resolution.isReactive) {
        // Set up reactive binding
        setupReactiveProperty(el, key, resolution.value);
      } else {
        // Simple assignment
        (el as any)[key] = resolution.value;
      }
      break;

    case 'attribute':
      const attributeName = resolution.metadata?.attributeName || key;
      if (el instanceof Element) {
        el.setAttribute(attributeName, String(resolution.value));
      }
      break;

    case 'style':
      // Style handling is delegated to the calling module (elements.ts or custom-elements.ts)
      // because they have different patterns for selector generation and style application
      console.warn('Style property resolution should be handled by the calling module, not the binding layer');
      break;

    case 'event':
      const eventName = resolution.metadata?.eventName;
      if (eventName && el instanceof EventTarget) {
        el.addEventListener(eventName, resolution.value);
      }
      break;

    default:
      console.warn(`Unknown assignment type: ${resolution.assignmentType}`);
  }
}

/**
 * Sets up reactive property binding for signals and computed values.
 * Automatically detects if a value is a signal and establishes reactive updates,
 * otherwise performs a direct assignment. This function handles the reactive
 * data binding core of DDOM's reactivity system.
 * 
 * @param el - The DOM node to bind the property to
 * @param key - The property name to bind (e.g., 'textContent', 'value', 'checked')
 * @param value - The value to bind, can be a signal, computed value, or static value
 * @returns void - This function performs side effects by setting up reactive bindings
 * 
 * @example
 * ```typescript
 * // Binding a signal to textContent
 * const textSignal = new Signal.State('Hello');
 * setupReactiveProperty(element, 'textContent', textSignal);
 * ```
 * 
 * @example
 * ```typescript
 * // Binding a computed value to disabled property
 * const isDisabled = new Signal.Computed(() => count.get() > 10);
 * setupReactiveProperty(button, 'disabled', isDisabled);
 * ```
 * 
 * @example
 * ```typescript
 * // Static value binding (no reactivity)
 * setupReactiveProperty(element, 'id', 'my-element');
 * ```
 */
export function setupReactiveProperty(el: DOMNode, key: string, value: any): void {
  if (value && typeof value === 'object' && typeof value.get === 'function') {
    // This is a signal - set up reactive binding
    const updateProperty = () => {
      const currentValue = value.get();
      (el as any)[key] = currentValue;
    };

    // Set initial value
    updateProperty();

    // Set up reactive effect for future updates
    createEffect(() => {
      updateProperty();
    });
  } else {
    // Not a signal, just assign directly
    (el as any)[key] = value;
  }
}

/**
 * Binds a signal value to a DOM property with automatic updates.
 * Creates a reactive effect that updates the DOM property whenever the signal changes.
 * This is a low-level binding function for direct property assignment.
 * 
 * @param element - The DOM node to bind the property to
 * @param property - The property name to update (e.g., 'textContent', 'value', 'checked')
 * @param signal - The signal or computed value to bind to the property
 * @returns A cleanup function to remove the reactive effect
 * 
 * @example
 * ```typescript
 * const nameSignal = new Signal.State('John');
 * const cleanup = bindSignalToProperty(span, 'textContent', nameSignal);
 * 
 * // Later, to stop reactivity:
 * cleanup();
 * ```
 * 
 * @example
 * ```typescript
 * // Binding input value
 * const inputValue = new Signal.State('');
 * bindSignalToProperty(input, 'value', inputValue);
 * ```
 */
export function bindSignalToProperty(
  element: DOMNode,
  property: string,
  signal: Signal.State<any> | Signal.Computed<any>
): () => void {
  const updateProperty = () => {
    (element as any)[property] = signal.get();
  };

  // Set initial value
  updateProperty();

  // Set up reactive effect
  return createEffect(() => {
    updateProperty();
  });
}

/**
 * Binds a signal value to a DOM attribute with automatic updates.
 * Creates a reactive effect that updates the DOM attribute whenever the signal changes.
 * Handles null/undefined values by removing the attribute entirely.
 * 
 * @param element - The DOM element to bind the attribute to (must be an Element)
 * @param attributeName - The attribute name to update (e.g., 'class', 'data-value', 'aria-label')
 * @param signal - The signal or computed value to bind to the attribute
 * @returns A cleanup function to remove the reactive effect
 * 
 * @example
 * ```typescript
 * const classSignal = new Signal.State('active');
 * const cleanup = bindSignalToAttribute(div, 'class', classSignal);
 * 
 * // Updates the class attribute when signal changes
 * classSignal.set('inactive');
 * ```
 * 
 * @example
 * ```typescript
 * // Binding data attribute
 * const dataValue = new Signal.Computed(() => `item-${id.get()}`);
 * bindSignalToAttribute(element, 'data-item-id', dataValue);
 * ```
 * 
 * @example
 * ```typescript
 * // Conditional attribute (removes when null/undefined)
 * const ariaLabel = new Signal.Computed(() => showLabel.get() ? 'Close' : null);
 * bindSignalToAttribute(button, 'aria-label', ariaLabel);
 * ```
 */
export function bindSignalToAttribute(
  element: Element,
  attributeName: string,
  signal: Signal.State<any> | Signal.Computed<any>
): () => void {
  const updateAttribute = () => {
    const value = signal.get();
    if (value == null) {
      element.removeAttribute(attributeName);
    } else {
      element.setAttribute(attributeName, String(value));
    }
  };

  // Set initial value
  updateAttribute();

  // Set up reactive effect
  return createEffect(() => {
    updateAttribute();
  });
}

/**
 * Binds a signal value to a CSS style property with automatic updates.
 * Creates a reactive effect that updates the element's style property whenever the signal changes.
 * Supports all CSS properties and handles type conversion to strings as needed.
 * 
 * @param element - The HTML element to bind the style property to (must be an HTMLElement)
 * @param styleProperty - The CSS style property name (e.g., 'color', 'fontSize', 'backgroundColor')
 * @param signal - The signal or computed value to bind to the style property
 * @returns A cleanup function to remove the reactive effect
 * 
 * @example
 * ```typescript
 * const colorSignal = new Signal.State('red');
 * const cleanup = bindSignalToStyle(div, 'color', colorSignal);
 * 
 * // Updates the color style when signal changes
 * colorSignal.set('blue');
 * ```
 * 
 * @example
 * ```typescript
 * // Binding computed styles
 * const fontSize = new Signal.Computed(() => `${scale.get() * 16}px`);
 * bindSignalToStyle(text, 'fontSize', fontSize);
 * ```
 * 
 * @example
 * ```typescript
 * // Dynamic background color based on state
 * const bgColor = new Signal.Computed(() => 
 *   isActive.get() ? '#007bff' : '#6c757d'
 * );
 * bindSignalToStyle(button, 'backgroundColor', bgColor);
 * ```
 */
export function bindSignalToStyle(
  element: HTMLElement,
  styleProperty: string,
  signal: Signal.State<any> | Signal.Computed<any>
): () => void {
  const updateStyle = () => {
    const value = signal.get();
    (element.style as any)[styleProperty] = value;
  };

  // Set initial value
  updateStyle();

  // Set up reactive effect
  return createEffect(() => {
    updateStyle();
  });
}
