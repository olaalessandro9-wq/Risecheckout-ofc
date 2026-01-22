/**
 * UnifiedGroupModal - Container component for create/edit group modal
 * Orchestrates the modular sub-components
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { GroupFormFields } from './GroupFormFields';
import { ModulesAccessSection } from './ModulesAccessSection';
import { OffersLinkSection } from './OffersLinkSection';
import type { UnifiedGroupModalProps } from './types';

export function UnifiedGroupModal({
  open,
  onOpenChange,
  mode,
  group,
  modules,
  offers,
  permissions = [],
  onSave,
  isLoadingPermissions = false,
}: UnifiedGroupModalProps) {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
  const [linkedOffers, setLinkedOffers] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; modules?: string }>({});

  // Initialize form when modal opens
  useEffect(() => {
    if (isSaving || !open) return;
    
    if (mode === 'edit' && group) {
      setName(group.name);
      setDescription(group.description || '');
      setIsDefault(group.is_default);
      
      const permMap: Record<string, boolean> = {};
      modules.forEach(m => { permMap[m.id] = false; });
      permissions.forEach(p => { permMap[p.module_id] = p.has_access ?? p.can_access ?? false; });
      setModuleAccess(permMap);
      
      const offerMap: Record<string, boolean> = {};
      offers.forEach(o => { offerMap[o.id] = o.member_group_id === group.id; });
      setLinkedOffers(offerMap);
    } else {
      setName('');
      setDescription('');
      setIsDefault(false);
      const permMap: Record<string, boolean> = {};
      modules.forEach(m => { permMap[m.id] = false; });
      setModuleAccess(permMap);
      const offerMap: Record<string, boolean> = {};
      offers.forEach(o => { offerMap[o.id] = false; });
      setLinkedOffers(offerMap);
    }
  }, [open, mode, group, modules, offers, permissions, isSaving]);

  // Computed values
  const accessCount = useMemo(() => Object.values(moduleAccess).filter(Boolean).length, [moduleAccess]);
  const linkedCount = useMemo(() => Object.values(linkedOffers).filter(Boolean).length, [linkedOffers]);
  const allModulesSelected = useMemo(() => modules.length > 0 && accessCount === modules.length, [modules.length, accessCount]);
  const isFormInvalid = useMemo(() => !name.trim() || (modules.length > 0 && accessCount === 0), [name, modules.length, accessCount]);

  // Handlers
  const handleToggleModule = useCallback((moduleId: string) => {
    setModuleAccess(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    setErrors(prev => ({ ...prev, modules: undefined }));
  }, []);

  const handleSelectAllModules = useCallback(() => {
    const shouldSelect = !allModulesSelected;
    const newState: Record<string, boolean> = {};
    modules.forEach(m => { newState[m.id] = shouldSelect; });
    setModuleAccess(newState);
    setErrors(prev => ({ ...prev, modules: undefined }));
  }, [allModulesSelected, modules]);

  const handleToggleOffer = useCallback((offerId: string) => {
    setLinkedOffers(prev => ({ ...prev, [offerId]: !prev[offerId] }));
  }, []);

  const clearNameError = useCallback(() => {
    setErrors(prev => ({ ...prev, name: undefined }));
  }, []);

  const handleSave = async () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'O nome do grupo é obrigatório';
    if (modules.length > 0 && accessCount === 0) newErrors.modules = 'Selecione pelo menos 1 módulo';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    
    setIsSaving(true);
    const permissionsToSave = Object.entries(moduleAccess).map(([module_id, has_access]) => ({ module_id, has_access }));
    const linkedOfferIds = Object.entries(linkedOffers).filter(([, isLinked]) => isLinked).map(([id]) => id);
    
    const success = await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      is_default: isDefault,
      permissions: permissionsToSave,
      linkedOfferIds,
    });
    
    setIsSaving(false);
    if (success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Novo Grupo de Acesso' : 'Editar Grupo'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Configure o grupo, seus módulos e ofertas vinculadas' : `Editando: ${group?.name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          <GroupFormFields
            name={name} setName={setName}
            description={description} setDescription={setDescription}
            isDefault={isDefault} setIsDefault={setIsDefault}
            nameError={errors.name} clearNameError={clearNameError}
          />
          <Separator />
          <ModulesAccessSection
            modules={modules} moduleAccess={moduleAccess}
            isLoading={isLoadingPermissions} accessCount={accessCount}
            allSelected={allModulesSelected} error={errors.modules}
            onToggleModule={handleToggleModule} onSelectAll={handleSelectAllModules}
          />
          <Separator />
          <OffersLinkSection
            offers={offers} linkedOffers={linkedOffers}
            linkedCount={linkedCount} onToggleOffer={handleToggleOffer}
          />
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving || isFormInvalid}>
            {isSaving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>) : (<><Save className="w-4 h-4 mr-2" />{mode === 'create' ? 'Criar Grupo' : 'Salvar'}</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
