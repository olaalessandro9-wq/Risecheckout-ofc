import { useState, useEffect, useMemo } from "react";
import { RgbaColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";

extend([namesPlugin]);

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  className?: string;
}

type ColorMode = 'HEX' | 'RGBA' | 'HSLA';

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  description,
  className,
}) => {
  const [internalColor, setInternalColor] = useState(() => colord(value || "#000000").toRgb());
  const [colorMode, setColorMode] = useState<ColorMode>('RGBA');
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState("");

  // Sincroniza com prop externa
  useEffect(() => {
    if (value) {
      const c = colord(value);
      if (c.isValid()) {
        const current = colord(internalColor);
        if (c.toRgbString() !== current.toRgbString()) {
          setInternalColor(c.toRgb());
        }
      }
    }
  }, [value, internalColor]);

  // Handler do picker visual
  const handlePickerChange = (newColor: { r: number; g: number; b: number; a: number }) => {
    setInternalColor(newColor);
    const c = colord(newColor);
    onChange(c.toRgbString());
  };

  // Handler de inputs RGB
  const handleRgbaChange = (key: 'r' | 'g' | 'b' | 'a', val: string) => {
    const num = Number(val);
    if (isNaN(num)) return;
    
    const newColor = { ...internalColor };
    
    if (key === 'a') {
      newColor.a = Math.min(1, Math.max(0, num / 100));
    } else {
      newColor[key] = Math.min(255, Math.max(0, Math.round(num)));
    }

    setInternalColor(newColor);
    const c = colord(newColor);
    onChange(c.toRgbString());
  };

  // Handler de inputs HSL
  const handleHslaChange = (key: 'h' | 's' | 'l' | 'a', val: string) => {
    const num = Number(val);
    if (isNaN(num)) return;

    const hsl = colord(internalColor).toHsl();
    const newHsl = { ...hsl };
    
    if (key === 'h') {
      newHsl.h = Math.min(360, Math.max(0, num));
    } else if (key === 's' || key === 'l') {
      newHsl[key] = Math.min(100, Math.max(0, num));
    } else if (key === 'a') {
      newHsl.a = Math.min(1, Math.max(0, num / 100));
    }

    const c = colord(newHsl);
    const newRgb = c.toRgb();
    setInternalColor(newRgb);
    onChange(c.toRgbString());
  };

  // Handler de input HEX
  const handleHexChange = (newHex: string) => {
    // Atualiza o input imediatamente para permitir digitação livre
    setHexInput(newHex);
    
    let hex = newHex;
    if (!hex.startsWith("#")) hex = "#" + hex;
    
    const c = colord(hex);
    if (c.isValid()) {
      const newRgb = c.toRgb();
      setInternalColor(newRgb);
      onChange(hex);
    }
  };

  // Cycle entre modos
  const cycleMode = () => {
    if (colorMode === 'HEX') setColorMode('RGBA');
    else if (colorMode === 'RGBA') setColorMode('HSLA');
    else setColorMode('HEX');
  };

  // Sincroniza hexInput quando internalColor muda (por picker ou outros inputs)
  // MAS não atualiza se o usuário estiver digitando (hexInput tem foco)
  const [isEditingHex, setIsEditingHex] = useState(false);
  
  useEffect(() => {
    // Só atualiza se NÃO estiver editando manualmente
    if (!isEditingHex) {
      const hex = colord(internalColor).toHex().replace("#", "").toUpperCase();
      setHexInput(hex);
    }
  }, [internalColor, isEditingHex]);

  // Valores de exibição
  const displayHex = useMemo(() => {
    const c = colord(internalColor);
    return c.toHex();
  }, [internalColor]);
  
  const displayHsl = useMemo(() => colord(internalColor).toHsl(), [internalColor]);
  const previewColor = useMemo(() => colord(internalColor).toRgbString(), [internalColor]);

  return (
    <div className={`flex flex-col gap-2 w-full ${className || ''}`}>
      {label && <Label className="text-xs font-medium text-muted-foreground">{label}</Label>}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal h-10"
          >
            <div className="flex items-center gap-2 w-full">
              <div
                className="w-6 h-6 rounded border border-border flex-shrink-0"
                style={{ backgroundColor: previewColor }}
              />
              <span className="text-xs font-mono flex-1 truncate">{displayHex.toUpperCase()}</span>
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[280px] p-3" align="start">
          {/* CSS Customizado */}
          <style>{`
            .compact-picker .react-colorful {
              width: 100%;
              height: auto;
            }
            .compact-picker .react-colorful__saturation {
              border-radius: 6px;
              height: 150px;
              margin-bottom: 8px;
            }
            .compact-picker .react-colorful__hue {
              height: 12px;
              border-radius: 6px;
              margin: 0 0 4px 0;
            }
            .compact-picker .react-colorful__alpha {
              height: 12px;
              border-radius: 6px;
              margin: 0;
            }
            .compact-picker .react-colorful__saturation-pointer {
              width: 16px;
              height: 16px;
              border-width: 2px;
            }
            .compact-picker .react-colorful__hue-pointer,
            .compact-picker .react-colorful__alpha-pointer {
              width: 16px;
              height: 16px;
              border-width: 2px;
            }
          `}</style>
          
          <div className="flex flex-col gap-3 compact-picker">
            {/* Picker Visual */}
            <div className="w-full">
              <RgbaColorPicker 
                color={internalColor} 
                onChange={handlePickerChange} 
              />
            </div>

            {/* Preview Circle + Inputs + Toggle */}
            <div className="flex items-start gap-2">
              {/* Preview Circle */}
              <div className="flex items-center flex-shrink-0 pt-4">
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: previewColor }}
                  title="Preview da cor"
                />
              </div>

              {/* Inputs */}
              <div className="flex-1 min-w-0">
                {colorMode === 'HEX' && (
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] text-muted-foreground font-bold text-center">HEX</Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground pointer-events-none">#</span>
                      <Input
                        value={hexInput}
                        onChange={(e) => handleHexChange(e.target.value.toUpperCase())}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text');
                          const cleanedText = pastedText.replace('#', '').toUpperCase();
                          handleHexChange(cleanedText);
                        }}
                        onFocus={() => setIsEditingHex(true)}
                        onBlur={() => {
                          setIsEditingHex(false);
                          // Se estiver vazio ao perder foco, restaura o valor atual
                          if (hexInput === "") {
                            const hex = colord(internalColor).toHex().replace("#", "").toUpperCase();
                            setHexInput(hex);
                          }
                        }}
                        className="h-7 text-xs text-center font-mono pl-5 pr-1"
                        maxLength={8}
                        placeholder="FFFFFF"
                      />
                    </div>
                  </div>
                )}

                {colorMode === 'RGBA' && (
                  <div className="grid grid-cols-4 gap-1">
                    {(['r', 'g', 'b'] as const).map((key) => (
                      <div key={key} className="flex flex-col gap-1">
                        <Label className="text-[10px] text-muted-foreground font-bold text-center uppercase">{key}</Label>
                        <Input
                          type="number"
                          min="0"
                          max="255"
                          value={Math.round(internalColor[key])}
                          onChange={(e) => handleRgbaChange(key, e.target.value)}
                          className="h-7 text-[10px] text-center px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    ))}
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-muted-foreground font-bold text-center">A</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={Math.round(internalColor.a * 100)}
                        onChange={(e) => handleRgbaChange('a', e.target.value)}
                        className="h-7 text-[10px] text-center px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                )}

                {colorMode === 'HSLA' && (
                  <div className="grid grid-cols-4 gap-1">
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-muted-foreground font-bold text-center">H</Label>
                      <Input
                        type="number"
                        min="0"
                        max="360"
                        value={Math.round(displayHsl.h)}
                        onChange={(e) => handleHslaChange('h', e.target.value)}
                        className="h-7 text-[10px] text-center px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-muted-foreground font-bold text-center">S</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={Math.round(displayHsl.s)}
                        onChange={(e) => handleHslaChange('s', e.target.value)}
                        className="h-7 text-[10px] text-center px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-muted-foreground font-bold text-center">L</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={Math.round(displayHsl.l)}
                        onChange={(e) => handleHslaChange('l', e.target.value)}
                        className="h-7 text-[10px] text-center px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-muted-foreground font-bold text-center">A</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={Math.round(displayHsl.a * 100)}
                        onChange={(e) => handleHslaChange('a', e.target.value)}
                        className="h-7 text-[10px] text-center px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle Button */}
              <div className="flex flex-col justify-end h-full pt-4 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cycleMode}
                  className="h-7 w-7 rounded-full hover:bg-muted"
                  title={`Modo: ${colorMode}`}
                >
                  <ChevronsUpDown className="h-3 w-3 opacity-60" />
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
    </div>
  );
};
