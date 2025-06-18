/**
 * Namespace Handler System for DDOM
 * 
 * This module provides a modular system for handling reserved namespaces
 * in DDOM object specifications. Each namespace (like Request, WebSocket, 
 * IndexedDB, etc.) can have its own dedicated handler.
 * 
 * The system is designed to be extensible and avoid hardcoded conditional
 * chains in the main property handler.
 */

export type NamespaceHandler = (el: any, property: string, spec: any) => () => void;

const namespaceHandlers = new Map<string, NamespaceHandler>();

/**
 * Registers a namespace handler for a specific namespace key
 * @param namespace - The namespace key (e.g., 'Request', 'WebSocket')
 * @param handler - The handler function for this namespace
 */
export function registerNamespaceHandler(namespace: string, handler: NamespaceHandler): void {
  namespaceHandlers.set(namespace, handler);
}

/**
 * Detects if a value contains a reserved namespace and returns the namespace info
 * @param value - The value to check for namespace
 * @returns Object with namespace info or null if no namespace detected
 */
export function detectNamespace(value: any): { namespace: string; spec: any } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  // Look for reserved namespace keys
  for (const [key, spec] of Object.entries(value)) {
    if (namespaceHandlers.has(key)) {
      return { namespace: key, spec };
    }
  }

  return null;
}

/**
 * Handles a namespace property by delegating to the appropriate handler
 * @param el - The DOM element
 * @param property - The property name
 * @param value - The value containing the namespace
 * @returns Cleanup function or null if no handler found
 */
export function handleNamespace(el: any, property: string, value: any): (() => void) | null {
  const namespaceInfo = detectNamespace(value);
  
  if (!namespaceInfo) {
    return null;
  }

  const handler = namespaceHandlers.get(namespaceInfo.namespace);
  if (!handler) {
    console.warn(`No handler registered for namespace: ${namespaceInfo.namespace}`);
    return null;
  }

  return handler(el, property, namespaceInfo.spec);
}

/**
 * Gets all registered namespace keys
 * @returns Array of registered namespace keys
 */
export function getRegisteredNamespaces(): string[] {
  return Array.from(namespaceHandlers.keys());
}

/**
 * Checks if a namespace is registered
 * @param namespace - The namespace to check
 * @returns True if the namespace is registered
 */
export function isNamespaceRegistered(namespace: string): boolean {
  return namespaceHandlers.has(namespace);
}