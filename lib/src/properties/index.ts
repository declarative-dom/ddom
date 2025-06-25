/**
 * Properties Module Index
 * 
 * Consolidated property handling for DDOM including templates, accessors, and getter/setter support.
 */

export {
  // Template handling
  parseTemplateLiteral,
  isTemplateLiteral,
  bindTemplate,
  computedTemplate,
  bindPropertyTemplate,
  bindAttributeTemplate,
  
  // Property accessor handling
  isPropertyAccessor,
  resolvePropertyAccessor,
  
  // Getter/setter support
  isGetterDescriptor,
  isSetterDescriptor,
  bindGetterProperty,
  bindSetterProperty,
  bindAccessorProperty
} from './properties';