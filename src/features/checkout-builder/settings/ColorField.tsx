import { ColorPicker } from "@/components/checkout/ColorPicker";
import { SettingField } from "./settings.config";

interface ColorFieldProps {
  field: SettingField;
  value: string;
  onChange: (value: string) => void;
}

export const ColorField = ({ field, value, onChange }: ColorFieldProps) => {
  return (
    <ColorPicker
      label={field.label}
      value={value || field.defaultValue}
      onChange={onChange}
      description={field.description}
    />
  );
};
