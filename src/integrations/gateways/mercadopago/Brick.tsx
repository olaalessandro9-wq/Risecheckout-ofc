/**
 * Componente Brick do Mercado Pago
 * Módulo: src/integrations/gateways/mercadopago
 * 
 * Componente React responsável por renderizar o formulário de cartão (Brick)
 * do Mercado Pago.
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant - Zero console.log
 */

import React, { useEffect, useRef } from "react";
import { MercadoPagoIntegration, BrickConfig } from "./types";
import { createLogger } from "@/lib/logger";

const log = createLogger("MercadoPago");

interface BrickProps {
  integration: MercadoPagoIntegration | null;
  onPaymentReady?: () => void;
  onPaymentError?: (error: unknown) => void;
  onPaymentSubmit?: (data: Record<string, unknown>) => void;
  customConfig?: Partial<BrickConfig>;
}

interface BrickInstance {
  unmount: () => void;
}

export const Brick = ({
  integration,
  onPaymentReady,
  onPaymentError,
  onPaymentSubmit,
  customConfig,
}: BrickProps) => {
  const brickContainerId = "mercadopago-brick-container";
  const brickInstanceRef = useRef<BrickInstance | null>(null);

  useEffect(() => {
    if (!integration || !integration.active || !integration.config?.public_key) {
      log.debug("Brick não será renderizado (integração inválida)");
      return;
    }

    const initBrick = async () => {
      try {
        // Verificar se MercadoPago está disponível
        if (!window.MercadoPago) {
          log.warn("MercadoPago SDK não está carregada");
          return;
        }

        const mp = new window.MercadoPago(integration.config.public_key, {
          locale: "pt-BR",
        });

        // Configuração do Brick
        const brickConfig: BrickConfig = {
          publicKey: integration.config.public_key,
          locale: "pt-BR",
          theme: {
            colors: {
              primary: "#3483FA",
              secondary: "#555555",
              error: "#FF5252",
            },
          },
          callbacks: {
            onReady: () => {
              log.info("Brick está pronto");
              onPaymentReady?.();
            },
            onSubmit: (data: unknown) => {
              log.info("Pagamento submetido", data);
              onPaymentSubmit?.(data as Record<string, unknown>);
            },
            onError: (error: unknown) => {
              log.error("Erro no Brick", error);
              onPaymentError?.(error);
            },
            onFieldChange: (field: unknown) => {
              log.trace("Campo alterado", field);
            },
          },
          customizations: {
            visual: {
              hideFormTitle: false,
              hidePaymentButton: false,
            },
            paymentMethods: {
              maxInstallments: 12,
              excluded: [],
            },
          },
          ...customConfig,
        };

        // Renderizar Brick
        const mpWithBricks = mp as unknown as { bricks: () => { create: (name: string, config: unknown) => Promise<unknown> } };
        const brickBuilder = mpWithBricks.bricks();
        const brickInstance = await brickBuilder.create("payment", brickConfig);

        brickInstanceRef.current = brickInstance as BrickInstance;

        log.info("Brick renderizado com sucesso", {
          public_key: integration.config.public_key,
        });
      } catch (error: unknown) {
        log.error("Erro ao renderizar Brick", error);
        onPaymentError?.(error);
      }
    };

    // Executar apenas no navegador (não SSR)
    if (typeof window !== "undefined") {
      initBrick();
    }

    // Cleanup
    return () => {
      if (brickInstanceRef.current) {
        brickInstanceRef.current.unmount();
      }
    };
  }, [integration?.config?.public_key, integration?.active, onPaymentReady, onPaymentError, onPaymentSubmit, customConfig]);

  // Renderizar container do Brick
  return (
    <div
      id={brickContainerId}
      style={{
        width: "100%",
        minHeight: "400px",
        padding: "20px",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
      }}
    />
  );
};

Brick.displayName = "MercadoPagoBrick";
