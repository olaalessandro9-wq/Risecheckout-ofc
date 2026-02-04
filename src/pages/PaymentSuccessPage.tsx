/**
 * PaymentSuccessPage - Página de sucesso de pagamento
 * 
 * @version 3.0.0 - RISE Protocol V3 - UTMify centralizado aqui
 * 
 * SSOT para tracking de compra: Dispara UTMify para TODOS os gateways
 * (Cartão, PIX MercadoPago, PIX Asaas, PIX Stripe, PIX PushinPay)
 * 
 * MIGRATED: Uses api.publicCall() instead of supabase.functions.invoke()
 * @see RISE Protocol V3 - Zero database access from frontend
 */

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Mail, MessageCircle, Copy, Check, Package, ShoppingBag, GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import { publicApi } from "@/lib/api/public-client";
import { Button } from "@/components/ui/button";
import { createLogger } from "@/lib/logger";
import { SuccessThemeProvider } from "@/components/theme-providers";
import { sendUTMifyConversion, formatDateForUTMify } from "@/integrations/tracking/utmify";

const log = createLogger("PaymentSuccessPage");

interface OrderDetailsResponse {
  data?: OrderDetails;
  error?: string;
}

interface StudentsInviteResponse {
  accessUrl?: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  amount_cents: number;
  is_bump: boolean;
  quantity: number;
}

