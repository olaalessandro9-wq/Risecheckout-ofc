/**
 * ProductSettingsPanelV2 - Painel de Configurações do Produto
 * 
 * Versão refatorada seguindo Rise Architect Protocol:
 * - < 300 linhas (orquestrador apenas)
 * - Lógica extraída para hook useProductSettings
 * - Sub-componentes em arquivos separados
 * - Type-safe e fácil manutenção
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  useProductSettings,
  RequiredFieldsSection,
  PaymentMethodSection,
  GatewaySection,
  PixelsSection,
} from "./settings";

interface Props {
  productId: string;
  onModifiedChange?: (modified: boolean) => void;
}

export default function ProductSettingsPanelV2({ productId, onModifiedChange }: Props) {
  const {
    loading,
    saving,
    credentials,
    form,
    setForm,
    handleSave,
  } = useProductSettings(productId, onModifiedChange);

  if (loading) {
    return (
      <Card className="border-muted">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-muted">
      <CardHeader>
        <CardTitle>Configurações do produto</CardTitle>
        <CardDescription>
          As alterações afetam o checkout público <strong>após salvar</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <RequiredFieldsSection form={form} setForm={setForm} />
        <PaymentMethodSection form={form} setForm={setForm} />
        <GatewaySection form={form} setForm={setForm} credentials={credentials} />

        <Separator />

        {/* Seção de Pixels */}
        <PixelsSection productId={productId} />

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
