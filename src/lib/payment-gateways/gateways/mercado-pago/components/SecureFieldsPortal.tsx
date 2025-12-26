/**
 * SecureFieldsPortal - Renderiza SecureFields e move iframes para os slots
 * 
 * Usa MutationObserver para detectar quando iframes são criados pelo SDK
 * GARANTIA DE MONTAGEM ÚNICA com reset automático quando sai do checkout
 * 
 * Limite: < 120 linhas
 */

import React, { useRef, useEffect, memo } from 'react';
import { SecureFields, SecureFieldsProps } from './SecureFields';

// Flag GLOBAL para controle de montagem
const secureFieldsGlobalState = {
  mounted: false,
  containerElement: null as HTMLDivElement | null,
  currentPath: null as string | null,
};

// Função para resetar o estado global
export const resetSecureFieldsState = () => {
  console.log('[SecureFieldsPortal] Resetando estado global');
  secureFieldsGlobalState.mounted = false;
  secureFieldsGlobalState.containerElement = null;
  secureFieldsGlobalState.currentPath = null;
};

export const SecureFieldsPortal = memo((props: SecureFieldsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const movedRef = useRef(false);
  const isThisInstanceOwner = useRef(false);

  useEffect(() => {
    const currentPath = window.location.pathname;
    
    // Se a página mudou, resetar o estado
    if (secureFieldsGlobalState.currentPath && 
        secureFieldsGlobalState.currentPath !== currentPath &&
        !currentPath.includes('/pay/')) {
      console.log('[SecureFieldsPortal] Página mudou, resetando estado');
      resetSecureFieldsState();
    }
    
    secureFieldsGlobalState.currentPath = currentPath;

    // Se já existe uma instância montada, reutilizar
    if (secureFieldsGlobalState.mounted && !isThisInstanceOwner.current) {
      console.log('[SecureFieldsPortal] Já existe instância global, reutilizando');
      
      requestAnimationFrame(() => {
        const existingContainer = secureFieldsGlobalState.containerElement;
        if (existingContainer) {
          const cardNumberEl = existingContainer.querySelector('.mp-field-card-number .mp-secure-field-container');
          const expirationEl = existingContainer.querySelector('.mp-field-expiration .mp-secure-field-container');
          const securityEl = existingContainer.querySelector('.mp-field-security-code .mp-secure-field-container');

          const cardSlot = document.getElementById('mp-card-number-slot');
          const expSlot = document.getElementById('mp-expiration-slot');
          const secSlot = document.getElementById('mp-security-slot');

          if (cardNumberEl && cardSlot) cardSlot.appendChild(cardNumberEl);
          if (expirationEl && expSlot) expSlot.appendChild(expirationEl);
          if (securityEl && secSlot) secSlot.appendChild(securityEl);
        }
      });
      return;
    }

    // Esta instância será a dona global
    secureFieldsGlobalState.mounted = true;
    isThisInstanceOwner.current = true;

    const moveIframes = () => {
      if (movedRef.current) return;
      
      const container = containerRef.current;
      if (!container) return;

      secureFieldsGlobalState.containerElement = container;

      const cardNumberEl = container.querySelector('.mp-field-card-number .mp-secure-field-container');
      const expirationEl = container.querySelector('.mp-field-expiration .mp-secure-field-container');
      const securityEl = container.querySelector('.mp-field-security-code .mp-secure-field-container');

      const cardSlot = document.getElementById('mp-card-number-slot');
      const expSlot = document.getElementById('mp-expiration-slot');
      const secSlot = document.getElementById('mp-security-slot');

      if (cardNumberEl && cardSlot && !cardSlot.hasChildNodes()) {
        cardSlot.appendChild(cardNumberEl);
      }
      if (expirationEl && expSlot && !expSlot.hasChildNodes()) {
        expSlot.appendChild(expirationEl);
      }
      if (securityEl && secSlot && !secSlot.hasChildNodes()) {
        secSlot.appendChild(securityEl);
      }

      if (cardSlot?.hasChildNodes() && expSlot?.hasChildNodes() && secSlot?.hasChildNodes()) {
        movedRef.current = true;
        console.log('[SecureFieldsPortal] Iframes movidos para os slots');
      }
    };

    const observer = new MutationObserver(() => {
      if (!movedRef.current) {
        moveIframes();
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, { 
        childList: true, 
        subtree: true 
      });
    }

    requestAnimationFrame(moveIframes);

    return () => {
      observer.disconnect();
      if (isThisInstanceOwner.current) {
        console.log('[SecureFieldsPortal] Componente desmontando, resetando estado');
        resetSecureFieldsState();
        isThisInstanceOwner.current = false;
        movedRef.current = false;
      }
    };
  }, []);

  // Se já existe instância e não somos os donos, não renderizar
  if (secureFieldsGlobalState.mounted && !isThisInstanceOwner.current) {
    return <div ref={containerRef} className="hidden" />;
  }

  return (
    <div ref={containerRef} className="hidden">
      <SecureFields {...props} />
    </div>
  );
}, () => true);

SecureFieldsPortal.displayName = 'SecureFieldsPortal';
