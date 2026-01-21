/**
 * Webhook Form Sheet
 * 
 * @module modules/webhooks/components
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useWebhooks } from "../context/WebhooksContext";
import { WebhookForm } from "./WebhookForm";

export function WebhookFormSheet() {
  const { isFormOpen, editingWebhook, closeForm } = useWebhooks();

  return (
    <Sheet open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {editingWebhook ? "Editar Webhook" : "Novo Webhook"}
          </SheetTitle>
          <SheetDescription>
            Configure as integrações com os seus apps
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <WebhookForm />
        </div>
      </SheetContent>
    </Sheet>
  );
}
