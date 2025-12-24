import { Separator } from "@/components/ui/separator";
import { SettingCategory } from "./settings.config";
import { ColorField } from "./ColorField";
import { SelectField } from "./SelectField";

// Função helper para acessar propriedades aninhadas (substitui lodash.get)
const get = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

interface SettingCategorySectionProps {
  category: SettingCategory;
  customization: any;
  onUpdate: (path: string, value: any) => void;
}

export const SettingCategorySection = ({
  category,
  customization,
  onUpdate,
}: SettingCategorySectionProps) => {
  return (
    <>
      <div className="space-y-4 max-w-full overflow-x-hidden">
        <div>
          <h3 className="text-lg font-semibold">{category.title}</h3>
          {category.description && (
            <p className="text-sm text-muted-foreground leading-relaxed break-words mt-1">
              {category.description}
            </p>
          )}
        </div>

        {category.fields.map((field) => {
          const value = get(customization, field.path);

          if (field.type === 'color') {
            return (
              <ColorField
                key={field.id}
                field={field}
                value={value}
                onChange={(newValue) => onUpdate(field.path, newValue)}
              />
            );
          }

          if (field.type === 'select') {
            return (
              <SelectField
                key={field.id}
                field={field}
                value={value}
                onChange={(newValue) => onUpdate(field.path, newValue)}
              />
            );
          }

          // Outros tipos podem ser adicionados aqui no futuro
          return null;
        })}
      </div>
      <Separator />
    </>
  );
};
