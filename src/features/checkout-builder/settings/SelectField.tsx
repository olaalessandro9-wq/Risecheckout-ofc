import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SettingField } from "./settings.config";

interface SelectFieldProps {
  field: SettingField;
  value: string;
  onChange: (value: string) => void;
}

export const SelectField = ({ field, value, onChange }: SelectFieldProps) => {
  // defaultValue is guaranteed to be a string for select fields
  const defaultSelectValue = typeof field.defaultValue === 'string' ? field.defaultValue : '';
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{field.label}</Label>
      <Select
        value={value || defaultSelectValue}
        onValueChange={onChange}
      >
        <SelectTrigger className="will-change-auto">
          <SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="will-change-transform">
          {field.options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {field.description && (
        <p className="text-xs text-muted-foreground break-words">
          {field.description}
        </p>
      )}
    </div>
  );
};
