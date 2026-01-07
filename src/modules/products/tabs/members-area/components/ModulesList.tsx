/**
 * ModulesList - Lista de módulos com accordion
 * Uses unified content type system
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, Edit2, GripVertical, Lock, Layers, Video, FileText } from "lucide-react";
import type { MemberModuleWithContents } from "@/hooks/members-area";

interface ModulesListProps {
  modules: MemberModuleWithContents[];
  onAddModule: () => void;
  onEditModule: (module: { id: string; title: string; cover_image_url: string | null }) => void;
  onDeleteModule: (id: string) => void;
  onAddContent: (moduleId: string) => void;
  onEditContent: (content: { id: string; title: string; content_type: string; content_url: string | null; description: string | null }) => void;
  onDeleteContent: (id: string) => void;
}

/** Get icon for content type */
function getContentIcon(type: string) {
  switch (type) {
    case 'video':
      return <Video className="h-4 w-4" />;
    case 'text':
      return <FileText className="h-4 w-4" />;
    case 'mixed':
    default:
      return <Layers className="h-4 w-4" />;
  }
}

/** Get label for content type */
function getContentLabel(type: string): string {
  switch (type) {
    case 'video':
      return 'Vídeo';
    case 'text':
      return 'Texto';
    case 'mixed':
    default:
      return 'Conteúdo';
  }
}

export function ModulesList({
  modules,
  onAddModule,
  onEditModule,
  onDeleteModule,
  onAddContent,
  onEditContent,
  onDeleteContent,
}: ModulesListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Módulos</CardTitle>
            <CardDescription>
              Organize seu conteúdo em módulos
            </CardDescription>
          </div>
          <Button size="sm" onClick={onAddModule}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo
          </Button>
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
                        onClick={() => onEditModule({ 
                          id: module.id, 
                          title: module.title, 
                          cover_image_url: module.cover_image_url || null,
                        })}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onAddContent(module.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Conteúdo
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDeleteModule(module.id)}
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
                                {getContentIcon(content.content_type)}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{content.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {getContentLabel(content.content_type)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => onEditContent({
                                  id: content.id,
                                  title: content.title,
                                  content_type: content.content_type,
                                  content_url: content.content_url,
                                  description: content.description,
                                })}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => onDeleteContent(content.id)}
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
  );
}
