import { ColorPicker } from "./ColorPicker";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { THEME_PRESETS, FONT_OPTIONS } from "@/lib/checkout/themePresets";
import { Label } from "@/components/ui/label";
import type { CheckoutCustomization, CheckoutDesign } from "@/types/checkoutEditor";

interface CheckoutColorSettingsProps {
  customization: CheckoutCustomization;
  onUpdate: (field: string, value: CheckoutDesign | string) => void;
}

export const CheckoutColorSettings = ({ customization, onUpdate }: CheckoutColorSettingsProps) => {
  const handleThemeChange = (themeName: 'light' | 'dark' | 'custom') => {
    if (themeName === 'custom') {
      // Apenas muda o theme para custom, mantém as cores atuais
      onUpdate('design.theme', themeName);
    } else {
      // Aplica TODAS as cores do preset
      const preset = THEME_PRESETS[themeName];
      onUpdate('design', {
        ...customization.design,
        theme: themeName,
        colors: preset.colors,
      } as CheckoutDesign);
    }
  };

  const handleFontChange = (font: string) => {
    onUpdate('design.font', font);
  };

  return (
    <div className="space-y-6 p-4 w-full max-w-full overflow-x-hidden">
      {/* 1. Tema e Fonte */}
      <div className="space-y-4 max-w-full overflow-x-hidden">
        <h3 className="text-lg font-semibold">Tema e Fonte</h3>
        
        {/* SELETOR DE TEMA */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tema</Label>
          <Select
            value={customization.design?.theme || 'custom'}
            onValueChange={handleThemeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro (Light)</SelectItem>
              <SelectItem value="dark">Escuro (Dark)</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground break-words">
            {customization.design?.theme === 'light' && 'Tema claro padrão aplicado'}
            {customization.design?.theme === 'dark' && 'Tema escuro padrão aplicado'}
            {(!customization.design?.theme || customization.design?.theme === 'custom') && 'Tema personalizado - você pode editar todas as cores abaixo'}
          </p>
        </div>
        
        {/* SELETOR DE FONTE */}
        <div className="space-y-2 relative">
          <Label className="text-sm font-medium">Fonte</Label>
          <Select
            value={customization.design?.font || 'Inter'}
            onValueChange={handleFontChange}
          >
            <SelectTrigger className="will-change-auto">
              <SelectValue placeholder="Selecione a fonte" />
            </SelectTrigger>
            <SelectContent className="will-change-transform">
              {FONT_OPTIONS.map(font => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground break-words">
            Escolha a fonte principal do checkout
          </p>
        </div>
      </div>

      <Separator />

      {/* 2. Cores Gerais */}
      <div className="space-y-4 max-w-full overflow-x-hidden">
        <h3 className="text-lg font-semibold">Cores Gerais</h3>
        <ColorPicker
          label="Cor de Fundo Principal"
          value={customization.design?.colors?.background || '#FFFFFF'}
          onChange={(value) => onUpdate('design.colors.background', value)}
          description="Fundo geral do checkout"
        />
        <ColorPicker
          label="Cor do Texto Principal"
          value={customization.design?.colors?.primaryText || '#000000'}
          onChange={(value) => onUpdate('design.colors.primaryText', value)}
          description="Títulos e textos principais"
        />
        <ColorPicker
          label="Cor do Texto Secundário"
          value={customization.design?.colors?.secondaryText || '#6B7280'}
          onChange={(value) => onUpdate('design.colors.secondaryText', value)}
          description="Descrições e subtítulos"
        />
        <ColorPicker
          label="Cor de Fundo do Formulário"
          value={customization.design?.colors?.formBackground || '#F9FAFB'}
          onChange={(value) => onUpdate('design.colors.formBackground', value)}
          description="Fundo das seções de formulário"
        />
        <ColorPicker
          label="Cor do Preço do Produto"
          value={customization.design?.colors?.productPrice || '#10B981'}
          onChange={(value) => onUpdate('design.colors.productPrice', value)}
          description="Cor do preço exibido no topo (R$ XX,XX à vista)"
        />
      </div>

      <Separator />

      {/* 3. Campos de Formulário (Nome, Email, CPF, Telefone) */}
      <div className="space-y-4 max-w-full overflow-x-hidden">
        <h3 className="text-lg font-semibold">Campos de Formulário</h3>
        <p className="text-sm text-muted-foreground leading-relaxed break-words">
          Personalize a aparência dos campos de dados pessoais (Nome, Email, CPF, Telefone)
        </p>
        <ColorPicker
          label="Cor do Texto"
          value={customization.design?.colors?.personalDataFields?.textColor || '#000000'}
          onChange={(value) => onUpdate('design.colors.personalDataFields.textColor', value)}
          description="Cor do texto digitado nos campos"
        />
        <ColorPicker
          label="Cor do Placeholder"
          value={customization.design?.colors?.personalDataFields?.placeholderColor || '#9CA3AF'}
          onChange={(value) => onUpdate('design.colors.personalDataFields.placeholderColor', value)}
          description="Cor do texto de exemplo (placeholder)"
        />
        <ColorPicker
          label="Cor da Borda"
          value={customization.design?.colors?.personalDataFields?.borderColor || '#D1D5DB'}
          onChange={(value) => onUpdate('design.colors.personalDataFields.borderColor', value)}
          description="Cor da borda dos campos"
        />
        <ColorPicker
          label="Cor de Fundo"
          value={customization.design?.colors?.personalDataFields?.backgroundColor || '#FFFFFF'}
          onChange={(value) => onUpdate('design.colors.personalDataFields.backgroundColor', value)}
          description="Cor de fundo dos campos"
        />
      </div>

      <Separator />

      {/* 4. Order Bumps */}
      <div className="space-y-4 max-w-full overflow-x-hidden">
        <h3 className="text-lg font-semibold">Order Bumps</h3>
        <p className="text-sm text-muted-foreground leading-relaxed break-words">
          Cores dos blocos de ofertas limitadas
        </p>
        <ColorPicker
          label="Cor do Bloco Superior"
          value={customization.design?.colors?.orderBump?.headerBackground || 'rgba(255,255,255,0.15)'}
          onChange={(value) => onUpdate('design.colors.orderBump.headerBackground', value)}
          description="Fundo do cabeçalho (call to action)"
        />
        <ColorPicker
          label="Cor do Texto do Bloco Superior"
          value={customization.design?.colors?.orderBump?.headerText || '#10B981'}
          onChange={(value) => onUpdate('design.colors.orderBump.headerText', value)}
          description="Texto do call to action"
        />
        <ColorPicker
          label="Cor do Bloco Inferior"
          value={customization.design?.colors?.orderBump?.footerBackground || 'rgba(255,255,255,0.15)'}
          onChange={(value) => onUpdate('design.colors.orderBump.footerBackground', value)}
          description="Fundo do rodapé (adicionar produto)"
        />
        <ColorPicker
          label="Cor do Texto do Bloco Inferior"
          value={customization.design?.colors?.orderBump?.footerText || '#000000'}
          onChange={(value) => onUpdate('design.colors.orderBump.footerText', value)}
          description="Texto 'Adicionar Produto'"
        />
        <ColorPicker
          label="Cor do Fundo do Meio"
          value={customization.design?.colors?.orderBump?.contentBackground || '#F9FAFB'}
          onChange={(value) => onUpdate('design.colors.orderBump.contentBackground', value)}
          description="Fundo do conteúdo principal"
        />
        <ColorPicker
          label="Cor do Título"
          value={customization.design?.colors?.orderBump?.titleText || '#000000'}
          onChange={(value) => onUpdate('design.colors.orderBump.titleText', value)}
          description="Nome do produto"
        />
        <ColorPicker
          label="Cor da Descrição"
          value={customization.design?.colors?.orderBump?.descriptionText || '#6B7280'}
          onChange={(value) => onUpdate('design.colors.orderBump.descriptionText', value)}
          description="Texto descritivo"
        />
        <ColorPicker
          label="Cor do Preço"
          value={customization.design?.colors?.orderBump?.priceText || '#10B981'}
          onChange={(value) => onUpdate('design.colors.orderBump.priceText', value)}
          description="Valor do produto"
        />
      </div>

      <Separator />

      {/* 5. Botões de Seleção (PIX, Cartão) */}
      <div className="space-y-4 max-w-full overflow-x-hidden">
        <h3 className="text-lg font-semibold">Botões de Seleção (PIX, Cartão)</h3>
        <h4 className="text-md font-semibold">Não Selecionado</h4>
        <ColorPicker
          label="Cor do Texto"
          value={customization.design?.colors?.unselectedButton?.text || '#000000'}
          onChange={(value) => onUpdate('design.colors.unselectedButton.text', value)}
        />
        <ColorPicker
          label="Cor de Fundo"
          value={customization.design?.colors?.unselectedButton?.background || '#FFFFFF'}
          onChange={(value) => onUpdate('design.colors.unselectedButton.background', value)}
        />
        <ColorPicker
          label="Cor do Ícone"
          value={customization.design?.colors?.unselectedButton?.icon || '#000000'}
          onChange={(value) => onUpdate('design.colors.unselectedButton.icon', value)}
        />
        <h4 className="text-md font-semibold">Selecionado</h4>
        <ColorPicker
          label="Cor do Texto"
          value={customization.design?.colors?.selectedButton?.text || '#FFFFFF'}
          onChange={(value) => onUpdate('design.colors.selectedButton.text', value)}
        />
        <ColorPicker
          label="Cor de Fundo"
          value={customization.design?.colors?.selectedButton?.background || '#10B981'}
          onChange={(value) => onUpdate('design.colors.selectedButton.background', value)}
          description="Padrão verde"
        />
        <ColorPicker
          label="Cor do Ícone"
          value={customization.design?.colors?.selectedButton?.icon || '#FFFFFF'}
          onChange={(value) => onUpdate('design.colors.selectedButton.icon', value)}
        />
      </div>

      <Separator />

      {/* 6. Campos de Cartão de Crédito */}
      <div className="space-y-4 max-w-full overflow-x-hidden">
        <h3 className="text-lg font-semibold">Campos de Cartão de Crédito</h3>
        <p className="text-sm text-muted-foreground leading-relaxed break-words">
          Personalize a aparência dos campos de número do cartão, vencimento e CVV
        </p>
        <ColorPicker
          label="Cor do Texto"
          value={customization.design?.colors?.creditCardFields?.textColor || '#000000'}
          onChange={(value) => onUpdate('design.colors.creditCardFields.textColor', value)}
          description="Cor do texto digitado nos campos"
        />
        <ColorPicker
          label="Cor do Placeholder"
          value={customization.design?.colors?.creditCardFields?.placeholderColor || '#999999'}
          onChange={(value) => onUpdate('design.colors.creditCardFields.placeholderColor', value)}
          description="Cor do texto de exemplo (placeholder)"
        />
        <ColorPicker
          label="Cor da Borda"
          value={customization.design?.colors?.creditCardFields?.borderColor || '#cccccc'}
          onChange={(value) => onUpdate('design.colors.creditCardFields.borderColor', value)}
          description="Cor da borda dos campos"
        />
        <ColorPicker
          label="Cor de Fundo"
          value={customization.design?.colors?.creditCardFields?.backgroundColor || '#ffffff'}
          onChange={(value) => onUpdate('design.colors.creditCardFields.backgroundColor', value)}
          description="Cor de fundo dos campos"
        />
        <ColorPicker
          label="Cor da Borda (Foco)"
          value={customization.design?.colors?.creditCardFields?.focusBorderColor || '#0066ff'}
          onChange={(value) => onUpdate('design.colors.creditCardFields.focusBorderColor', value)}
          description="Cor da borda quando o campo está selecionado"
        />
        <ColorPicker
          label="Cor do Texto (Foco)"
          value={customization.design?.colors?.creditCardFields?.focusTextColor || '#000000'}
          onChange={(value) => onUpdate('design.colors.creditCardFields.focusTextColor', value)}
          description="Cor do texto quando o campo está selecionado"
        />
      </div>

      <Separator />

      {/* 7. Resumo do Pedido */}
      <div className="space-y-4 max-w-full overflow-x-hidden">
        <h3 className="text-lg font-semibold">Resumo do Pedido</h3>
        <ColorPicker
          label="Cor de Fundo"
          value={customization.design?.colors?.orderSummary?.background || '#F9FAFB'}
          onChange={(value) => onUpdate('design.colors.orderSummary.background', value)}
          description="Fundo do bloco 'Resumo do pedido'"
        />
        <ColorPicker
          label="Título"
          value={customization.design?.colors?.orderSummary?.titleText || '#000000'}
          onChange={(value) => onUpdate('design.colors.orderSummary.titleText', value)}
          description="Texto 'Resumo do pedido'"
        />
        <ColorPicker
          label="Nome do Produto"
          value={customization.design?.colors?.orderSummary?.productName || '#000000'}
          onChange={(value) => onUpdate('design.colors.orderSummary.productName', value)}
        />
        <ColorPicker
          label="Preços"
          value={customization.design?.colors?.orderSummary?.priceText || '#000000'}
          onChange={(value) => onUpdate('design.colors.orderSummary.priceText', value)}
          description="Valores em destaque"
        />
        <ColorPicker
          label="Labels (Produto, Taxa, Total)"
          value={customization.design?.colors?.orderSummary?.labelText || '#6B7280'}
          onChange={(value) => onUpdate('design.colors.orderSummary.labelText', value)}
        />
        <ColorPicker
          label="Cor das Bordas"
          value={customization.design?.colors?.orderSummary?.borderColor || '#D1D5DB'}
          onChange={(value) => onUpdate('design.colors.orderSummary.borderColor', value)}
        />
      </div>

      <Separator />

      {/* 8. Botão Principal de Pagamento */}
      <div className="space-y-4 max-w-full overflow-x-hidden">
        <h3 className="text-lg font-semibold">Botão Principal de Pagamento</h3>
        <ColorPicker
          label="Cor do Texto"
          value={customization.design?.colors?.button?.text || '#FFFFFF'}
          onChange={(value) => onUpdate('design.colors.button.text', value)}
        />
        <ColorPicker
          label="Cor de Fundo"
          value={customization.design?.colors?.button?.background || '#10B981'}
          onChange={(value) => onUpdate('design.colors.button.background', value)}
          description="Padrão verde"
        />
      </div>



    </div>
  );
};
