/**
 * UnifiedGroupModal - Modal unificado para criar/editar grupos
 * Inclui seções para módulos e ofertas (estilo Kiwify)
 * Optimized: Removed heavy framer-motion animations for better performance
 */

import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Loader2,
  Save,
  Tag,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { MemberGroup, GroupPermission } from '@/modules/members-area/types';
import type { MemberModule } from '@/modules/members-area/types/module.types';
import type { ProductOffer } from '@/modules/members-area/services/groups.service';

interface UnifiedGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  group?: MemberGroup | null;
  modules: MemberModule[];
  offers: ProductOffer[];
  permissions?: GroupPermission[];
  onSave: (data: {
    name: string;
    description?: string;
    is_default: boolean;
    permissions: { module_id: string; has_access: boolean }[];
    linkedOfferIds: string[];
  }) => Promise<boolean>;
  isLoadingPermissions?: boolean;
}

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
  
  // Module permissions state
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
  
  // Offer linking state
  const [linkedOffers, setLinkedOffers] = useState<Record<string, boolean>>({});
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    modules?: string;
  }>({});

  // Initialize form when modal opens or group changes
  useEffect(() => {
    // Guard: Don't reinitialize during save to prevent visual "flicker"
    if (isSaving) return;
    
    if (open) {
      if (mode === 'edit' && group) {
        setName(group.name);
        setDescription(group.description || '');
        setIsDefault(group.is_default);
        
        // Initialize module permissions
        const permMap: Record<string, boolean> = {};
        modules.forEach(m => {
          permMap[m.id] = false;
        });
        permissions.forEach(p => {
          permMap[p.module_id] = p.has_access ?? p.can_access ?? false;
        });
        setModuleAccess(permMap);
        
        // Initialize offer links (offers that have this group's id)
        const offerMap: Record<string, boolean> = {};
        offers.forEach(o => {
          offerMap[o.id] = o.member_group_id === group.id;
        });
        setLinkedOffers(offerMap);
      } else {
        // Create mode - reset form
        setName('');
        setDescription('');
        setIsDefault(false);
        
        // All modules unselected by default
        const permMap: Record<string, boolean> = {};
        modules.forEach(m => {
          permMap[m.id] = false;
        });
        setModuleAccess(permMap);
        
        // All offers unselected by default
        const offerMap: Record<string, boolean> = {};
        offers.forEach(o => {
          offerMap[o.id] = false;
        });
        setLinkedOffers(offerMap);
      }
    }
  }, [open, mode, group, modules, offers, permissions, isSaving]);

  // Computed values
  const accessCount = useMemo(() => 
    Object.values(moduleAccess).filter(Boolean).length,
    [moduleAccess]
  );
  
  const linkedOffersCount = useMemo(() => 
    Object.values(linkedOffers).filter(Boolean).length,
    [linkedOffers]
  );
  
  const allModulesSelected = useMemo(() => 
    modules.length > 0 && accessCount === modules.length,
    [modules.length, accessCount]
  );

  // Validation
  const isFormInvalid = useMemo(() => {
    if (!name.trim()) return true;
    if (modules.length > 0 && accessCount === 0) return true;
    return false;
  }, [name, modules.length, accessCount]);

  // Handlers
  const handleToggleModule = (moduleId: string) => {
    setModuleAccess(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
    if (errors.modules) setErrors(prev => ({ ...prev, modules: undefined }));
  };

  const handleSelectAllModules = () => {
    const newState: Record<string, boolean> = {};
    const shouldSelect = !allModulesSelected;
    modules.forEach(m => {
      newState[m.id] = shouldSelect;
    });
    setModuleAccess(newState);
    if (errors.modules) setErrors(prev => ({ ...prev, modules: undefined }));
  };

  const handleToggleOffer = (offerId: string) => {
    setLinkedOffers(prev => ({
      ...prev,
      [offerId]: !prev[offerId],
    }));
  };

  const handleSave = async () => {
    // Validate
    const newErrors: typeof errors = {};
    
    if (!name.trim()) {
      newErrors.name = 'O nome do grupo é obrigatório';
    }
    
    if (modules.length > 0 && accessCount === 0) {
      newErrors.modules = 'Selecione pelo menos 1 módulo';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSaving(true);
    
    const permissionsToSave = Object.entries(moduleAccess).map(([module_id, has_access]) => ({
      module_id,
      has_access,
    }));
    
    const linkedOfferIds = Object.entries(linkedOffers)
      .filter(([, isLinked]) => isLinked)
      .map(([id]) => id);
    
    const success = await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      is_default: isDefault,
      permissions: permissionsToSave,
      linkedOfferIds,
    });
    
    setIsSaving(false);
    
    // Only close modal if save was successful
    if (success) {
      onOpenChange(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Novo Grupo de Acesso' : 'Editar Grupo'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Configure o grupo, seus módulos e ofertas vinculadas'
              : `Editando: ${group?.name}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nome do grupo *</Label>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                }}
                placeholder="Ex: VIP, Premium, Básico..."
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-description">Descrição (opcional)</Label>
              <Textarea
                id="group-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o propósito deste grupo..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor="is-default">Grupo padrão</Label>
                <p className="text-xs text-muted-foreground">
                  Novos alunos serão adicionados automaticamente
                </p>
              </div>
              <Switch
                id="is-default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
          </div>

          <Separator />

          {/* Modules Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h4 className="font-medium text-sm">Módulos que esse grupo tem acesso</h4>
              </div>
              <span className="text-xs text-muted-foreground">
                {accessCount} de {modules.length}
              </span>
            </div>

            {isLoadingPermissions ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Carregando permissões...</span>
              </div>
            ) : modules.length > 0 ? (
              <>
                {/* Select All Checkbox */}
                <div 
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={handleSelectAllModules}
                >
                  <Checkbox 
                    checked={allModulesSelected}
                    onCheckedChange={handleSelectAllModules}
                  />
                  <span className="text-sm font-medium">Todos os módulos</span>
                </div>

                {/* Modules List - Optimized without animations */}
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        moduleAccess[module.id]
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-card border-transparent hover:border-border'
                      )}
                      onClick={() => handleToggleModule(module.id)}
                    >
                      <Checkbox 
                        checked={moduleAccess[module.id] || false}
                        onCheckedChange={() => handleToggleModule(module.id)}
                      />
                      
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                        {module.cover_image_url ? (
                          <img
                            src={module.cover_image_url}
                            alt=""
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{module.title}</p>
                        {module.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {module.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum módulo criado ainda</p>
              </div>
            )}
            
            {errors.modules && (
              <p className="text-sm text-destructive mt-1">{errors.modules}</p>
            )}
          </div>

          <Separator />

          {/* Offers Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                <h4 className="font-medium text-sm">Ofertas que dão acesso a esse grupo</h4>
              </div>
              <span className="text-xs text-muted-foreground">
                {linkedOffersCount} selecionada{linkedOffersCount !== 1 ? 's' : ''}
              </span>
            </div>

            {offers.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
                  <span>Oferta</span>
                  <span className="text-right">Preço</span>
                  <span className="w-8"></span>
                </div>

                {/* Table Body */}
                <div className="divide-y">
                  {offers.map((offer) => (
                    <div
                      key={offer.id}
                      className={cn(
                        'grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 items-center cursor-pointer transition-colors',
                        linkedOffers[offer.id] 
                          ? 'bg-primary/5' 
                          : 'hover:bg-muted/30'
                      )}
                      onClick={() => handleToggleOffer(offer.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{offer.name}</span>
                        {offer.is_default && (
                          <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded shrink-0">
                            Principal
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-right">
                        {formatPrice(offer.price)}
                      </span>
                      <Checkbox 
                        checked={linkedOffers[offer.id] || false}
                        onCheckedChange={() => handleToggleOffer(offer.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma oferta ativa para este produto</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Alunos que comprarem pelas ofertas selecionadas serão automaticamente adicionados a este grupo.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isFormInvalid}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {mode === 'create' ? 'Criar Grupo' : 'Salvar'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
