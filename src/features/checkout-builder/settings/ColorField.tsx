import { ColorPicker } from "@/components/checkout/ColorPicker";
import { SettingField } from "./settings.config";

interface ColorFieldProps {
  field: SettingField;
  value: string;
  onChange: (value: string) => void;
}

export const ColorField = ({ field, value, onChange }: ColorFieldProps) => {
  // defaultValue is guaranteed to be a string for color fields
  const defaultColor = typeof field.defaultValue === 'string' ? field.defaultValue : '#000000';
  
  return (
    <ColorPicker
      label={field.label}
      value={value || defaultColor}
      onChange={onChange}
      description={field.description}
    />
  );
};
