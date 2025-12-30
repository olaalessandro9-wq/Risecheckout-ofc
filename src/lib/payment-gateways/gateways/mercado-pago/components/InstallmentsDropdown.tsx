/**
 * InstallmentsDropdown - Dropdown custom para seleção de parcelas
 * 
 * Características:
 * - Sem scroll interno (lista completa sempre renderizada)
 * - Abertura inteligente (acima/abaixo baseado no espaço disponível)
 * - Cores 100% controladas (sem azul do SO)
 * - Acessibilidade: teclado e ARIA
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import type { Installment } from '@/types/payment-types';

export interface InstallmentsDropdownProps {
  installments: Installment[];
  selectedValue: string;
  onSelect: (value: string) => void;
  isLoading?: boolean;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  disabled?: boolean;
}

export const InstallmentsDropdown: React.FC<InstallmentsDropdownProps> = ({
  installments,
  selectedValue,
  onSelect,
  isLoading = false,
  textColor = '#ffffff',
  backgroundColor = 'transparent',
  borderColor = 'hsl(var(--border))',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<'up' | 'down'>('down');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Encontrar label da opção selecionada
  const selectedInstallment = installments.find(i => i.value?.toString() === selectedValue);
  const displayLabel = selectedInstallment?.label || 'Selecione';

  // Calcular posição do dropdown
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return { top: 0, left: 0, width: 0 };
    
    const rect = triggerRef.current.getBoundingClientRect();
    const itemHeight = 40; // Altura estimada de cada item
    const listHeight = installments.length * itemHeight + 8; // +padding
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;

    // Decidir direção de abertura
    if (spaceBelow >= listHeight || spaceBelow >= spaceAbove) {
      setOpenDirection('down');
    } else {
      setOpenDirection('up');
    }

    return {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      triggerTop: rect.top + window.scrollY,
      listHeight
    };
  }, [installments.length]);

  // Abrir/fechar dropdown
  const toggle = useCallback(() => {
    if (disabled || isLoading) return;
    setIsOpen(prev => !prev);
    setHighlightedIndex(-1);
  }, [disabled, isLoading]);

  // Selecionar opção
  const handleSelect = useCallback((value: string) => {
    onSelect(value);
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [onSelect]);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        listRef.current && !listRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Navegação por teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled || isLoading) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleSelect(installments[highlightedIndex].value?.toString() || '1');
        } else {
          toggle();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex(prev => 
            prev < installments.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        }
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
        }
        break;
    }
  }, [disabled, isLoading, isOpen, highlightedIndex, installments, handleSelect, toggle]);

  // Calcular posição quando abre
  const position = isOpen ? calculatePosition() : null;

  // Estilos do item baseado em estado
  const getItemStyle = (index: number, value: string) => {
    const isSelected = value === selectedValue;
    const isHighlighted = index === highlightedIndex;
    
    // Determinar cores baseado no background
    const isLightBg = isLightColor(backgroundColor);
    const baseBg = isLightBg ? '#ffffff' : '#1f2937';
    const hoverBg = isLightBg ? '#f3f4f6' : '#374151';
    const selectedBg = isLightBg ? '#e5e7eb' : '#4b5563';
    const textColorComputed = isLightBg ? '#111827' : '#f9fafb';

    return {
      backgroundColor: isSelected ? selectedBg : isHighlighted ? hoverBg : baseBg,
      color: textColorComputed
    };
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        disabled={disabled || isLoading}
        className="w-full h-10 px-3 pr-8 rounded-xl border text-sm text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          color: textColor,
          backgroundColor,
          borderColor,
          borderWidth: '1px',
          borderStyle: 'solid'
        }}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="installments-listbox"
      >
        <span className="block truncate">
          {isLoading ? 'Carregando...' : displayLabel}
        </span>
        <ChevronDown 
          className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: textColor }}
        />
      </button>

      {/* Dropdown List (Portal) */}
      {isOpen && position && createPortal(
        <div
          ref={listRef}
          id="installments-listbox"
          role="listbox"
          className="fixed rounded-xl border shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            top: openDirection === 'down' 
              ? position.top + 4 
              : (position.triggerTop || 0) - position.listHeight - 4,
            left: position.left,
            width: position.width,
            zIndex: 9999,
            backgroundColor: isLightColor(backgroundColor) ? '#ffffff' : '#1f2937',
            borderColor
          }}
        >
          {installments.map((inst, index) => {
            const value = inst.value?.toString() || '1';
            const isSelected = value === selectedValue;
            const itemStyle = getItemStyle(index, value);

            return (
              <button
                key={value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className="w-full h-10 px-3 text-sm text-left flex items-center justify-between transition-colors duration-100"
                style={itemStyle}
              >
                <span className="truncate">{inst.label}</span>
                {isSelected && (
                  <Check className="h-4 w-4 flex-shrink-0 ml-2" style={{ color: itemStyle.color }} />
                )}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
};

// Helper para determinar se a cor de fundo é clara
function isLightColor(color: string): boolean {
  if (!color || color === 'transparent') return true;
  
  // Converter hex para RGB
  const hex = color.replace('#', '');
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Luminosidade relativa
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }
  return true;
}
