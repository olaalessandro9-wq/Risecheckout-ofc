/**
 * Menu Editor - Editor de itens do menu
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  Lock,
  Home,
  BookOpen,
  Play,
  Settings,
  User,
  Heart,
  Star,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MenuItemConfig } from '../../types/builder.types';

const AVAILABLE_ICONS = [
  { name: 'Home', icon: Home },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Play', icon: Play },
  { name: 'Settings', icon: Settings },
  { name: 'User', icon: User },
  { name: 'Heart', icon: Heart },
  { name: 'Star', icon: Star },
  { name: 'Bell', icon: Bell },
];

interface MenuEditorProps {
  items: MenuItemConfig[];
  onUpdate: (items: MenuItemConfig[]) => void;
}

export function MenuEditor({ items, onUpdate }: MenuEditorProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItemConfig>>({
    label: '',
    icon: 'BookOpen',
    link: '',
    is_visible: true,
  });

  const handleToggleVisibility = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    // Don't allow hiding default items
    if (item?.is_default) return;
    
    const updated = items.map(i => 
      i.id === itemId ? { ...i, is_visible: !i.is_visible } : i
    );
    onUpdate(updated);
  };

  const handleDelete = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    // Don't allow deleting default items
    if (item?.is_default) return;
    
    onUpdate(items.filter(i => i.id !== itemId));
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onUpdate(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onUpdate(newItems);
  };

  const handleAddItem = () => {
    if (!newItem.label) return;
    
    const item: MenuItemConfig = {
      id: `menu-${Date.now()}`,
      label: newItem.label,
      icon: newItem.icon || 'BookOpen',
      link: newItem.link,
      is_default: false,
      is_visible: true,
    };
    
    onUpdate([...items, item]);
    setNewItem({ label: '', icon: 'BookOpen', link: '', is_visible: true });
    setIsAddDialogOpen(false);
  };

  const getIconComponent = (iconName: string) => {
    const found = AVAILABLE_ICONS.find(i => i.name === iconName);
    return found?.icon || BookOpen;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Itens do Menu</Label>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Item ao Menu</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={newItem.label}
                  onChange={(e) => setNewItem(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Ex: Favoritos"
                />
              </div>
              <div className="space-y-2">
                <Label>Ícone</Label>
                <Select
                  value={newItem.icon}
                  onValueChange={(value) => setNewItem(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                      <SelectItem key={name} value={name}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Link (opcional)</Label>
                <Input
                  value={newItem.link}
                  onChange={(e) => setNewItem(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="/pagina-custom"
                />
              </div>
              <Button onClick={handleAddItem} className="w-full">
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => {
          const IconComponent = getIconComponent(item.icon);
          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-2 p-2 border rounded-lg',
                !item.is_visible && 'opacity-50'
              )}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              
              <IconComponent className="h-4 w-4 text-muted-foreground" />
              
              <span className="flex-1 text-sm truncate">{item.label}</span>
              
              {item.is_default && (
                <Lock className="h-3 w-3 text-muted-foreground" />
              )}
              
              <Switch
                checked={item.is_visible}
                onCheckedChange={() => handleToggleVisibility(item.id)}
                disabled={item.is_default}
              />
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
              >
                <span className="text-xs">↑</span>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleMoveDown(index)}
                disabled={index === items.length - 1}
              >
                <span className="text-xs">↓</span>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => handleDelete(item.id)}
                disabled={item.is_default}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Itens com 🔒 são obrigatórios e não podem ser removidos
      </p>
    </div>
  );
}