interface TrackingParameters {
  src: string | null;
  sck: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

interface OrderDetails {
  id: string;
  product_id: string;
  product_name: string | null;
  amount_cents: number;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone?: string | null;
  customer_document?: string | null;
  customer_ip?: string | null;
  order_items: OrderItem[];
  coupon_code: string | null;
  discount_amount_cents: number | null;
  payment_method?: string | null;
  vendor_id?: string | null;
  created_at?: string | null;
  tracking_parameters?: TrackingParameters | null;
  product?: {
    members_area_enabled: boolean;
  };
}

export const PaymentSuccessPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [copied, setCopied] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessingMembersArea, setAccessingMembersArea] = useState(false);
  
  // RISE V3: Ref para garantir que UTMify só dispare uma vez
  const utmifyFiredRef = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchOrderDetails = async () => {
      if (!orderId || !token) {
        setLoading(false);
        return;
      }

      try {
        // Buscar pedido via Edge Function
        const { data: result, error } = await publicApi.call<OrderDetailsResponse>('checkout-public-data', {
          action: 'order-by-token',
          orderId,
          token,
        });

        if (error || result?.error) {
          log.error('Erro ao buscar pedido:', error || result?.error);
        } else if (result?.data) {
          setOrderDetails(result.data as OrderDetails);
        }
      } catch (err) {
        log.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, token]);

  // RISE V3: Disparar UTMify quando orderDetails carregar (SSOT)
  useEffect(() => {
    if (!orderDetails || utmifyFiredRef.current) return;
    if (!orderDetails.vendor_id) {
      log.debug("Sem vendor_id, não disparando UTMify");
      return;
    }

    utmifyFiredRef.current = true;

    const trackPurchase = async () => {
      log.info("🎯 Disparando UTMify para ordem:", orderId);

      try {
        await sendUTMifyConversion(
          orderDetails.vendor_id!,
          {
            orderId: orderId!,
            paymentMethod: orderDetails.payment_method || "unknown",
            status: "paid",
            createdAt: formatDateForUTMify(orderDetails.created_at || new Date()),
            approvedDate: formatDateForUTMify(new Date()),
            refundedAt: null,
            customer: {
              name: orderDetails.customer_name || "",
              email: orderDetails.customer_email || "",
              phone: orderDetails.customer_phone || null,
              document: orderDetails.customer_document || null,
              country: "BR",
              ip: orderDetails.customer_ip || "",
            },
            products: orderDetails.order_items?.map(item => ({
              id: item.id,
              name: item.product_name,
              priceInCents: item.amount_cents,
              quantity: item.quantity,
            })) || [],
            trackingParameters: orderDetails.tracking_parameters || {
              src: null,
              sck: null,
              utm_source: null,
              utm_medium: null,
              utm_campaign: null,
              utm_content: null,
              utm_term: null,
            },
            totalPriceInCents: orderDetails.amount_cents,
            commission: {
              totalPriceInCents: orderDetails.amount_cents,
              gatewayFeeInCents: 0,
              userCommissionInCents: orderDetails.amount_cents,
              currency: "BRL",
            },
            isTest: false,
          },
          "purchase_approved",
          orderDetails.product_id
        );
        log.info("✅ UTMify disparado com sucesso");
      } catch (err) {
        log.error("❌ Erro ao disparar UTMify:", err);
      }
    };

    trackPurchase();
  }, [orderDetails, orderId]);

  const handleCopyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const mainProduct = orderDetails?.order_items?.find(item => !item.is_bump);
  const orderBumps = orderDetails?.order_items?.filter(item => item.is_bump) || [];
  const hasMembersArea = orderDetails?.product?.members_area_enabled === true;

  const handleAccessMembersArea = async () => {
    if (!orderId || !orderDetails?.customer_email || !orderDetails?.product_id) return;
    
    setAccessingMembersArea(true);
    
    try {
      // Chamar edge function para gerar token de acesso
      const { data, error } = await publicApi.call<StudentsInviteResponse>('students-invite', {
        action: 'generate-purchase-access', // Action no body, não no path
        order_id: orderId,
        customer_email: orderDetails.customer_email,
        product_id: orderDetails.product_id,
      });

      if (error) {
        log.error('Erro ao gerar acesso:', error);
        // Fallback: redirecionar para login
        navigate('/minha-conta');
        return;
      }

      if (data?.accessUrl) {
        // Redirecionar para URL de acesso
        window.location.href = data.accessUrl;
      } else {
        // Fallback: redirecionar para login
        navigate('/minha-conta');
      }
    } catch (err) {
      log.error('Erro:', err);
      navigate('/minha-conta');
    } finally {
      setAccessingMembersArea(false);
    }
  };

  return (
    <SuccessThemeProvider>
      <div className="max-w-2xl w-full">
        {/* Card Principal */}
        <div className="bg-[hsl(var(--success-card-bg))] border border-[hsl(var(--success-border))] rounded-2xl overflow-hidden">
          
          {/* Header - Ícone de Sucesso */}
          <div className="flex flex-col items-center pt-16 pb-8 px-8">
            <div className="relative mb-6">
              {/* Círculo de fundo */}
              <div className="absolute inset-0 bg-[hsl(var(--success-green)/0.1)] rounded-full blur-2xl" />
              {/* Ícone */}
              <div className="relative bg-[hsl(var(--success-green)/0.1)] rounded-full p-6 border border-[hsl(var(--success-green)/0.2)]">
                <CheckCircle2 className="w-12 h-12 text-[hsl(var(--success-green))]" strokeWidth={2} />
              </div>
            </div>

            {/* Título */}
            <h1 className="text-3xl font-semibold text-[hsl(var(--success-text-primary))] mb-3 text-center">
              Pagamento Confirmado
            </h1>

            {/* Subtítulo */}
            <p className="text-[hsl(var(--success-text-secondary))] text-center max-w-md">
              Obrigado pela sua compra! Seu pedido foi processado com sucesso.
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-[hsl(var(--success-border))]" />

          {/* Conteúdo */}
          <div className="p-8 space-y-6">
            
            {/* Detalhes do Pedido - Somente se tiver token válido */}
            {orderDetails && (
              <div>
                <label className="text-xs font-medium text-[hsl(var(--success-text-muted))] uppercase tracking-wider block mb-3">
                  Detalhes do Pedido
                </label>
                
                <div className="space-y-3">
                  {/* Produto Principal */}
                  {mainProduct && (
                    <div className="bg-[hsl(var(--success-card-elevated))] border border-[hsl(var(--success-border))] rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-10 h-10 rounded-lg bg-[hsl(var(--success-border))] flex items-center justify-center">
                            <Package className="w-5 h-5 text-[hsl(var(--success-text-secondary))]" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-[hsl(var(--success-text-primary))] mb-1">
                            {mainProduct.product_name}
                          </h3>
                          <p className="text-lg font-semibold text-[hsl(var(--success-green))]">
                            {formatCurrency(mainProduct.amount_cents)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Bumps */}
                  {orderBumps.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-[hsl(var(--success-text-muted))] uppercase tracking-wider">
                        Itens Adicionais
                      </p>
                      {orderBumps.map((bump) => (
                        <div key={bump.id} className="bg-[hsl(var(--success-card-elevated))] border border-[hsl(var(--success-border))] rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--success-border))] flex items-center justify-center">
                                <ShoppingBag className="w-4 h-4 text-[hsl(var(--success-text-secondary))]" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm text-[hsl(var(--success-text-primary))]">{bump.product_name}</h4>
                            </div>
                            <p className="text-sm font-medium text-[hsl(var(--success-green))]">
                              {formatCurrency(bump.amount_cents)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Desconto do Cupom */}
                  {orderDetails.coupon_code && orderDetails.discount_amount_cents && orderDetails.discount_amount_cents > 0 && (
                    <div className="bg-[hsl(var(--success-card-elevated))] border border-[hsl(var(--success-border))] rounded-lg p-4 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[hsl(var(--success-text-secondary))]">
                          Cupom aplicado: <span className="text-[hsl(var(--success-text-primary))] font-medium">{orderDetails.coupon_code}</span>
                        </span>
                        <span className="text-sm font-medium text-[hsl(var(--success-green))]">
                          -{formatCurrency(orderDetails.discount_amount_cents)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="bg-[hsl(var(--success-card-elevated))] border border-[hsl(var(--success-green)/0.2)] rounded-lg p-4 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[hsl(var(--success-text-secondary))]">Total Pago</span>
                      <span className="text-xl font-bold text-[hsl(var(--success-green))]">
                        {formatCurrency(orderDetails.amount_cents)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Card Área de Membros */}
            {hasMembersArea && (
              <div className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[hsl(var(--success-text-primary))] mb-1">
                      Acesse seu Produto
                    </h3>
                    <p className="text-sm text-[hsl(var(--success-text-secondary))] mb-4">
                      Clique abaixo para acessar a área de membros e começar a consumir seu conteúdo.
                    </p>
                    <Button
                      onClick={handleAccessMembersArea}
                      disabled={accessingMembersArea}
                      className="bg-purple-600 hover:bg-purple-700 text-[hsl(var(--success-text-primary))]"
                    >
                      {accessingMembersArea ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Preparando acesso...
                        </>
                      ) : (
                        <>
                          Acessar minha Área de Membros
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {orderId && (
              <div>
                <label className="text-xs font-medium text-[hsl(var(--success-text-muted))] uppercase tracking-wider block mb-3">
                  Número do Pedido
                </label>
                <div className="bg-[hsl(var(--success-card-elevated))] border border-[hsl(var(--success-border))] rounded-lg p-4 flex items-center justify-between group">
                  <code className="text-sm text-[hsl(var(--success-text-code))] font-mono break-all pr-4">
                    {orderId}
                  </code>
                  <button
                    onClick={handleCopyOrderId}
                    className="flex-shrink-0 p-2 hover:bg-[hsl(var(--success-border))] rounded-lg transition-colors"
                    title="Copiar número do pedido"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-[hsl(var(--success-green))]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[hsl(var(--success-text-muted))] group-hover:text-[hsl(var(--success-text-secondary))]" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Próximos Passos */}
            <div>
              <label className="text-xs font-medium text-[hsl(var(--success-text-muted))] uppercase tracking-wider block mb-3">
                Próximos Passos
              </label>
              
              <div className="space-y-3">
                {/* Email */}
                <div className="bg-[hsl(var(--success-card-elevated))] border border-[hsl(var(--success-border))] rounded-lg p-4 hover:border-[hsl(var(--success-border-hover))] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-lg bg-[hsl(var(--success-border))] flex items-center justify-center">
                        <Mail className="w-5 h-5 text-[hsl(var(--success-text-secondary))]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-[hsl(var(--success-text-primary))] mb-1">
                        Confirmação por E-mail
                      </h3>
                      <p className="text-xs text-[hsl(var(--success-text-muted))] leading-relaxed">
                        Enviamos os detalhes do seu pedido para o e-mail cadastrado. Verifique sua caixa de entrada e spam.
                      </p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="bg-[hsl(var(--success-card-elevated))] border border-[hsl(var(--success-border))] rounded-lg p-4 hover:border-[hsl(var(--success-border-hover))] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-lg bg-[hsl(var(--success-border))] flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-[hsl(var(--success-text-secondary))]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-[hsl(var(--success-text-primary))] mb-1">
                        Confirmação por WhatsApp
                      </h3>
                      <p className="text-xs text-[hsl(var(--success-text-muted))] leading-relaxed">
                        Você também receberá uma mensagem no WhatsApp com todas as informações do seu pedido.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-8 pb-8">
            <div className="h-px bg-[hsl(var(--success-border))] mb-6" />
            <p className="text-xs text-[hsl(var(--success-text-muted))] text-center">
              Se tiver alguma dúvida, entre em contato conosco através dos canais de atendimento.
            </p>
          </div>

        </div>

        {/* Mensagem Final */}
        <div className="text-center mt-6">
          <p className="text-sm text-[hsl(var(--success-text-muted))]">
            Obrigado por confiar em nós
          </p>
        </div>
      </div>
    </SuccessThemeProvider>
  );
};

export default PaymentSuccessPage;
