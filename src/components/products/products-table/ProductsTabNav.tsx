/**
 * ProductsTabNav - Tab navigation for products sections
 */

import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ProductsTabNav() {
  return (
    <TabsList className="bg-transparent h-auto p-0 gap-1 justify-start border-b border-border w-full rounded-none pb-0">
      <TabsTrigger 
        value="meus-produtos"
        className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm font-medium"
      >
        Meus Produtos
      </TabsTrigger>
      <TabsTrigger 
        value="minhas-coproducoes"
        className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm font-medium"
      >
        Minhas Co-Produções
      </TabsTrigger>
      <TabsTrigger 
        value="minhas-afiliacoes"
        className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm font-medium"
      >
        Minhas Afiliações
      </TabsTrigger>
    </TabsList>
  );
}
