/**
 * Buyer Product Header Component
 */

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { ProductData, Module } from "./types";

interface BuyerProductHeaderProps {
  product: ProductData | null;
  modules: Module[];
}

export function BuyerProductHeader({ product, modules }: BuyerProductHeaderProps) {
  return (
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
  );
}
