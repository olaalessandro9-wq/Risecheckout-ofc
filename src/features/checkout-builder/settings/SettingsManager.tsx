import { SETTINGS_CATEGORIES } from "./settings.config";
import { SettingCategorySection } from "./SettingCategorySection";
import { THEME_PRESETS } from "@/lib/checkout/themePresets";

// Função helper para clonar objetos profundamente (substitui lodash.cloneDeep)
const cloneDeep = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Função helper para definir valores em paths aninhados (substitui lodash.set)
const set = (obj: any, path: string, value: any): void => {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
};

interface SettingsManagerProps {
  customization: any;
  onUpdate: (field: string, value: any) => void;
}

export const SettingsManager = ({ customization, onUpdate }: SettingsManagerProps) => {
  /**
   * Handler especial para mudança de tema
   * Aplica preset completo quando muda para light/dark
   * 
   * REFATORAÇÃO (Gemini): Usa lodash.set para manipulação segura de paths
   */
  const handleUpdate = (path: string, value: any) => {
    // Se está mudando o tema
    if (path === 'design.theme') {
      if (value === 'custom') {
        // Apenas muda o theme para custom, mantém as cores atuais
        onUpdate('design.theme', value);
      } else if (value === 'light' || value === 'dark') {
        // Aplica TODAS as cores do preset
        const preset = THEME_PRESETS[value];
        onUpdate('design', {
          ...customization.design,
          theme: value,
          colors: preset.colors,
        });
      }
    } 
    // Se está mudando uma cor individual
    else if (path.startsWith('design.colors.')) {
      // Marca como custom (usuário customizou uma cor)
      // Usa cloneDeep para evitar mutação do objeto original
      const newDesign = cloneDeep(customization.design);
      
      // Usa lodash.set para atualizar o valor de forma segura
      // Remove 'design.' do path pois já estamos trabalhando com newDesign
      const designPath = path.replace('design.', '');
      set(newDesign, designPath, value);
      
      // Marca como custom
      newDesign.theme = 'custom';
      
      onUpdate('design', newDesign);
    }
    // Outros campos (como font)
    else {
      onUpdate(path, value);
    }
  };

  return (
    <div className="space-y-6 p-4 w-full max-w-full overflow-x-hidden">
      {SETTINGS_CATEGORIES.map((category, index) => (
        <SettingCategorySection
          key={category.id}
          category={category}
          customization={customization}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  );
};
