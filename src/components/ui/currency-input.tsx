import React, { useState, useEffect } from "react";
import { Input } from "./input";

interface CurrencyInputProps {
  value: string | number;  // Aceita CENTAVOS (integer) ou string
  onChange: (value: number) => void;  // Retorna CENTAVOS (integer)
  className?: string;
  error?: string;
  id?: string;
}

/**
 * 💰 CurrencyInput - Componente de input de moeda
 * 
 * PADRÃO: Trabalha SEMPRE em CENTAVOS internamente
 * - Recebe: CENTAVOS (ex: 150 = R$ 1,50)
 * - Retorna: CENTAVOS (ex: 150 = R$ 1,50)
 * - Exibe: REAIS formatados (ex: "R$ 1,50")
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  className = "",
  error = "",
  id,
}) => {
  const [displayValue, setDisplayValue] = useState("R$ 0,00");

  // Formatar centavos para exibição (CENTAVOS → String formatada em REAIS)
  const formatCurrency = (cents: number): string => {
    // Garantir que é um número válido
    const validCents = isNaN(cents) ? 0 : cents;
    
    // Converter para reais
    const reais = validCents / 100;
    
    // Formatar com separador de milhares e 2 casas decimais
    const formatted = reais.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return `R$ ${formatted}`;
  };

  // Converter string para CENTAVOS (String → Integer)
  const parseCurrency = (str: string): number => {
    // Remover tudo exceto números
    const numbers = str.replace(/\D/g, "");
    
    if (!numbers || numbers === "0") return 0;
    
    // Retornar como centavos (integer)
    // Ex: "1500" → 1500 centavos (R$ 15,00)
    return parseInt(numbers, 10);
  };

  // Atualizar display quando value mudar
  useEffect(() => {
    const cents = typeof value === 'number' ? value : parseCurrency(value.toString());
    setDisplayValue(formatCurrency(cents));
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;

    // Permitir apenas números e teclas de controle
    if (
      !/^\d$/.test(key) && // Números
      key !== "Backspace" &&
      key !== "Delete" &&
      key !== "ArrowLeft" &&
      key !== "ArrowRight" &&
      key !== "Tab"
    ) {
      e.preventDefault();
      return;
    }

    // Prevenir comportamento padrão para números e backspace
    if (/^\d$/.test(key) || key === "Backspace" || key === "Delete") {
      e.preventDefault();

      // Trabalhar com centavos internamente
      let cents = parseCurrency(displayValue);

      if (/^\d$/.test(key)) {
        // Adicionar dígito (multiplicar por 10 e adicionar novo dígito)
        cents = cents * 10 + parseInt(key, 10);
      } else if (key === "Backspace" || key === "Delete") {
        // Remover último dígito (dividir por 10)
        cents = Math.floor(cents / 10);
      }

      // Retornar CENTAVOS (integer)
      onChange(cents);
      setDisplayValue(formatCurrency(cents));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const numbers = pastedText.replace(/\D/g, "");
    
    if (numbers) {
      const cents = parseInt(numbers, 10);
      
      // Retornar CENTAVOS (integer)
      onChange(cents);
      setDisplayValue(formatCurrency(cents));
    }
  };

  return (
    <Input
      id={id}
      type="text"
      value={displayValue}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={className}
      readOnly={false}
    />
  );
};
