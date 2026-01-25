/**
 * BuilderMachine Guards
 * 
 * Guard functions for the Members Area Builder State Machine.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 * @module members-area-builder/machines
 */

import type { BuilderMachineContext } from './builderMachine.types';
import type { Section, MembersAreaBuilderSettings } from '../types/builder.types';

// ============================================================================
// DIRTY CHECK
// ============================================================================

function sectionsChanged(current: Section[], original: Section[]): boolean {
  if (current.length !== original.length) return true;
  
  // Check if IDs match and positions/content match
  const originalMap = new Map(original.map(s => [s.id, s]));
  
  for (const section of current) {
    const orig = originalMap.get(section.id);
    if (!orig) return true; // New section
    if (section.position !== orig.position) return true;
    if (section.title !== orig.title) return true;
    if (section.is_active !== orig.is_active) return true;
    if (JSON.stringify(section.settings) !== JSON.stringify(orig.settings)) return true;
  }
  
  return false;
}

function settingsChanged(current: MembersAreaBuilderSettings, original: MembersAreaBuilderSettings): boolean {
  return JSON.stringify(current) !== JSON.stringify(original);
}

// ============================================================================
// GUARDS
// ============================================================================

export function isDirty({ context }: { context: BuilderMachineContext }): boolean {
  const desktopChanged = sectionsChanged(context.desktopSections, context.originalDesktopSections);
  const mobileChanged = sectionsChanged(context.mobileSections, context.originalMobileSections);
  const settingsChange = settingsChanged(context.settings, context.originalSettings);
  
  return desktopChanged || mobileChanged || settingsChange;
}

export function canSave({ context }: { context: BuilderMachineContext }): boolean {
  return isDirty({ context });
}

export function hasSelectedSection({ context }: { context: BuilderMachineContext }): boolean {
  return context.selectedSectionId !== null;
}

export function hasProduct({ context }: { context: BuilderMachineContext }): boolean {
  return context.productId !== null;
}
