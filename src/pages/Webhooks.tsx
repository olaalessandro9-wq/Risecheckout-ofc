/**
 * Webhooks - Página de gerenciamento de Webhooks
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant (XState)
 * @see docs/WEBHOOKS_MODULE.md
 */

import { WebhooksManager } from "@/modules/webhooks";

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

      {/* Conteúdo principal via XState */}
      <WebhooksManager />
    </div>
  );
};

export default Webhooks;
