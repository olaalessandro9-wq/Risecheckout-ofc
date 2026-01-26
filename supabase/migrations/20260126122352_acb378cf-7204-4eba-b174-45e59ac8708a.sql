-- ============================================================================
-- RISE V3 Migration: SSOT para design.colors
-- Fase 1: Popular design.colors completo para TODOS os checkouts
-- ============================================================================

-- ETAPA 1: Garantir que checkouts com theme='dark' tenham design.colors completo
UPDATE checkouts
SET design = jsonb_build_object(
  'theme', COALESCE((design::jsonb->>'theme'), 'dark'),
  'font', COALESCE((design::jsonb->>'font'), font, 'Inter'),
  'colors', jsonb_build_object(
    'background', COALESCE((design::jsonb->'colors'->>'background'), '#0A0A0A'),
    'primaryText', COALESCE((design::jsonb->'colors'->>'primaryText'), '#FFFFFF'),
    'secondaryText', COALESCE((design::jsonb->'colors'->>'secondaryText'), '#CCCCCC'),
    'active', COALESCE((design::jsonb->'colors'->>'active'), '#10B981'),
    'icon', COALESCE((design::jsonb->'colors'->>'icon'), '#FFFFFF'),
    'formBackground', COALESCE((design::jsonb->'colors'->>'formBackground'), '#1A1A1A'),
    'border', COALESCE((design::jsonb->'colors'->>'border'), '#374151'),
    'placeholder', 'rgba(255,255,255,0.05)',
    'inputBackground', '#1A1A1A',
    'productPrice', '#10B981',
    'unselectedButton', jsonb_build_object(
      'text', '#FFFFFF',
      'background', '#2A2A2A',
      'icon', '#FFFFFF'
    ),
    'selectedButton', jsonb_build_object(
      'text', '#FFFFFF',
      'background', '#10B981',
      'icon', '#FFFFFF'
    ),
    'box', jsonb_build_object(
      'headerBg', '#1A1A1A',
      'headerPrimaryText', '#FFFFFF',
      'headerSecondaryText', '#CCCCCC',
      'bg', '#0A0A0A',
      'primaryText', '#FFFFFF',
      'secondaryText', '#CCCCCC'
    ),
    'unselectedBox', jsonb_build_object(
      'headerBg', '#1F1F1F',
      'headerPrimaryText', '#E5E5E5',
      'headerSecondaryText', '#A3A3A3',
      'bg', '#141414',
      'primaryText', '#E5E5E5',
      'secondaryText', '#A3A3A3'
    ),
    'selectedBox', jsonb_build_object(
      'headerBg', '#10B981',
      'headerPrimaryText', '#FFFFFF',
      'headerSecondaryText', '#D1FAE5',
      'bg', '#064E3B',
      'primaryText', '#D1FAE5',
      'secondaryText', '#6EE7B7'
    ),
    'button', jsonb_build_object(
      'background', '#10B981',
      'text', '#FFFFFF'
    ),
    'orderSummary', jsonb_build_object(
      'background', '#1A1A1A',
      'titleText', '#FFFFFF',
      'productName', '#FFFFFF',
      'priceText', '#FFFFFF',
      'labelText', '#CCCCCC',
      'borderColor', '#1A1A1A'
    ),
    'footer', jsonb_build_object(
      'background', '#1A1A1A',
      'primaryText', '#FFFFFF',
      'secondaryText', '#CCCCCC',
      'border', '#2A2A2A'
    ),
    'securePurchase', jsonb_build_object(
      'headerBackground', '#10B981',
      'headerText', '#FFFFFF',
      'cardBackground', '#1A1A1A',
      'primaryText', '#FFFFFF',
      'secondaryText', '#CCCCCC',
      'linkText', '#60A5FA'
    ),
    'orderBump', jsonb_build_object(
      'headerBackground', 'rgba(0,0,0,0.15)',
      'headerText', '#10B981',
      'footerBackground', 'rgba(0,0,0,0.15)',
      'footerText', '#FFFFFF',
      'contentBackground', '#1A1A1A',
      'titleText', '#FFFFFF',
      'descriptionText', '#CCCCCC',
      'priceText', '#10B981',
      'selectedHeaderBackground', '#10B981',
      'selectedHeaderText', '#FFFFFF',
      'selectedFooterBackground', '#10B981',
      'selectedFooterText', '#FFFFFF'
    ),
    'creditCardFields', jsonb_build_object(
      'textColor', '#FFFFFF',
      'placeholderColor', '#9CA3AF',
      'borderColor', '#374151',
      'backgroundColor', '#1A1A1A',
      'focusBorderColor', '#10B981',
      'focusTextColor', '#FFFFFF'
    ),
    'personalDataFields', jsonb_build_object(
      'textColor', '#FFFFFF',
      'placeholderColor', '#6B7280',
      'borderColor', '#374151',
      'backgroundColor', '#1F1F1F',
      'focusBorderColor', '#10B981',
      'focusTextColor', '#FFFFFF'
    ),
    'infoBox', jsonb_build_object(
      'background', 'rgba(16,185,129,0.1)',
      'border', 'rgba(16,185,129,0.3)',
      'text', '#D1FAE5'
    )
  ),
  'backgroundImage', COALESCE(design::jsonb->'backgroundImage', 'null'::jsonb)
)
WHERE theme = 'dark' OR (design::jsonb->>'theme') = 'dark';

