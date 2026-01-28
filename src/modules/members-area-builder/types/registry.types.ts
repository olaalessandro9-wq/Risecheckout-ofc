/**
 * Members Area Builder - Registry Types
 * Configuração do Registry de Seções
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * @module members-area-builder/types
 */

import type { SectionType } from './section.types';
import type { SectionSettings } from './settings.types';

// =====================================================
// SECTION REGISTRY CONFIG
// =====================================================

export interface SectionConfig<T extends SectionSettings = SectionSettings> {
  type: SectionType;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  maxInstances: number; // -1 = unlimited
  isRequired: boolean; // Cannot be deleted
  canDuplicate: boolean; // Can be duplicated
  canMove: boolean; // Can be moved up/down
  defaults: Omit<T, 'type'>;
}
