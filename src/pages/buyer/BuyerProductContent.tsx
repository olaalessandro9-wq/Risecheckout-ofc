import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useBuyerAuth } from "@/hooks/useBuyerAuth";
import { useBuyerOrders } from "@/hooks/useBuyerOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import DOMPurify from "dompurify";
import { 
  Loader2, 
  ArrowLeft, 
  Play, 
  FileText, 
  Link as LinkIcon, 
  Download, 
  Layers,
  ChevronRight,
  Paperclip
} from "lucide-react";

/** Unified content type */
type ContentDisplayType = "mixed" | "video" | "text" | "pdf" | "link" | "download";

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  content_type: ContentDisplayType;
  content_url: string | null;
  body: string | null;
  content_data: Record<string, unknown>;
  position: number;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  position: number;
  contents: ContentItem[];
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  settings: Record<string, unknown>;
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  mixed: <Layers className="h-4 w-4" />,
  video: <Play className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  link: <LinkIcon className="h-4 w-4" />,
  download: <Download className="h-4 w-4" />,
};

const contentTypeLabels: Record<string, string> = {
  mixed: "Conteúdo",
  video: "Vídeo",
  text: "Texto",
  pdf: "PDF",
  link: "Link",
  download: "Download",
};

export default function BuyerProductContent() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { isLoading: authLoading, isAuthenticated } = useBuyerAuth();
  const { fetchProductContent } = useBuyerOrders();

  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/minha-conta");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch content on mount
  useEffect(() => {
    const loadContent = async () => {
      if (!productId || !isAuthenticated) return;

      setIsLoading(true);
      try {
        const data = await fetchProductContent(productId);
        if (data) {
          setProduct(data.product);
          setModules(data.modules as Module[]);
          // Auto-select first content if available
          if (data.modules[0]?.contents[0]) {
            setSelectedContent(data.modules[0].contents[0] as ContentItem);
          }
        } else {
          setError("Não foi possível carregar o conteúdo.");
        }
      } catch {
        setError("Erro ao carregar conteúdo.");
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [productId, isAuthenticated, fetchProductContent]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Link to="/minha-conta/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContentViewer = () => {
    if (!selectedContent) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Selecione um conteúdo para visualizar</p>
        </div>
      );
    }

    const contentType = selectedContent.content_type;

    // Mixed content (Kiwify-style): video + body + attachments
    if (contentType === "mixed") {
      return (
        <div className="space-y-6">
          {/* Video section */}
          {selectedContent.content_url && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={selectedContent.content_url}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}

          {/* Title & Description */}
          <div>
            <h3 className="text-lg font-semibold">{selectedContent.title}</h3>
            {selectedContent.description && (
              <p className="text-muted-foreground mt-2">{selectedContent.description}</p>
            )}
          </div>

          {/* Rich text body */}
          {selectedContent.body && (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(selectedContent.body),
              }}
            />
          )}

          {/* Attachments placeholder */}
          {selectedContent.content_data?.attachments && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4" />
                Materiais
              </h4>
              <p className="text-sm text-muted-foreground">
                Anexos disponíveis para download
              </p>
            </div>
          )}
        </div>
      );
    }

    // Video only
    if (contentType === "video") {
      return (
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {selectedContent.content_url ? (
              <iframe
                src={selectedContent.content_url}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <p>Vídeo não disponível</p>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{selectedContent.title}</h3>
            {selectedContent.description && (
              <p className="text-muted-foreground mt-2">{selectedContent.description}</p>
            )}
          </div>
        </div>
      );
    }

    // Text/HTML
    if (contentType === "text") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{selectedContent.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  selectedContent.body || 
                  (selectedContent.content_data?.html as string) || 
                  selectedContent.description || 
                  ""
                ),
              }}
            />
          </CardContent>
        </Card>
      );
    }

    // PDF
    if (contentType === "pdf") {
      return (
        <div className="space-y-4">
          {selectedContent.content_url && (
            <iframe
              src={selectedContent.content_url}
              className="w-full h-[70vh] rounded-lg border"
            />
          )}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{selectedContent.title}</h3>
              {selectedContent.description && (
                <p className="text-muted-foreground mt-1">{selectedContent.description}</p>
              )}
            </div>
            {selectedContent.content_url && (
              <a href={selectedContent.content_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
              </a>
            )}
          </div>
        </div>
      );
    }

    // Link
    if (contentType === "link") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{selectedContent.title}</CardTitle>
            {selectedContent.description && (
              <CardDescription>{selectedContent.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedContent.content_url && (
              <a
                href={selectedContent.content_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <LinkIcon className="h-4 w-4" />
                Acessar Link
                <ChevronRight className="h-4 w-4" />
              </a>
            )}
          </CardContent>
        </Card>
      );
    }

    // Download
    if (contentType === "download") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{selectedContent.title}</CardTitle>
            {selectedContent.description && (
              <CardDescription>{selectedContent.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedContent.content_url && (
              <a href={selectedContent.content_url} download>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Arquivo
                </Button>
              </a>
            )}
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/minha-conta/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {product?.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="font-semibold">{product?.name}</h1>
              <p className="text-sm text-muted-foreground">
                {modules.length} módulo{modules.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-65px)]">
        {/* Sidebar - Module List */}
        <aside className="w-80 border-r border-border/50 bg-card/30 overflow-y-auto hidden lg:block">
          <div className="p-4">
            <Accordion type="multiple" defaultValue={modules.map((m) => m.id)}>
              {modules.map((module) => (
                <AccordionItem key={module.id} value={module.id}>
                  <AccordionTrigger className="text-sm font-medium">
                    {module.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1">
                      {module.contents.map((content) => (
                        <button
                          key={content.id}
                          onClick={() => setSelectedContent(content)}
                          className={`w-full flex items-center gap-2 p-2 rounded-md text-left text-sm transition-colors ${
                            selectedContent?.id === content.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          {contentTypeIcons[content.content_type] || contentTypeIcons.mixed}
                          <span className="truncate flex-1">{content.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {contentTypeLabels[content.content_type] || "Conteúdo"}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {renderContentViewer()}
        </main>
      </div>

      {/* Mobile Module List */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <Accordion type="single" collapsible>
          <AccordionItem value="modules">
            <AccordionTrigger className="text-sm font-medium">
              Módulos e Conteúdos
            </AccordionTrigger>
            <AccordionContent className="max-h-60 overflow-y-auto">
              {modules.map((module) => (
                <div key={module.id} className="mb-4">
                  <p className="font-medium text-sm mb-2">{module.title}</p>
                  <div className="space-y-1">
                    {module.contents.map((content) => (
                      <button
                        key={content.id}
                        onClick={() => setSelectedContent(content)}
                        className={`w-full flex items-center gap-2 p-2 rounded-md text-left text-sm transition-colors ${
                          selectedContent?.id === content.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        {contentTypeIcons[content.content_type] || contentTypeIcons.mixed}
                        <span className="truncate">{content.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