-- ETAPA 2: Garantir que checkouts com theme='light' ou NULL tenham design.colors completo
UPDATE checkouts
SET design = jsonb_build_object(
  'theme', COALESCE((design::jsonb->>'theme'), 'light'),
  'font', COALESCE((design::jsonb->>'font'), font, 'Inter'),
  'colors', jsonb_build_object(
    'background', COALESCE((design::jsonb->'colors'->>'background'), '#FFFFFF'),
    'primaryText', COALESCE((design::jsonb->'colors'->>'primaryText'), '#000000'),
    'secondaryText', COALESCE((design::jsonb->'colors'->>'secondaryText'), '#6B7280'),
    'active', COALESCE((design::jsonb->'colors'->>'active'), '#10B981'),
    'icon', COALESCE((design::jsonb->'colors'->>'icon'), '#000000'),
    'formBackground', COALESCE((design::jsonb->'colors'->>'formBackground'), '#F9FAFB'),
    'border', COALESCE((design::jsonb->'colors'->>'border'), '#E5E7EB'),
    'placeholder', 'rgba(0,0,0,0.05)',
    'inputBackground', '#F9FAFB',
    'productPrice', '#10B981',
    'unselectedButton', jsonb_build_object(
      'text', '#000000',
      'background', '#FFFFFF',
      'icon', '#000000'
    ),
    'selectedButton', jsonb_build_object(
      'text', '#FFFFFF',
      'background', '#10B981',
      'icon', '#FFFFFF'
    ),
    'box', jsonb_build_object(
      'headerBg', '#F3F4F6',
      'headerPrimaryText', '#111827',
      'headerSecondaryText', '#6B7280',
      'bg', '#FFFFFF',
      'primaryText', '#111827',
      'secondaryText', '#6B7280'
    ),
    'unselectedBox', jsonb_build_object(
      'headerBg', '#F9FAFB',
      'headerPrimaryText', '#374151',
      'headerSecondaryText', '#9CA3AF',
      'bg', '#FFFFFF',
      'primaryText', '#374151',
      'secondaryText', '#9CA3AF'
    ),
    'selectedBox', jsonb_build_object(
      'headerBg', '#10B981',
      'headerPrimaryText', '#FFFFFF',
      'headerSecondaryText', '#ECFDF5',
      'bg', '#F0FDF4',
      'primaryText', '#047857',
      'secondaryText', '#059669'
    ),
    'button', jsonb_build_object(
      'background', '#10B981',
      'text', '#FFFFFF'
    ),
    'orderSummary', jsonb_build_object(
      'background', '#F9FAFB',
      'titleText', '#000000',
      'productName', '#000000',
      'priceText', '#000000',
      'labelText', '#6B7280',
      'borderColor', '#D1D5DB'
    ),
    'footer', jsonb_build_object(
      'background', '#F9FAFB',
      'primaryText', '#000000',
      'secondaryText', '#6B7280',
      'border', '#E5E7EB'
    ),
    'securePurchase', jsonb_build_object(
      'headerBackground', '#10B981',
      'headerText', '#FFFFFF',
      'cardBackground', '#FFFFFF',
      'primaryText', '#000000',
      'secondaryText', '#6B7280',
      'linkText', '#3B82F6'
    ),
    'orderBump', jsonb_build_object(
      'headerBackground', 'rgba(0,0,0,0.15)',
      'headerText', '#10B981',
      'footerBackground', 'rgba(0,0,0,0.15)',
      'footerText', '#000000',
      'contentBackground', '#F9FAFB',
      'titleText', '#000000',
      'descriptionText', '#6B7280',
      'priceText', '#10B981',
      'selectedHeaderBackground', '#10B981',
      'selectedHeaderText', '#FFFFFF',
      'selectedFooterBackground', '#10B981',
      'selectedFooterText', '#FFFFFF'
    ),
    'creditCardFields', jsonb_build_object(
      'textColor', '#000000',
      'placeholderColor', '#6B7280',
      'borderColor', '#D1D5DB',
      'backgroundColor', '#FFFFFF',
      'focusBorderColor', '#10B981',
      'focusTextColor', '#000000'
    ),
    'personalDataFields', jsonb_build_object(
      'textColor', '#000000',
      'placeholderColor', '#6B7280',
      'borderColor', '#D1D5DB',
      'backgroundColor', '#FFFFFF',
      'focusBorderColor', '#10B981',
      'focusTextColor', '#000000'
    ),
    'infoBox', jsonb_build_object(
      'background', '#ECFDF5',
      'border', '#A7F3D0',
      'text', '#047857'
    )
  ),
  'backgroundImage', COALESCE(design::jsonb->'backgroundImage', 'null'::jsonb)
)
WHERE theme = 'light' OR theme IS NULL OR theme = 'custom';

