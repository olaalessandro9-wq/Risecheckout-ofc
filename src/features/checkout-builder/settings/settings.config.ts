/**
 * Settings Configuration
 * Single Source of Truth para todas as configurações de design do checkout
 * 
 * ORDEM: Segue o fluxo visual do checkout (de cima para baixo)
 * - Primeiras 2 categorias são FIXAS (Tema/Fonte e Cores Gerais)
 * - Demais categorias seguem a ordem de aparição no checkout
 */

export interface SettingCategory {
  id: string;
  title: string;
  description?: string;
  fields: SettingField[];
}

export interface SettingField {
  id: string;
  type: 'color' | 'select' | 'number' | 'text' | 'toggle';
  label: string;
  description?: string;
  path: string; // dot notation path, e.g., 'design.colors.background'
  defaultValue: any;
  options?: Array<{ value: string; label: string }>; // para type='select'
  min?: number; // para type='number'
  max?: number; // para type='number'
}

/**
 * Todas as categorias de configurações disponíveis
 * 
 * ORDEM REORGANIZADA (03/12/2025):
 * 1-2: Fixas (sempre no topo)
 * 3+: Seguem ordem visual do checkout (top-to-bottom)
 */
export const SETTINGS_CATEGORIES: SettingCategory[] = [
  // ============================================
  // CATEGORIAS FIXAS (sempre primeiro e segundo)
  // ============================================
  {
    id: 'theme',
    title: 'Tema e Fonte',
    description: 'Personalize o tema e a tipografia do seu checkout',
    fields: [
      {
        id: 'theme',
        type: 'select',
        label: 'Tema',
        description: 'Escolha entre tema claro, escuro ou personalizado',
        path: 'design.theme',
        defaultValue: 'light',
        options: [
          { value: 'light', label: 'Claro (Light)' },
          { value: 'dark', label: 'Escuro (Dark)' },
          { value: 'custom', label: 'Personalizado' },
        ],
      },
      {
        id: 'font',
        type: 'select',
        label: 'Fonte',
        description: 'Escolha a fonte principal do checkout',
        path: 'design.font',
        defaultValue: 'Inter',
        options: [
          { value: 'Inter', label: 'Inter' },
          { value: 'Roboto', label: 'Roboto' },
          { value: 'Poppins', label: 'Poppins' },
          { value: 'Montserrat', label: 'Montserrat' },
          { value: 'Open Sans', label: 'Open Sans' },
        ],
      },
    ],
  },
  {
    id: 'general_colors',
    title: 'Cores Gerais',
    description: 'Cores principais do checkout',
    fields: [
      {
        id: 'background',
        type: 'color',
        label: 'Cor de Fundo Principal',
        description: 'Fundo geral do checkout',
        path: 'design.colors.background',
        defaultValue: '#FFFFFF',
      },
      {
        id: 'formBackground',
        type: 'color',
        label: 'Cor de Fundo dos Blocos',
        description: 'Fundo dos blocos do checkout (formulários, resumo, order bumps)',
        path: 'design.colors.formBackground',
        defaultValue: '#F9FAFB',
      },
      {
        id: 'primaryText',
        type: 'color',
        label: 'Cor do Texto Principal',
        description: 'Títulos e textos principais',
        path: 'design.colors.primaryText',
        defaultValue: '#000000',
      },
      {
        id: 'secondaryText',
        type: 'color',
        label: 'Cor do Texto Secundário',
        description: 'Descrições e subtítulos',
        path: 'design.colors.secondaryText',
        defaultValue: '#6B7280',
      },
      {
        id: 'productPrice',
        type: 'color',
        label: 'Cor do Preço do Produto',
        description: 'Cor do preço exibido no topo (R$ XX,XX à vista)',
        path: 'design.colors.productPrice',
        defaultValue: '#10B981',
      },
    ],
  },

  // ============================================
  // CATEGORIAS DINÂMICAS (seguem ordem do checkout)
  // ============================================

  // 3. Campos de Formulário (Nome, Email, CPF, Telefone)
  {
    id: 'form_fields',
    title: 'Campos de Formulário',
    description: 'Personalize a aparência dos campos de dados pessoais (Nome, Email, CPF, Telefone)',
    fields: [
      {
        id: 'personalDataFields.textColor',
        type: 'color',
        label: 'Cor do Texto',
        description: 'Cor do texto digitado nos campos',
        path: 'design.colors.personalDataFields.textColor',
        defaultValue: '#000000',
      },
      {
        id: 'personalDataFields.placeholderColor',
        type: 'color',
        label: 'Cor do Placeholder',
        description: 'Cor do texto de exemplo (placeholder)',
        path: 'design.colors.personalDataFields.placeholderColor',
        defaultValue: '#6B7280',
      },
      {
        id: 'personalDataFields.borderColor',
        type: 'color',
        label: 'Cor da Borda',
        description: 'Cor da borda dos campos',
        path: 'design.colors.personalDataFields.borderColor',
        defaultValue: '#D1D5DB',
      },
      {
        id: 'personalDataFields.backgroundColor',
        type: 'color',
        label: 'Cor de Fundo',
        description: 'Cor de fundo dos campos',
        path: 'design.colors.personalDataFields.backgroundColor',
        defaultValue: '#FFFFFF',
      },
      {
        id: 'personalDataFields.focusBorderColor',
        type: 'color',
        label: 'Cor da Borda (Foco)',
        description: 'Cor da borda quando o campo está selecionado',
        path: 'design.colors.personalDataFields.focusBorderColor',
        defaultValue: '#10B981',
      },

    ],
  },

  // 5. Seção "Pagamento" (botões PIX/Cartão)
  {
    id: 'order_bump',
    title: 'Order Bumps',
    description: 'Cores dos blocos de ofertas limitadas',
    fields: [
      {
        id: 'orderBump.headerBackground',
        type: 'color',
        label: 'Cor do Bloco Superior',
        description: 'Fundo do cabeçalho (call to action)',
        path: 'design.colors.orderBump.headerBackground',
        defaultValue: 'rgba(255,255,255,0.15)',
      },
      {
        id: 'orderBump.headerText',
        type: 'color',
        label: 'Cor do Texto do Bloco Superior',
        description: 'Texto do call to action',
        path: 'design.colors.orderBump.headerText',
        defaultValue: '#10B981',
      },
      {
        id: 'orderBump.footerBackground',
        type: 'color',
        label: 'Cor do Bloco Inferior',
        description: 'Fundo do rodapé (adicionar produto)',
        path: 'design.colors.orderBump.footerBackground',
        defaultValue: 'rgba(255,255,255,0.15)',
      },
      {
        id: 'orderBump.footerText',
        type: 'color',
        label: 'Cor do Texto do Bloco Inferior',
        description: 'Texto "Adicionar Produto"',
        path: 'design.colors.orderBump.footerText',
        defaultValue: '#000000',
      },
      {
        id: 'orderBump.contentBackground',
        type: 'color',
        label: 'Cor do Fundo do Meio',
        description: 'Fundo do conteúdo principal',
        path: 'design.colors.orderBump.contentBackground',
        defaultValue: '#F9FAFB',
      },
      {
        id: 'orderBump.titleText',
        type: 'color',
        label: 'Cor do Título',
        description: 'Nome do produto',
        path: 'design.colors.orderBump.titleText',
        defaultValue: '#000000',
      },
      {
        id: 'orderBump.descriptionText',
        type: 'color',
        label: 'Cor da Descrição',
        description: 'Texto descritivo',
        path: 'design.colors.orderBump.descriptionText',
        defaultValue: '#6B7280',
      },
      {
        id: 'orderBump.priceText',
        type: 'color',
        label: 'Cor do Preço',
        description: 'Valor do produto',
        path: 'design.colors.orderBump.priceText',
        defaultValue: '#10B981',
      },
      {
        id: 'orderBump.selectedHeaderBackground',
        type: 'color',
        label: 'Cor do Bloco Superior (Selecionado)',
        description: 'Fundo do cabeçalho quando selecionado',
        path: 'design.colors.orderBump.selectedHeaderBackground',
        defaultValue: '#10B981',
      },
      {
        id: 'orderBump.selectedHeaderText',
        type: 'color',
        label: 'Cor do Texto do Bloco Superior (Selecionado)',
        description: 'Texto do call to action quando selecionado',
        path: 'design.colors.orderBump.selectedHeaderText',
        defaultValue: '#FFFFFF',
      },
      {
        id: 'orderBump.selectedFooterBackground',
        type: 'color',
        label: 'Cor do Bloco Inferior (Selecionado)',
        description: 'Fundo do rodapé quando selecionado',
        path: 'design.colors.orderBump.selectedFooterBackground',
        defaultValue: '#10B981',
      },
      {
        id: 'orderBump.selectedFooterText',
        type: 'color',
        label: 'Cor do Texto do Bloco Inferior (Selecionado)',
        description: 'Texto "Adicionar Produto" quando selecionado',
        path: 'design.colors.orderBump.selectedFooterText',
        defaultValue: '#FFFFFF',
      },
    ],
  },

  // 7. Resumo do Pedido (coluna direita/sticky)
  {
    id: 'payment_buttons',
    title: 'Botões de Seleção (PIX, Cartão)',
    description: 'Cores dos botões de método de pagamento',
    fields: [
      {
        id: 'unselectedButton.text',
        type: 'color',
        label: 'Cor do Texto (Não Selecionado)',
        description: 'Texto do botão não selecionado',
        path: 'design.colors.unselectedButton.text',
        defaultValue: '#000000',
      },
      {
        id: 'unselectedButton.background',
        type: 'color',
        label: 'Cor de Fundo (Não Selecionado)',
        description: 'Fundo do botão não selecionado',
        path: 'design.colors.unselectedButton.background',
        defaultValue: '#FFFFFF',
      },
      {
        id: 'unselectedButton.icon',
        type: 'color',
        label: 'Cor do Ícone (Não Selecionado)',
        description: 'Ícone do botão não selecionado',
        path: 'design.colors.unselectedButton.icon',
        defaultValue: '#000000',
      },
      {
        id: 'selectedButton.text',
        type: 'color',
        label: 'Cor do Texto (Selecionado)',
        description: 'Texto do botão selecionado',
        path: 'design.colors.selectedButton.text',
        defaultValue: '#FFFFFF',
      },
      {
        id: 'selectedButton.background',
        type: 'color',
        label: 'Cor de Fundo (Selecionado)',
        description: 'Fundo do botão selecionado (padrão verde)',
        path: 'design.colors.selectedButton.background',
        defaultValue: '#10B981',
      },
      {
        id: 'selectedButton.icon',
        type: 'color',
        label: 'Cor do Ícone (Selecionado)',
        description: 'Ícone do botão selecionado',
        path: 'design.colors.selectedButton.icon',
        defaultValue: '#FFFFFF',
      },
    ],
  },

  // 6. Campos de Cartão de Crédito (quando cartão é selecionado)
  {
    id: 'credit_card_fields',
    title: 'Campos de Cartão de Crédito',
    description: 'Personalize a aparência dos campos de cartão',
    fields: [
      {
        id: 'creditCardFields.textColor',
        type: 'color',
        label: 'Cor do Texto',
        description: 'Cor do texto digitado nos campos',
        path: 'design.colors.creditCardFields.textColor',
        defaultValue: '#000000',
      },
      {
        id: 'creditCardFields.placeholderColor',
        type: 'color',
        label: 'Cor do Placeholder',
        description: 'Cor do texto de exemplo (placeholder)',
        path: 'design.colors.creditCardFields.placeholderColor',
        defaultValue: '#999999',
      },
      {
        id: 'creditCardFields.borderColor',
        type: 'color',
        label: 'Cor da Borda',
        description: 'Cor da borda dos campos',
        path: 'design.colors.creditCardFields.borderColor',
        defaultValue: '#cccccc',
      },
      {
        id: 'creditCardFields.backgroundColor',
        type: 'color',
        label: 'Cor de Fundo',
        description: 'Cor de fundo dos campos',
        path: 'design.colors.creditCardFields.backgroundColor',
        defaultValue: '#ffffff',
      },
      {
        id: 'creditCardFields.focusBorderColor',
        type: 'color',
        label: 'Cor da Borda (Foco)',
        description: 'Cor da borda quando o campo está selecionado',
        path: 'design.colors.creditCardFields.focusBorderColor',
        defaultValue: '#0066ff',
      },
      {
        id: 'creditCardFields.focusTextColor',
        type: 'color',
        label: 'Cor do Texto (Foco)',
        description: 'Cor do texto quando o campo está selecionado',
        path: 'design.colors.creditCardFields.focusTextColor',
        defaultValue: '#000000',
      },
    ],
  },

  // 8. Botão Principal "Finalizar Compra"
  {
    id: 'order_summary',
    title: 'Resumo do Pedido',
    description: 'Cores do bloco de resumo do pedido',
    fields: [
      {
        id: 'orderSummary.background',
        type: 'color',
        label: 'Cor de Fundo',
        description: 'Fundo do bloco "Resumo do pedido"',
        path: 'design.colors.orderSummary.background',
        defaultValue: '#F9FAFB',
      },
      {
        id: 'orderSummary.titleText',
        type: 'color',
        label: 'Título',
        description: 'Texto "Resumo do pedido"',
        path: 'design.colors.orderSummary.titleText',
        defaultValue: '#000000',
      },
      {
        id: 'orderSummary.productName',
        type: 'color',
        label: 'Nome do Produto',
        description: 'Nome do produto no resumo',
        path: 'design.colors.orderSummary.productName',
        defaultValue: '#000000',
      },
      {
        id: 'orderSummary.priceText',
        type: 'color',
        label: 'Preços',
        description: 'Valores em destaque',
        path: 'design.colors.orderSummary.priceText',
        defaultValue: '#000000',
      },
      {
        id: 'orderSummary.labelText',
        type: 'color',
        label: 'Labels (Produto, Taxa, Total)',
        description: 'Labels dos campos',
        path: 'design.colors.orderSummary.labelText',
        defaultValue: '#6B7280',
      },
      {
        id: 'orderSummary.borderColor',
        type: 'color',
        label: 'Cor das Bordas',
        description: 'Bordas do resumo',
        path: 'design.colors.orderSummary.borderColor',
        defaultValue: '#D1D5DB',
      },
    ],
  },
  {
    id: 'primary_button',
    title: 'Botão Principal de Pagamento',
    description: 'Cores do botão de finalizar compra',
    fields: [
      {
        id: 'button.text',
        type: 'color',
        label: 'Cor do Texto',
        description: 'Texto do botão principal',
        path: 'design.colors.button.text',
        defaultValue: '#FFFFFF',
      },
      {
        id: 'button.background',
        type: 'color',
        label: 'Cor de Fundo',
        description: 'Fundo do botão principal (padrão verde)',
        path: 'design.colors.button.background',
        defaultValue: '#10B981',
      },
    ],
  },

  // 4. Order Bumps (ofertas limitadas)
];

/**
 * Helper: Buscar categoria por ID
 */
export const getCategoryById = (categoryId: string): SettingCategory | undefined => {
  return SETTINGS_CATEGORIES.find((cat) => cat.id === categoryId);
};

/**
 * Helper: Buscar field por path
 */
export const getFieldByPath = (path: string): SettingField | undefined => {
  for (const category of SETTINGS_CATEGORIES) {
    const field = category.fields.find((f) => f.path === path);
    if (field) return field;
  }
  return undefined;
};
