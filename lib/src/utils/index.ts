/**
 * Utility Functions
 * 
 * Central export point for all utility functions.
 */

// Evaluation utilities
export {
  isSimpleProperty,
  getNestedProperty,
  evaluateExpression,
  resolveOperand
} from './evaluation';

// Detection utilities
export {
  shouldBeSignal,
  isNamespacedProperty,
  hasTemplateExpression,
  shouldBeReactive,
  SUPPORTED_PROTOTYPES,
  type PrototypeName
} from './detection';

// Validation utilities
export {
  validateNamespaceConfig,
  isValidOperator,
  isValidSortDirection,
  isValidValue,
  validateArraySource
} from './validation';

// Helper utilities
export {
  debounce,
  safeString,
  safeNumber,
  shallowClone,
  shallowEqual,
  // Mutable props detection utilities (consolidated)
  isMutableProp,
  detectMutableProps,
  analyzeMutableProperties,
  evaluateAccessor
} from './helpers';

// Serialization utilities
export {
  safeSerialize,
  safeDeserialize,
  isSerializable,
  prepareForStorage,
  restoreFromStorage,
  createStorageKey,
  isValidStorageKey
} from './serialization';


