import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Copy, CheckCircle2, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as PushinPay from "@/integrations/gateways/pushinpay";
import { sendUTMifyConversion, formatDateForUTMify } from "@/lib/utmify-helper";

// Interface para os dados que vêm do usePaymentGateway via navigation state
interface PixNavigationState {
  qrCode?: string;
  qrCodeBase64?: string;
  qrCodeText?: string; // Asaas usa qrCodeText para o código PIX copia e cola
  amount?: number;
  accessToken?: string;
  gateway?: 'mercadopago' | 'pushinpay' | 'asaas' | 'stripe';
}

export const PixPaymentPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Dados que podem vir do navigation state (fluxo Mercado Pago)
  const navState = location.state as PixNavigationState | null;
  
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState("");
  const [qrCodeImageBase64, setQrCodeImageBase64] = useState<string | null>(null);
  const [pixId, setPixId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"waiting" | "paid" | "expired">("waiting");
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(900); // 15 minutos = 900 segundos
  const [orderData, setOrderData] = useState<any>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [gateway, setGateway] = useState<'mercadopago' | 'pushinpay' | 'asaas' | 'stripe' | null>(null);
  
  const hasShownExpiredToast = useRef(false);
  const expiresAt = useRef<number>(0);
  const hasInitialized = useRef(false);

  // Buscar dados do pedido usando RPC com validação de access_token
  const fetchOrderData = useCallback(async (retryCount = 0) => {
    const accessToken = navState?.accessToken;
    
    if (!accessToken) {
      console.error("[PixPaymentPage] ⚠️ Sem access_token no navigation state");
      toast.error("Token de acesso não encontrado");
      return;
    }

    try {
      console.log(`[PixPaymentPage] Buscando pedido via RPC (tentativa ${retryCount + 1}):`, orderId);
      
      const { data: order, error } = await supabase
        .rpc("get_order_for_payment", { 
          p_order_id: orderId,
          p_access_token: accessToken 
        })
        .single();

      if (error || !order) {
        if (retryCount < 3) {
          console.log(`[PixPaymentPage] Pedido não encontrado, tentando novamente em 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchOrderData(retryCount + 1);
        }
        throw new Error(error?.message || "Pedido não encontrado ou token inválido");
      }
      
      console.log("[PixPaymentPage] Pedido encontrado via RPC:", order);
      setOrderData(order);
    } catch (err: any) {
      console.error("[PixPaymentPage] Erro ao buscar pedido:", err);
      toast.error("Erro ao carregar dados do pedido");
    }
  }, [orderId, navState?.accessToken]);

  // Verificar se veio QR code do Mercado Pago via navigation state
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    console.log("[PixPaymentPage] Inicializando...", { navState, orderId });

    // Se veio QR code do Mercado Pago, Asaas ou Stripe
    if (navState?.qrCode || navState?.qrCodeText) {
      const gatewayType = navState.gateway || 'mercadopago';
      console.log(`[PixPaymentPage] ✅ QR Code recebido via navigation state (${gatewayType})`);
      
      // Separar lógica de texto copia e cola vs imagem base64
      if (gatewayType === 'asaas') {
        // Asaas retorna qrCodeText = payload EMV (copia e cola)
        // e qrCode = encodedImage base64 (imagem)
        setQrCode(navState.qrCodeText || '');
        setQrCodeImageBase64(navState.qrCode || null);
      } else if (gatewayType === 'mercadopago') {
        // Mercado Pago pode retornar qrCode (texto) e qrCodeBase64 (imagem)
        setQrCode(navState.qrCode || '');
        setQrCodeImageBase64(navState.qrCodeBase64 || null);
      } else {
        // Outros gateways (PushinPay, Stripe)
        setQrCode(navState.qrCode || navState.qrCodeText || '');
      }
      
      setGateway(gatewayType as any);
      setLoading(false);
      
      // Definir expiração em 15 minutos
      expiresAt.current = Date.now() + 15 * 60 * 1000;
      setTimeRemaining(900);
      
      toast.success("QR Code gerado com sucesso!");
      
      // Ainda buscar dados do pedido para exibição
      fetchOrderData();
    } else {
      // Fluxo antigo: usar PushinPay para criar o PIX
      console.log("[PixPaymentPage] Sem QR code no state, buscando dados do pedido...");
      setGateway('pushinpay');
      fetchOrderData();
    }
  }, [navState, orderId, fetchOrderData]);

  // Criar cobrança PIX via PushinPay (apenas se não veio QR do Mercado Pago)
  const createPixCharge = useCallback(async () => {
    // Se já tem QR code (veio do Mercado Pago), não criar novamente
    if (qrCode) {
      console.log("[PixPaymentPage] QR code já existe, não criando novo");
      return;
    }
    
    if (!orderId || !orderData) {
      console.log("[PixPaymentPage] Aguardando dados:", { orderId, orderData: !!orderData });
      return;
    }

    setLoading(true);
    setPaymentStatus("waiting");
    hasShownExpiredToast.current = false;

    try {
      console.log("[PixPaymentPage] Criando cobrança PIX via PushinPay:", { 
        orderId, 
        valueInCents: orderData.amount_cents,
      });

      const { data, error } = await supabase.functions.invoke("pushinpay-create-pix", {
        body: { orderId, valueInCents: orderData.amount_cents },
      });

      console.log("[PixPaymentPage] Resposta da Edge Function:", { data, error });

      if (error) {
        console.error("[PixPaymentPage] Erro da Edge Function:", error);
        throw new Error(error.message || "Erro ao criar cobrança PIX");
      }

      if (!data?.ok) {
        console.error("[PixPaymentPage] Resposta não OK:", data);
        throw new Error(data?.error || "Erro ao criar cobrança PIX");
      }

      if (!data?.pix) {
        console.error("[PixPaymentPage] Sem dados do PIX:", data);
        throw new Error("Dados do PIX não retornados");
      }

      const { pix } = data;
      console.log("[PixPaymentPage] PIX criado com sucesso:", pix);
      
      setPixId(pix.id || pix.pix_id || "");
      setQrCode(pix.qr_code || pix.qrcode || pix.emv || "");
      
      // Definir expiração em 15 minutos
      expiresAt.current = Date.now() + 15 * 60 * 1000;
      setTimeRemaining(900);
      
      setLoading(false);
      toast.success("QR Code gerado com sucesso!");
    } catch (err: any) {
      console.error("[PixPaymentPage] Erro ao criar PIX:", err);
      toast.error(err.message || "Erro ao gerar QR Code");
      setLoading(false);
    }
  }, [orderId, orderData, qrCode]);

  // Criar cobrança quando orderData estiver disponível e não tiver QR code
  useEffect(() => {
    if (orderData && !qrCode && gateway === 'pushinpay') {
      createPixCharge();
    }
  }, [orderData, qrCode, gateway, createPixCharge]);

  // Função para verificar status do pagamento
  const checkPaymentStatus = useCallback(async () => {
    if (!orderId) {
      console.log("[PixPaymentPage] ⚠️ Sem orderId para verificar");
      return { paid: false };
    }

    try {
      console.log("[PixPaymentPage] 🔍 Verificando status do pagamento:", { gateway, orderId });
      
      // Para Mercado Pago: usar RPC com validação de access_token
      if (gateway === 'mercadopago') {
        const accessToken = navState?.accessToken || '';
        const { data: order, error } = await supabase
          .rpc("get_order_for_payment", { 
            p_order_id: orderId,
            p_access_token: accessToken 
          })
          .single();

        if (error) {
          console.error("[PixPaymentPage] ❌ Erro ao consultar status:", error);
          throw new Error("Erro ao verificar status do pagamento");
        }

        console.log("[PixPaymentPage] 📡 Status do pedido (Mercado Pago):", order);

        const status = order?.status?.toUpperCase();
        if (status === "PAID" || status === "APPROVED") {
          setPaymentStatus("paid");
          toast.success("Pagamento confirmado!");
          
          // Redirecionar para página de sucesso após 2 segundos
          setTimeout(() => {
            navigate(`/success/${orderId}`);
          }, 2000);
          
          return { paid: true };
        }
        
        return { paid: false };
      }
      
      // Para PushinPay: usar Edge Function
      
      // Para Asaas e Stripe: usar RPC com validação de access_token (mesmo fluxo do Mercado Pago)
      if (gateway === 'asaas' || gateway === 'stripe') {
        const accessToken = navState?.accessToken || '';
        const { data: order, error } = await supabase
          .rpc("get_order_for_payment", { 
            p_order_id: orderId,
            p_access_token: accessToken 
          })
          .single();

        if (error) {
          console.error(`[PixPaymentPage] ❌ Erro ao consultar status (${gateway}):`, error);
          throw new Error("Erro ao verificar status do pagamento");
        }

        console.log(`[PixPaymentPage] 📡 Status do pedido (${gateway}):`, order);

        const status = order?.status?.toUpperCase();
        if (status === "PAID" || status === "APPROVED") {
          setPaymentStatus("paid");
          toast.success("Pagamento confirmado!");
          
          // Redirecionar para página de sucesso após 2 segundos
          setTimeout(() => {
            navigate(`/success/${orderId}`);
          }, 2000);
          
          return { paid: true };
        }
        
        return { paid: false };
      }
      
      // Para PushinPay: usar Edge Function
      if (!pixId) {
        console.log("[PixPaymentPage] ⚠️ Sem pixId para verificar (PushinPay)");
        return { paid: false };
      }

      const { data, error } = await supabase.functions.invoke("pushinpay-get-status", {
        body: { orderId }
      });
      
      console.log("[PixPaymentPage] 📡 Resposta do pushinpay-get-status:", { data, error });

      if (error) {
        console.error("[PixPaymentPage] ❌ Erro ao consultar status:", error);
        throw new Error(error.message || "Erro ao conectar com o servidor");
      }

      // Se o backend retornar ok: false, analisamos a mensagem
      if (data && data.ok === false) {
        console.error("[PixPaymentPage] ⚠️ Resposta de erro do backend:", data);
        
        const msg = (data.error || "").toString().toLowerCase();
        
        // Se parecer "não encontrado" ou "not found" ou "pending", tratamos como não pago ainda
        if (msg.includes("could not be found") || msg.includes("não foi gerado") || msg.includes("not found") || msg.includes("pending")) {
          console.log("[PixPaymentPage] ℹ️ PIX não encontrado ou pendente - tratando como não pago");
          return { paid: false };
        }
        
        // Demais casos são considerados erro técnico
        throw new Error(data.error || "Erro desconhecido ao verificar pagamento");
      }

      if (data?.status?.status === "paid") {
        setPaymentStatus("paid");
        toast.success("Pagamento confirmado!");
        
        // Atualizar status na UTMify para "paid"
        if (orderData) {
          // Transformar product (singular) em products (array)
          const productsArray = orderData.product ? [{
            id: orderData.product.id,
            name: orderData.product.name,
            priceInCents: orderData.amount_cents || 0,
            quantity: 1
          }] : [];
          
          const productId = orderData.product?.id || orderData.product_id || null;
          
          console.log("[UTMify] Enviando conversão com productId:", productId, "products:", productsArray);
          
          sendUTMifyConversion(
            orderData.vendor_id,
            {
              orderId: orderId!,
              paymentMethod: "pix",
              status: "paid",
              createdAt: formatDateForUTMify(orderData.created_at || new Date()),
              approvedDate: formatDateForUTMify(new Date()),
              refundedAt: null,
              customer: {
                name: orderData.customer_name || "",
                email: orderData.customer_email || "",
                phone: orderData.customer_phone || null,
                document: orderData.customer_document || null,
                country: "BR",
                ip: "0.0.0.0"
              },
              products: productsArray,
              trackingParameters: orderData.tracking_parameters || {},
              totalPriceInCents: orderData.amount_cents || 0,
              commission: {
                totalPriceInCents: orderData.amount_cents || 0,
                gatewayFeeInCents: 0,
                userCommissionInCents: orderData.amount_cents || 0,
                currency: "BRL"
              },
              isTest: false
            },
            "purchase_approved",
            productId
          ).catch(err => {
            console.error("[UTMify] Não foi possível atualizar status:", err);
          });
        }
        
        // Redirecionar para página de sucesso após 2 segundos
        setTimeout(() => {
          navigate(`/success/${orderId}`);
        }, 2000);
        
        return { paid: true };
      } else if (data?.status?.status === "expired" || data?.status?.status === "canceled") {
        setPaymentStatus("expired");
        setTimeRemaining(0);
        return { paid: false };
      }
      
      return { paid: false };
    } catch (err: any) {
      console.error("[PixPaymentPage] ❌ Erro capturado ao verificar status:", err);
      // Não mostrar toast aqui, deixar para o botão lidar com isso
      throw err; // Re-lançar para o botão capturar e mostrar toast
    }
  }, [gateway, pixId, orderId, orderData, navigate]);

  // Polling automático do status do pagamento a cada 10 segundos
  useEffect(() => {
    // Para Mercado Pago não precisamos de pixId, só de orderId e qrCode
    const canPoll = gateway === 'mercadopago' 
      ? (qrCode && paymentStatus === "waiting" && timeRemaining > 0)
      : (pixId && paymentStatus === "waiting" && timeRemaining > 0);
    
    if (!canPoll) return;

    const poll = async () => {
      try {
        await checkPaymentStatus();
      } catch (e) {
        // Silenciar erros do polling automático
      }
    };

    // Verificação automática a cada 10 segundos
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [gateway, qrCode, pixId, paymentStatus, timeRemaining, checkPaymentStatus]);

  // Countdown: 15min -> 8min (sempre), abaixo de 8min (só quando na página)
  useEffect(() => {
    if (timeRemaining <= 0 || paymentStatus !== "waiting") return;

    const THRESHOLD = 480; // 8 minutos em segundos

    // Referência para o intervalo
    let intervalRef: { current: NodeJS.Timeout | null } = { current: null };

    // Função para iniciar/retomar contagem
    const startCountdown = () => {
      if (intervalRef.current) return; // Já está rodando
      
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          
          if (newTime <= 0) {
            setPaymentStatus("expired");
            if (!hasShownExpiredToast.current) {
              toast.error("QR Code expirado!");
              hasShownExpiredToast.current = true;
            }
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    };

    // Função para pausar contagem
    const pauseCountdown = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Função para verificar se a página está visível
    const handleVisibilityChange = () => {
      // Só pausa se estiver ABAIXO de 8 minutos
      if (timeRemaining <= THRESHOLD) {
        if (document.hidden) {
          // Página ficou oculta, pausar contador
          pauseCountdown();
        } else {
          // Página ficou visível, retomar contador
          if (timeRemaining > 0 && paymentStatus === "waiting") {
            startCountdown();
          }
        }
      }
    };

    // Iniciar contador
    // Se acima de 8min: sempre conta
    // Se abaixo de 8min: só conta se página visível
    if (timeRemaining > THRESHOLD) {
      startCountdown();
    } else {
      if (!document.hidden) {
        startCountdown();
      }
    }

    // Adicionar listener para mudanças de visibilidade
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      pauseCountdown();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [timeRemaining, paymentStatus]);

  // Polling automático para verificar status do pagamento a cada 5 segundos
  useEffect(() => {
    // Só fazer polling se estiver aguardando pagamento e tiver QR code
    if (paymentStatus !== "waiting" || !qrCode) {
      return;
    }

    console.log("[PixPaymentPage] 🔄 Iniciando polling automático de status");

    // Primeira verificação após 5 segundos (dar tempo pro usuário pagar)
    const initialTimeout = setTimeout(() => {
      checkPaymentStatus().catch(err => {
        console.error("[PixPaymentPage] Erro no polling inicial:", err);
      });
    }, 5000);

    // Polling a cada 5 segundos após a primeira verificação
    const pollingInterval = setInterval(() => {
      checkPaymentStatus().catch(err => {
        console.error("[PixPaymentPage] Erro no polling:", err);
      });
    }, 5000);

    // Cleanup: parar polling quando componente desmontar ou status mudar
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(pollingInterval);
      console.log("[PixPaymentPage] 🛑 Polling automático parado");
    };
  }, [paymentStatus, qrCode, checkPaymentStatus]);

  // Copiar código PIX
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erro ao copiar código");
    }
  };

  // Formatar tempo MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular porcentagem da barra de progresso
  const progressPercentage = (timeRemaining / 900) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-white">Gerando código PIX...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Botão Voltar */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white hover:text-gray-300 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar e editar o pedido</span>
        </button>

        {/* Card principal */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {paymentStatus === "paid" ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">Pagamento confirmado!</h2>
              <p className="text-gray-600">Redirecionando...</p>
            </div>
          ) : paymentStatus === "expired" ? (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">QR Code expirado</h2>
              <p className="text-gray-600">O tempo limite de 15 minutos foi atingido.</p>
              <Button onClick={createPixCharge} size="lg">
                Gerar novo QR Code
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Aqui está o PIX copia e cola
              </h1>

              <p className="text-gray-700 mb-6 text-center">
                Copie o código ou use a câmera para ler o QR Code e realize o pagamento no app do seu banco.
              </p>

              {/* Código PIX com botão Copiar */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrCode}
                    readOnly
                    className="flex-1 rounded-md border border-gray-300 bg-green-50 px-4 py-3 text-sm font-mono text-gray-900"
                  />
                  <Button
                    onClick={copyToClipboard}
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white px-6"
                    size="lg"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>


              {/* Botão Verificar agora (opcional) */}
              <Button
                onClick={async () => {
                  console.log("[PixPaymentPage] 🔍 Botão verificar agora clicado");
                  setCheckingPayment(true);
                  
                  try {
                    const result = await checkPaymentStatus();
                    
                    if (!result.paid) {
                      console.log("[PixPaymentPage] ⏳ Pagamento ainda não confirmado");
                      toast.info(
                        "Pagamento ainda não confirmado. Aguarde alguns segundos após pagar.",
                        { duration: 4000 }
                      );
                    }
                  } catch (err: any) {
                    console.error("[PixPaymentPage] ❌ Erro ao verificar pagamento:", err);
                    const errorMsg = err?.message || "Erro ao verificar pagamento. Tente novamente.";
                    toast.error(errorMsg, { duration: 5000 });
                  } finally {
                    setCheckingPayment(false);
                  }
                }}
                disabled={checkingPayment}
                variant="outline"
                className="w-full mb-6 disabled:opacity-50"
                size="lg"
              >
                {checkingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Verificar agora
                  </>
                )}
              </Button>

              {/* Barra de progresso com texto */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  Faltam <strong>{formatTime(timeRemaining)}</strong> minutos para o pagamento expirar...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gray-900 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* QR Code em card separado */}
              <div className="flex justify-center mb-8">
                <div className="p-6 bg-white border-2 border-gray-200 rounded-lg shadow-md">
                  {qrCodeImageBase64 ? (
                    // Se temos imagem base64 (Asaas, Mercado Pago), renderizar diretamente
                    <img 
                      src={`data:image/png;base64,${qrCodeImageBase64}`}
                      alt="QR Code PIX"
                      width={280}
                      height={280}
                      className="rounded-lg"
                    />
                  ) : (
                    // Se não temos imagem, gerar QR a partir do texto (PushinPay, etc)
                    <PushinPay.QRCanvas value={qrCode} size={280} />
                  )}
                </div>
              </div>

              {/* Instruções */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900">Para realizar o pagamento:</h3>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    <span>Abra o aplicativo do seu banco.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    <span>
                      Escolha a opção PIX e cole o código ou use a câmera do celular para pagar com QR Code.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    <span>Confirme as informações e finalize o pagamento.</span>
                  </li>
                </ol>
              </div>
            </>
          )}
        </div>


      </div>
    </div>
  );
};

export default PixPaymentPage;
