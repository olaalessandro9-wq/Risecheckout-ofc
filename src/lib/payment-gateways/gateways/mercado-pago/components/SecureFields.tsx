/**
 * SecureFields - Componente COMPLETAMENTE MEMOIZADO para campos seguros do MP
 * 
 * NUNCA re-renderiza quando o pai muda estado (Nome, CPF, etc)
 * Erros são exibidos FORA deste componente
 * 
 * Limite: < 120 linhas
 */

import React, { useState, useRef, useCallback, memo } from 'react';
import { CardNumber, ExpirationDate, SecurityCode } from '@mercadopago/sdk-react';

export interface SecureFieldsProps {
  onReady: () => void;
  textColor: string;
  placeholderColor: string;
  onCardNumberChange?: () => void;
  onExpirationDateChange?: () => void;
  onSecurityCodeChange?: () => void;
  onBinChange?: (bin: string) => void;
}

export const SecureFields = memo(({ 
  onReady, 
  textColor, 
  placeholderColor,
  onCardNumberChange,
  onExpirationDateChange,
  onSecurityCodeChange,
  onBinChange
}: SecureFieldsProps) => {
  const readyCalledRef = useRef(false);
  const [isCardNumberReady, setIsCardNumberReady] = useState(false);
  const [isExpirationReady, setIsExpirationReady] = useState(false);
  const [isSecurityCodeReady, setIsSecurityCodeReady] = useState(false);

  const handleCardNumberReady = useCallback(() => {
    setIsCardNumberReady(true);
    if (!readyCalledRef.current) {
      readyCalledRef.current = true;
      console.log('[SecureFields] CardNumber ready - iframes carregados');
      onReady();
    }
  }, [onReady]);

  const handleExpirationReady = useCallback(() => {
    setIsExpirationReady(true);
  }, []);

  const handleSecurityCodeReady = useCallback(() => {
    setIsSecurityCodeReady(true);
  }, []);

  // Estilo para os iframes do MP
  const secureFieldStyle = {
    height: '100%',
    padding: '0',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: textColor,
    '::placeholder': {
      color: placeholderColor,
    }
  };

  console.log('[SecureFields] Montando componente (deve acontecer apenas 1x)');

  return (
    <>
      {/* Número do Cartão */}
      <div className="mp-field-card-number">
        <div className="mp-secure-field-container relative">
          {!isCardNumberReady && (
            <div 
              className="absolute inset-0 flex items-center pointer-events-none z-10"
              style={{ color: placeholderColor }}
            >
              <span className="text-sm">0000 0000 0000 0000</span>
            </div>
          )}
          <CardNumber
            placeholder="0000 0000 0000 0000"
            style={secureFieldStyle}
            onReady={handleCardNumberReady}
            onChange={() => onCardNumberChange?.()}
            onBinChange={(data) => {
              if (data?.bin) {
                console.log('[SecureFields] BIN detectado:', data.bin);
                onBinChange?.(data.bin);
              }
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Validade */}
        <div className="mp-field-expiration">
          <div className="mp-secure-field-container relative">
            {!isExpirationReady && (
              <div 
                className="absolute inset-0 flex items-center pointer-events-none z-10"
                style={{ color: placeholderColor }}
              >
                <span className="text-sm">MM/AA</span>
              </div>
            )}
            <ExpirationDate
              placeholder="MM/AA"
              style={secureFieldStyle}
              onReady={handleExpirationReady}
              onChange={() => onExpirationDateChange?.()}
            />
          </div>
        </div>

        {/* CVV */}
        <div className="mp-field-security-code">
          <div className="mp-secure-field-container relative">
            {!isSecurityCodeReady && (
              <div 
                className="absolute inset-0 flex items-center pointer-events-none z-10"
                style={{ color: placeholderColor }}
              >
                <span className="text-sm">123</span>
              </div>
            )}
            <SecurityCode
              placeholder="123"
              style={secureFieldStyle}
              onReady={handleSecurityCodeReady}
              onChange={() => onSecurityCodeChange?.()}
            />
          </div>
        </div>
      </div>
    </>
  );
}, () => true); // Comparador que SEMPRE retorna true = NUNCA re-renderiza

SecureFields.displayName = 'SecureFields';
