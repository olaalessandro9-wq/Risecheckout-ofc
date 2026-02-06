/**
 * Legal Pages - Barrel Exports
 * 
 * All legal pages use default exports for React.lazy compatibility.
 * Import them via lazyWithRetry() in route definitions.
 * 
 * This barrel re-exports only the LegalPageLayout (shared component).
 */

export { LegalPageLayout, type LegalSection } from "./LegalPageLayout";
