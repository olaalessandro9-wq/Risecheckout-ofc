/**
 * UTMifyForm - Main form component
 * 
 * Pure presentation component consuming context state.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Presentation Layer
 */

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUTMifyContext } from "../context";
import { TokenInput } from "./TokenInput";
import { ProductSelector } from "./ProductSelector";
import { EventSelector } from "./EventSelector";

export function UTMifyForm() {
  const { 
    isLoading, 
    isError,
    isSaving,
    error,
    active, 
    toggleActive,
    save,
    refresh,
  } = useUTMifyContext();

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>UTMify</CardTitle>
          <CardDescription>
            Trackeamento de conversões com parâmetros UTM
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>UTMify</CardTitle>
          <CardDescription>
            Trackeamento de conversões com parâmetros UTM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              {error || "Erro ao carregar configuração"}
            </AlertDescription>
          </Alert>
          <Button onClick={refresh} variant="outline" className="w-full">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle>UTMify</CardTitle>
              <CardDescription>
                Trackeamento de conversões com parâmetros UTM
              </CardDescription>
            </div>
            <Badge 
              variant={active ? "default" : "secondary"}
              className={active ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              {active ? "ATIVO" : "INATIVO"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="utmify-active">Ativo</Label>
            <Switch
              id="utmify-active"
              checked={active}
              onCheckedChange={toggleActive}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <TokenInput />
        <ProductSelector />
        <EventSelector />

        <Button 
          onClick={save} 
          disabled={isSaving} 
          className="w-full"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configuração
        </Button>
      </CardContent>
    </Card>
  );
}
