/**
 * GroupPermissionsEditor - Edit which modules a group can access
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  BookOpen,
  Check,
  X,
  Loader2,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { MemberGroup, MemberModule, GroupPermission } from '@/modules/members-area/types';

interface GroupPermissionsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: MemberGroup | null;
  modules: MemberModule[];
  permissions: GroupPermission[];
  onSave: (permissions: { module_id: string; has_access: boolean }[]) => Promise<void>;
}

export function GroupPermissionsEditor({
  open,
  onOpenChange,
  group,
  modules,
  permissions,
  onSave,
}: GroupPermissionsEditorProps) {
  const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local state from permissions
  useEffect(() => {
    if (open && group) {
      const permMap: Record<string, boolean> = {};
      
      // Start with all modules having no access
      modules.forEach(m => {
        permMap[m.id] = false;
      });

      // Apply existing permissions
      permissions.forEach(p => {
        permMap[p.module_id] = p.has_access;
      });

      setLocalPermissions(permMap);
      setHasChanges(false);
    }
  }, [open, group, modules, permissions]);

  const handleToggle = (moduleId: string) => {
    setLocalPermissions(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
    setHasChanges(true);
  };

  const handleSelectAll = () => {
    const newPermissions: Record<string, boolean> = {};
    modules.forEach(m => {
      newPermissions[m.id] = true;
    });
    setLocalPermissions(newPermissions);
    setHasChanges(true);
  };

  const handleDeselectAll = () => {
    const newPermissions: Record<string, boolean> = {};
    modules.forEach(m => {
      newPermissions[m.id] = false;
    });
    setLocalPermissions(newPermissions);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const permissionsToSave = Object.entries(localPermissions).map(([module_id, has_access]) => ({
      module_id,
      has_access,
    }));

    await onSave(permissionsToSave);
    setIsSaving(false);
    setHasChanges(false);
    onOpenChange(false);
  };

  const accessCount = Object.values(localPermissions).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Permissões do Grupo
          </DialogTitle>
          <DialogDescription>
            {group?.name} - Defina quais módulos este grupo pode acessar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">
              {accessCount} de {modules.length} módulos liberados
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                <Check className="w-4 h-4 mr-1" />
                Todos
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
                <X className="w-4 h-4 mr-1" />
                Nenhum
              </Button>
            </div>
          </div>

          {/* Modules List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {modules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum módulo criado ainda</p>
              </div>
            ) : (
              modules.map((module, index) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex items-center gap-4 p-3 rounded-lg border transition-colors',
                    localPermissions[module.id]
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-muted/30 border-transparent'
                  )}
                >
                  {/* Module Info */}
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {module.cover_image_url ? (
                      <img
                        src={module.cover_image_url}
                        alt=""
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <BookOpen className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{module.title}</h4>
                    {module.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {module.description}
                      </p>
                    )}
                  </div>

                  {/* Toggle */}
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-xs font-medium',
                      localPermissions[module.id] ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {localPermissions[module.id] ? 'Liberado' : 'Bloqueado'}
                    </span>
                    <Switch
                      checked={localPermissions[module.id] || false}
                      onCheckedChange={() => handleToggle(module.id)}
                    />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Permissões
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
