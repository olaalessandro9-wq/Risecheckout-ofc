/**
 * Personal Data Feature
 * 
 * Barrel export para a feature de dados pessoais.
 * Segue RISE ARCHITECT PROTOCOL: exports organizados e tipados.
 */

// Types
export type {
  PersonalData,
  PersonalDataErrors,
  PersonalDataField,
  RequiredFieldsConfig,
  FieldValidationState,
  FormValidationState,
  ValidationResult,
} from './types';

export {
  createEmptyPersonalData,
  createEmptyErrors,
  createInitialValidationState,
  parseRequiredFields,
  requiredFieldsToArray,
} from './types';

// Domain - Validators
export {
  validateField,
  validatePersonalData,
  validateRequiredFields,
} from './domain/validators';

// Domain - Masks
export {
  maskPersonalField,
  getFieldMaxLength,
  getFieldPlaceholder,
  getFieldLabel,
  getFieldInputType,
  getFieldAutocomplete,
} from './domain/masks';

// Domain - Form Snapshot
export {
  readPersonalDataFromForm,
  readFieldFromDOM,
  readAllFieldsFromDOM,
  mergeWithDOMSnapshot,
  normalizePersonalData,
  getSubmitSnapshot,
} from './domain/formSnapshot';
