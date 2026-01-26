/**
 * BuilderMachine Actions
 * 
 * Extracted action factories for the Members Area Builder State Machine.
 * Keeps the main machine file under 300 lines (RISE V3 compliance).
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 * @module members-area-builder/machines
 */

import type { BuilderMachineContext } from "./builderMachine.types";
import type { SectionSettings, Section, Viewport } from "../types/builder.types";

// ============================================================================
// VIEWPORT HELPERS (Dual-Layout Support)
// ============================================================================

/** Get sections for active viewport */
export function getActiveSections(context: BuilderMachineContext): Section[] {
  return context.activeViewport === 'desktop' 
    ? context.desktopSections 
    : context.mobileSections;
}

/** Update sections for active viewport (with sync support) */
export function setActiveSections(
  context: BuilderMachineContext, 
  sections: Section[]
): Partial<BuilderMachineContext> {
  if (context.activeViewport === 'desktop') {
    if (context.isMobileSynced) {
      const mobileSections = sections.map(s => ({ ...s, viewport: 'mobile' as Viewport }));
      return { desktopSections: sections, mobileSections };
    }
    return { desktopSections: sections };
  }
  return { mobileSections: sections };
}

/** Clone desktop sections to mobile */
export function cloneDesktopToMobile(desktopSections: Section[]): Section[] {
  return desktopSections.map(section => ({
    ...section,
    id: `temp_${crypto.randomUUID()}`,
    viewport: 'mobile' as Viewport,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

// ============================================================================
// SECTION ACTION HELPERS (Pure functions for assign())
// ============================================================================

export function addSectionToList(
  sections: Section[],
  newSection: Section
): Section[] {
  return [...sections, newSection].sort((a, b) => a.position - b.position);
}

export function updateSectionInList(
  sections: Section[],
  id: string,
  updates: Partial<Section>
): Section[] {
  return sections.map((s) =>
    s.id === id
      ? { ...s, ...updates, updated_at: new Date().toISOString() }
      : s
  );
}

export function updateSectionSettingsInList(
  sections: Section[],
  id: string,
  settings: Partial<SectionSettings>
): Section[] {
  return sections.map((s) => {
    if (s.id !== id) return s;
    const mergedSettings = { ...s.settings, ...settings } as SectionSettings;
    return { ...s, settings: mergedSettings, updated_at: new Date().toISOString() };
  });
}

export function deleteSectionFromList(
  sections: Section[],
  id: string
): Section[] {
  return sections.filter((s) => s.id !== id);
}

export function reorderSectionsInList(
  sections: Section[],
  orderedIds: string[]
): Section[] {
  const sectionMap = new Map(sections.map((s) => [s.id, s]));
  return orderedIds.map((id, index) => ({
    ...sectionMap.get(id)!,
    position: index,
    updated_at: new Date().toISOString(),
  }));
}

export function duplicateSectionInList(
  sections: Section[],
  original: Section,
  duplicate: Section
): Section[] {
  const updated = sections.map((s) =>
    s.position > original.position ? { ...s, position: s.position + 1 } : s
  );
  return [...updated, duplicate].sort((a, b) => a.position - b.position);
}

// ============================================================================
// SELECTION HELPERS
// ============================================================================

export function getSelectedSectionAfterDelete(
  currentId: string | null,
  deletedId: string
): string | null {
  return currentId === deletedId ? null : currentId;
}
