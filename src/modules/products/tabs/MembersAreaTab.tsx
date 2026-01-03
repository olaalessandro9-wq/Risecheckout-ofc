/**
 * MembersAreaTab - Aba de configuração da Área de Membros
 * 
 * Permite ao vendedor habilitar a área de membros e gerenciar
 * módulos e conteúdos para os compradores.
 */

import { useState } from "react";
import { useProductContext } from "../context/ProductContext";
import { useMembersArea } from "@/hooks/useMembersArea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Edit2, 
  GripVertical, 
  Play, 
  FileText, 
  Link as LinkIcon, 
  Download, 
  FileType,
  Users,
  Lock,
  ExternalLink
} from "lucide-react";

const contentTypeOptions = [
  { value: "video", label: "Vídeo", icon: Play },
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "link", label: "Link Externo", icon: LinkIcon },
  { value: "text", label: "Texto/HTML", icon: FileType },
  { value: "download", label: "Download", icon: Download },
];

const contentTypeIcons: Record<string, React.ReactNode> = {
  video: <Play className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  link: <LinkIcon className="h-4 w-4" />,
  text: <FileType className="h-4 w-4" />,
  download: <Download className="h-4 w-4" />,
};

export function MembersAreaTab() {
  const { product: productData } = useProductContext();
  const {
    isLoading,
    isSaving,
    settings,
    modules,
    updateSettings,
    addModule,
    updateModule,
    deleteModule,
    addContent,
    updateContent,
    deleteContent,
  } = useMembersArea(productData?.id);

  // Dialog states
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<{ id: string; title: string; description: string } | null>(null);
  const [editingContent, setEditingContent] = useState<any>(null);

  // Form states
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [contentTitle, setContentTitle] = useState("");
  const [contentDescription, setContentDescription] = useState("");
  const [contentType, setContentType] = useState<string>("video");
  const [contentUrl, setContentUrl] = useState("");

  const handleToggleEnabled = async (enabled: boolean) => {
    await updateSettings(enabled);
  };

  const handleAddModule = async () => {
    if (!moduleTitle.trim()) return;
    await addModule(moduleTitle, moduleDescription);
    setModuleTitle("");
    setModuleDescription("");
    setIsAddModuleOpen(false);
  };

  const handleUpdateModule = async () => {
    if (!editingModule || !editingModule.title.trim()) return;
    await updateModule(editingModule.id, { 
      title: editingModule.title, 
      description: editingModule.description || null 
    });
    setEditingModule(null);
  };

  const handleDeleteModule = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este módulo e todo seu conteúdo?")) {
      await deleteModule(id);
    }
  };

  const handleOpenAddContent = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setContentTitle("");
    setContentDescription("");
    setContentType("video");
    setContentUrl("");
    setIsAddContentOpen(true);
  };

  const handleAddContent = async () => {
    if (!selectedModuleId || !contentTitle.trim()) return;
    await addContent(selectedModuleId, {
      title: contentTitle,
      description: contentDescription || null,
      content_type: contentType as any,
      content_url: contentUrl || null,
      content_data: {},
      is_active: true,
    });
    setIsAddContentOpen(false);
  };

  const handleUpdateContent = async () => {
    if (!editingContent || !editingContent.title.trim()) return;
    await updateContent(editingContent.id, {
      title: editingContent.title,
      description: editingContent.description || null,
      content_type: editingContent.content_type,
      content_url: editingContent.content_url || null,
    });
    setEditingContent(null);
  };

  const handleDeleteContent = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este conteúdo?")) {
      await deleteContent(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Área de Membros</CardTitle>
                <CardDescription>
                  Crie conteúdos exclusivos para seus compradores
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="members-enabled" className="text-sm">
                {settings.enabled ? "Ativada" : "Desativada"}
              </Label>
              <Switch
                id="members-enabled"
                checked={settings.enabled}
                onCheckedChange={handleToggleEnabled}
                disabled={isSaving}
              />
            </div>
          </div>
        </CardHeader>
        {settings.enabled && (
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Link de acesso para compradores:
              </span>
              <code className="text-sm bg-background px-2 py-1 rounded border">
                /minha-conta
              </code>
            </div>
          </CardContent>
        )}
      </Card>

      {settings.enabled && (
        <>
          {/* Modules Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Módulos</CardTitle>
                  <CardDescription>
                    Organize seu conteúdo em módulos
                  </CardDescription>
                </div>
                <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Módulo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Módulo</DialogTitle>
                      <DialogDescription>
                        Crie um novo módulo para organizar seus conteúdos
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Título do Módulo</Label>
                        <Input
                          placeholder="Ex: Módulo 1 - Introdução"
                          value={moduleTitle}
                          onChange={(e) => setModuleTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição (opcional)</Label>
                        <Textarea
                          placeholder="Descreva o conteúdo deste módulo..."
                          value={moduleDescription}
                          onChange={(e) => setModuleDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddModuleOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddModule} disabled={!moduleTitle.trim() || isSaving}>
                        {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Criar Módulo
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhum módulo criado ainda</p>
                  <p className="text-sm text-muted-foreground">
                    Clique em "Novo Módulo" para começar
                  </p>
                </div>
              ) : (
                <Accordion type="multiple" className="space-y-2">
                  {modules.map((module) => (
                    <AccordionItem 
                      key={module.id} 
                      value={module.id}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <div className="text-left">
                            <p className="font-medium">{module.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {module.contents.length} conteúdo{module.contents.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          {!module.is_active && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          {/* Module Actions */}
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingModule({ 
                                id: module.id, 
                                title: module.title, 
                                description: module.description || "" 
                              })}
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleOpenAddContent(module.id)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Conteúdo
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteModule(module.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          </div>

                          <Separator />

                          {/* Contents List */}
                          {module.contents.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">
                              Nenhum conteúdo neste módulo
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {module.contents.map((content) => (
                                <div
                                  key={content.id}
                                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                    <div className="p-1.5 rounded bg-background">
                                      {contentTypeIcons[content.content_type]}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{content.title}</p>
                                      <p className="text-xs text-muted-foreground capitalize">
                                        {content.content_type}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={() => setEditingContent(content)}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteContent(content.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>

          {/* Add Content Dialog */}
          <Dialog open={isAddContentOpen} onOpenChange={setIsAddContentOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Conteúdo</DialogTitle>
                <DialogDescription>
                  Adicione um novo conteúdo ao módulo
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tipo de Conteúdo</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    placeholder="Ex: Aula 1 - Boas vindas"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    placeholder="Descreva o conteúdo..."
                    value={contentDescription}
                    onChange={(e) => setContentDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {contentType === "video" && "URL do Vídeo (YouTube, Vimeo, etc)"}
                    {contentType === "pdf" && "URL do PDF"}
                    {contentType === "link" && "URL do Link"}
                    {contentType === "download" && "URL do Arquivo"}
                    {contentType === "text" && "Conteúdo (opcional)"}
                  </Label>
                  {contentType !== "text" ? (
                    <Input
                      placeholder="https://..."
                      value={contentUrl}
                      onChange={(e) => setContentUrl(e.target.value)}
                    />
                  ) : (
                    <Textarea
                      placeholder="Conteúdo em texto ou HTML..."
                      value={contentUrl}
                      onChange={(e) => setContentUrl(e.target.value)}
                      rows={4}
                    />
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddContentOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddContent} disabled={!contentTitle.trim() || isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Module Dialog */}
          <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Módulo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={editingModule?.title || ""}
                    onChange={(e) => setEditingModule(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={editingModule?.description || ""}
                    onChange={(e) => setEditingModule(prev => prev ? { ...prev, description: e.target.value } : null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingModule(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateModule} disabled={isSaving}>
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Content Dialog */}
          <Dialog open={!!editingContent} onOpenChange={(open) => !open && setEditingContent(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Conteúdo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={editingContent?.content_type || "video"} 
                    onValueChange={(value) => setEditingContent((prev: any) => prev ? { ...prev, content_type: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={editingContent?.title || ""}
                    onChange={(e) => setEditingContent((prev: any) => prev ? { ...prev, title: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={editingContent?.description || ""}
                    onChange={(e) => setEditingContent((prev: any) => prev ? { ...prev, description: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={editingContent?.content_url || ""}
                    onChange={(e) => setEditingContent((prev: any) => prev ? { ...prev, content_url: e.target.value } : null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingContent(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateContent} disabled={isSaving}>
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}