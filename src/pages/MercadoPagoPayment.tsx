import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Copy, CheckCircle2, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as PushinPay from "@/integrations/gateways/pushinpay";

// Interface para navigation state com access_token
interface PaymentNavigationState {
  accessToken?: string;
}

/**
 * Interface para dados do pedido retornados pela RPC
 */
interface MercadoPagoOrderData {
  id: string;
  status: string;
  amount_cents: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_document: string | null;
  product_name?: string | null;
  product_id?: string;
  payment_method?: string | null;
  pix_qr_code?: string | null;
  pix_status?: string | null;
  vendor_id?: string;
  created_at?: string;
  tracking_parameters?: unknown;
}

export const MercadoPagoPayment = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Obter access_token do navigation state
  const navState = location.state as PaymentNavigationState | null;
  
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"waiting" | "paid" | "expired">("waiting");
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(900); // 15 minutos = 900 segundos
  const [orderData, setOrderData] = useState<MercadoPagoOrderData | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  
  const hasShownExpiredToast = useRef(false);
  const expiresAt = useRef<number>(0);

  // Buscar dados do pedido usando RPC com validação de access_token
  const fetchOrderData = useCallback(async (retryCount = 0) => {
    const accessToken = navState?.accessToken;
    
    if (!accessToken) {
      console.error("[MercadoPagoPayment] ⚠️ Sem access_token no navigation state");
      toast.error("Token de acesso não encontrado");
      return;
    }

    try {
      console.log(`[MercadoPagoPayment] Buscando pedido via RPC (tentativa ${retryCount + 1}):`, orderId);
      
      const { data: order, error } = await supabase
        .rpc("get_order_for_payment", { 
          p_order_id: orderId,
          p_access_token: accessToken 
        })
        .single();

      if (error || !order) {
        if (retryCount < 3) {
          console.log(`[MercadoPagoPayment] Pedido não encontrado, tentando novamente em 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchOrderData(retryCount + 1);
        }
        throw new Error(error?.message || "Pedido não encontrado ou token inválido");
      }
      
      console.log("[MercadoPagoPayment] Pedido encontrado via RPC:", order);
      setOrderData(order);
    } catch (err: unknown) {
      console.error("[MercadoPagoPayment] Erro ao buscar pedido:", err);
      toast.error("Erro ao carregar dados do pedido");
    }
  }, [orderId, navState?.accessToken]);

  // Criar pagamento no Mercado Pago
  const createMercadoPagoPayment = useCallback(async () => {
    if (!orderId || !orderData) {
      console.log("[MercadoPagoPayment] Aguardando dados:", { orderId, orderData: !!orderData });
      return;
    }

    setLoading(true);
    setPaymentStatus("waiting");
    hasShownExpiredToast.current = false;

    try {
      console.log("[MercadoPagoPayment] Criando pagamento Mercado Pago:", { 
        orderId, 
        amount: orderData.amount_cents / 100,
        orderData 
      });

      const { data, error } = await supabase.functions.invoke("mercadopago-create-payment", {
        body: { 
          orderId,
          amount: orderData.amount_cents / 100,
          payerEmail: orderData.customer_email,
          payerName: orderData.customer_name,
          paymentMethod: orderData.payment_method || 'pix'
        },
      });

      console.log("[MercadoPagoPayment] Resposta da Edge Function:", { data, error });

      if (error) {
        console.error("[MercadoPagoPayment] Erro da Edge Function:", error);
        console.error("[MercadoPagoPayment] Erro completo (JSON):", JSON.stringify(error, null, 2));
        throw new Error(error.message || "Erro ao criar pagamento");
      }
      
      // Se data tem error, logar também
      if (data && !data.success && data.error) {
        console.error("[MercadoPagoPayment] Erro retornado pela função:", data.error);
      }

      if (!data?.success) {
        console.error("[MercadoPagoPayment] Resposta não OK:", data);
        throw new Error(data?.error || "Erro ao criar pagamento");
      }

      // ✅ CORREÇÃO: Acessando a estrutura de dados aninhada (data.data)
      if (!data?.data?.paymentId) {
        console.error("[MercadoPagoPayment] Sem dados do pagamento na resposta aninhada:", data);
        throw new Error("Dados do pagamento não retornados pela função");
      }

      const paymentData = data.data;
      console.log("[MercadoPagoPayment] Pagamento criado com sucesso:", paymentData);
      
      setPaymentId(paymentData.paymentId.toString());
      
      // Se for PIX, extrair QR Code
      if (paymentData.pix) {
        setQrCode(paymentData.pix.qrCode || "");
        setQrCodeBase64(paymentData.pix.qrCodeBase64 || "");
        console.log("[MercadoPagoPayment] QR Code configurado:", { 
          hasQrCode: !!paymentData.pix.qrCode, 
          hasQrCodeBase64: !!paymentData.pix.qrCodeBase64 
        });
      }
      
      // Definir expiração em 15 minutos
      expiresAt.current = Date.now() + 15 * 60 * 1000;
      setTimeRemaining(900); // 15:00
      
      setLoading(false);
      toast.success("QR Code gerado com sucesso!");
    } catch (err: unknown) {
      console.error("[MercadoPagoPayment] Erro ao criar pagamento:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao gerar QR Code");
      setLoading(false);
    }
  }, [orderId, orderData]);

  // Buscar dados do pedido ao montar
  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  // Criar pagamento quando orderData estiver disponível
  useEffect(() => {
    if (orderData && !qrCode && !paymentId) {
      createMercadoPagoPayment();
    }
  }, [orderData, qrCode, paymentId, createMercadoPagoPayment]);

  // Função para verificar status do pagamento
  const checkPaymentStatus = useCallback(async () => {
    if (!orderId) {
      console.log("[MercadoPagoPayment] ⚠️ Sem orderId para verificar");
      return { paid: false };
    }

    try {
      console.log("[MercadoPagoPayment] 🔍 Verificando status do pagamento:", { orderId });
      
      // Usar RPC com validação de access_token
      const accessToken = navState?.accessToken || '';
      const { data: order, error } = await supabase
        .rpc("get_order_for_payment", { 
          p_order_id: orderId,
          p_access_token: accessToken 
        })
        .single();
      
      console.log("[MercadoPagoPayment] 📡 Status do pedido:", { order, error });

      if (error) {
        console.error("[MercadoPagoPayment] ❌ Erro ao consultar status:", error);
        return { paid: false };
      }

      if (order?.status === "PAID" || order?.status === "paid") {
        setPaymentStatus("paid");
        toast.success("Pagamento confirmado!");
        return { paid: true };
      }

      return { paid: false };
    } catch (err: unknown) {
      console.error("[MercadoPagoPayment] ❌ Erro ao verificar status:", err);
      return { paid: false };
    }
  }, [orderId, navState?.accessToken]);

  // Polling de status do pagamento
  useEffect(() => {
    if (!orderId || paymentStatus === "paid" || paymentStatus === "expired") {
      return;
    }

    const interval = setInterval(async () => {
      const result = await checkPaymentStatus();
      if (result.paid) {
        clearInterval(interval);
        // Redirecionar para página de sucesso após 2 segundos
        setTimeout(() => {
          navigate(`/success/${orderId}`);
        }, 2000);
      }
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);
  }, [orderId, paymentStatus, checkPaymentStatus, navigate]);

  // Timer de expiração
  useEffect(() => {
    if (paymentStatus !== "waiting" || !qrCode) {
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt.current - now) / 1000));
      
      setTimeRemaining(remaining);
      
      if (remaining === 0 && !hasShownExpiredToast.current) {
        setPaymentStatus("expired");
        hasShownExpiredToast.current = true;
        toast.error("QR Code expirado. Gere um novo para continuar.");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStatus, qrCode]);

  // Copiar código PIX
  const handleCopyCode = () => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Formatar tempo restante
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Renderizar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Gerando QR Code...</p>
        </div>
      </div>
    );
  }

  // Renderizar erro se não tiver QR Code
  if (!qrCode && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Erro ao gerar QR Code
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Não foi possível gerar o QR Code. Por favor, tente novamente.
          </p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Card Principal */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Status do Pagamento */}
          {paymentStatus === "paid" && (
            <div className="bg-green-500 text-white p-4 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">Pagamento Confirmado!</p>
              <p className="text-sm opacity-90">Redirecionando...</p>
            </div>
          )}

          {paymentStatus === "expired" && (
            <div className="bg-red-500 text-white p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">QR Code Expirado</p>
              <p className="text-sm opacity-90">Gere um novo para continuar</p>
            </div>
          )}

          {paymentStatus === "waiting" && (
            <div className="bg-blue-500 text-white p-4 text-center">
              <Clock className="w-6 h-6 inline-block mr-2" />
              <span className="font-semibold">Aguardando Pagamento</span>
              <span className="ml-4 font-mono">{formatTime(timeRemaining)}</span>
            </div>
          )}

          {/* Conteúdo */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Pague com PIX
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Escaneie o QR Code ou copie o código
              </p>
              {orderData && (
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-4">
                  R$ {(orderData.amount_cents / 100).toFixed(2).replace('.', ',')}
                </p>
              )}
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-8">
              <div className="bg-white p-4 rounded-xl shadow-lg">
                {qrCodeBase64 ? (
                  <img 
                    src={`data:image/png;base64,${qrCodeBase64}`} 
                    alt="QR Code PIX" 
                    className="w-64 h-64"
                  />
                ) : (
                  <PushinPay.QRCanvas value={qrCode} size={256} />
                )}
              </div>
            </div>

            {/* Código PIX */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código PIX Copia e Cola
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={qrCode}
                    readOnly
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                  <button
                    onClick={handleCopyCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleCopyCode}
                className="w-full"
                size="lg"
              >
                {copied ? "Código Copiado!" : "Copiar Código PIX"}
              </Button>
            </div>

            {/* Instruções */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Como pagar:
              </h3>
              <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>1. Abra o app do seu banco</li>
                <li>2. Escolha pagar com PIX</li>
                <li>3. Escaneie o QR Code ou cole o código</li>
                <li>4. Confirme o pagamento</li>
                <li>5. Pronto! Você receberá o acesso por e-mail</li>
              </ol>
            </div>

            {/* Informações do Pedido */}
            {orderData && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Pedido:</span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    #{orderId?.slice(0, 8)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600 dark:text-gray-400">Cliente:</span>
                  <span className="text-gray-900 dark:text-white">
                    {orderData.customer_name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Pagamento processado via Mercado Pago</p>
          <p className="mt-1">Ambiente seguro e protegido</p>
        </div>
      </div>
    </div>
  );
};
