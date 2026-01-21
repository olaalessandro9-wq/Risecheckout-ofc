/**
 * Rastreamento - Página unificada de Pixels + UTMify
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Módulo de Rastreamento
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PixelsProvider, PixelLibrary } from "@/modules/pixels";
import { UTMifyConfig } from "@/components/integrations/UTMifyConfig";
import { BarChart3, TrendingUp } from "lucide-react";

const Rastreamento = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1 text-foreground">
          Trackeamento
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seus pixels e integrações de trackeamento de conversões
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pixels" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pixels" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Pixels
          </TabsTrigger>
          <TabsTrigger value="utmify" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            UTMify
          </TabsTrigger>
        </TabsList>

        {/* Tab Pixels */}
        <TabsContent value="pixels" className="mt-6">
          <PixelsProvider>
            <PixelLibrary />
          </PixelsProvider>
        </TabsContent>

        {/* Tab UTMify */}
        <TabsContent value="utmify" className="mt-6">
          <UTMifyConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Rastreamento;
