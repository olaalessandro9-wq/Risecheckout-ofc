/**
 * Webhooks - Página de gerenciamento de Webhooks
 * 
 * Layout com edição inline à direita.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Configurações
 */

import { WebhooksConfig } from "@/components/webhooks/WebhooksConfig";

const Webhooks = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1 text-foreground">
          Webhooks
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure integrações com seus aplicativos externos
        </p>
      </div>

      {/* Conteúdo principal */}
      <WebhooksConfig />
    </div>
  );
};

export default Webhooks;
