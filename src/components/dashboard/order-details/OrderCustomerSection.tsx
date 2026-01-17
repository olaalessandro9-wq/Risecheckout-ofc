/**
 * OrderCustomerSection - Customer information section with decrypt support
 */

import { User, Mail, Phone, FileText, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderCustomerSectionProps {
  customerName: string;
  customerEmail: string;
  phoneDisplay: string;
  documentDisplay: string;
  showDecryptButton: boolean;
  isLoading: boolean;
  isProductOwner: boolean;
  needsDecryption: boolean;
  error: string | null;
  onDecrypt: () => void;
}

export function OrderCustomerSection({
  customerName,
  customerEmail,
  phoneDisplay,
  documentDisplay,
  showDecryptButton,
  isLoading,
  isProductOwner,
  needsDecryption,
  error,
  onDecrypt,
}: OrderCustomerSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <User className="w-3.5 h-3.5" />
          <span>Informações do Cliente</span>
        </div>
        
        {/* Botão Ver Dados - só aparece para NÃO produtores com dados criptografados */}
        {showDecryptButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDecrypt}
            disabled={isLoading}
            className="h-7 text-xs gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                Ver dados sensíveis
              </>
            )}
          </Button>
        )}
        
        {/* Loading para produtor (auto-decrypt) */}
        {isProductOwner && isLoading && needsDecryption && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Carregando dados...</span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">
          {error}
        </p>
      )}

      <div className="grid gap-2">
        <CustomerField icon={User} label="Nome" value={customerName} />
        <CustomerField icon={Mail} label="Email" value={customerEmail} isEmail />
        
        {phoneDisplay && phoneDisplay !== 'N/A' && (
          <CustomerField icon={Phone} label="Telefone" value={phoneDisplay} isMono />
        )}

        {documentDisplay && documentDisplay !== 'N/A' && (
          <CustomerField icon={FileText} label="CPF/CNPJ" value={documentDisplay} isMono />
        )}
      </div>
    </div>
  );
}

interface CustomerFieldProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  isEmail?: boolean;
  isMono?: boolean;
}

function CustomerField({ icon: Icon, label, value, isEmail, isMono }: CustomerFieldProps) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
      <div className="p-1.5 rounded-md bg-background">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium text-foreground ${isEmail ? 'text-xs break-all' : ''} ${isMono ? 'font-mono' : ''} ${!isEmail && !isMono ? 'truncate' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