-- ETAPA 3: Nullificar TODAS as colunas de cor individuais (dados corrompidos)
UPDATE checkouts
SET 
  primary_color = NULL,
  text_color = NULL,
  background_color = NULL,
  button_color = NULL,
  button_text_color = NULL,
  secondary_color = NULL,
  active_text_color = NULL,
  icon_color = NULL,
  form_background_color = NULL,
  primary_text_color = NULL,
  secondary_text_color = NULL,
  box_bg_color = NULL,
  box_header_bg_color = NULL,
  box_header_primary_text_color = NULL,
  box_header_secondary_text_color = NULL,
  box_primary_text_color = NULL,
  box_secondary_text_color = NULL,
  selected_box_bg_color = NULL,
  selected_box_header_bg_color = NULL,
  selected_box_header_primary_text_color = NULL,
  selected_box_header_secondary_text_color = NULL,
  selected_box_primary_text_color = NULL,
  selected_box_secondary_text_color = NULL,
  unselected_box_bg_color = NULL,
  unselected_box_header_bg_color = NULL,
  unselected_box_header_primary_text_color = NULL,
  unselected_box_header_secondary_text_color = NULL,
  unselected_box_primary_text_color = NULL,
  unselected_box_secondary_text_color = NULL,
  selected_button_bg_color = NULL,
  selected_button_text_color = NULL,
  selected_button_icon_color = NULL,
  unselected_button_bg_color = NULL,
  unselected_button_text_color = NULL,
  unselected_button_icon_color = NULL,
  payment_button_bg_color = NULL,
  payment_button_text_color = NULL,
  selected_payment_color = NULL,
  cc_field_text_color = NULL,
  cc_field_placeholder_color = NULL,
  cc_field_border_color = NULL,
  cc_field_background_color = NULL,
  cc_field_focus_border_color = NULL,
  cc_field_focus_text_color = NULL
WHERE TRUE;