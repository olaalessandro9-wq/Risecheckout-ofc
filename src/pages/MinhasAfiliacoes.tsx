import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Affiliation {
  id: string;
  commission_rate: number;
  affiliate_code: string;
  status: string;
  total_sales_count: number;
  total_sales_amount: number;
  product: {
    id: string;
    name: string;
    checkouts: {
      slug: string;
      is_default: boolean;
    }[];
  };
}

export default function MinhasAfiliacoes() {
  const navigate = useNavigate();
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasOAuth, setHasOAuth] = useState(false);
  const [oauthEmail, setOauthEmail] = useState<string | null>(null);
  const [checkingOAuth, setCheckingOAuth] = useState(true);

  useEffect(() => {
    // 1. Definição da flag de montagem (Pattern: Component Lifecycle Guard)
    let isMounted = true;

    const checkOAuthStatusAndFetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) {
            setLoading(false);
            setCheckingOAuth(false);
          }
          return;
        }

        // Buscar integração do Mercado Pago
        const { data: integration } = await supabase
          .from('vendor_integrations')
          .select('*')
          .eq('vendor_id', user.id)
          .eq('integration_type', 'MERCADOPAGO')
          .maybeSingle();

        const config = integration?.config as any;
        
        // 2. Proteção nas atualizações de estado
        if (isMounted) {
          if (integration && integration.active) {
            setHasOAuth(true);
            setOauthEmail(config?.email || user.email || null);
          } else {
            setHasOAuth(false);
            setOauthEmail(null);
          }
        }

        // SEMPRE buscar afiliações, independente do OAuth
        await fetchAffiliations(user.id, isMounted);
      } catch (error) {
        console.error('Erro ao verificar OAuth:', error);
      } finally {
        // 3. O finally também deve respeitar o ciclo de vida
        if (isMounted) {
          setCheckingOAuth(false);
          setLoading(false);
        }
      }
    };

    checkOAuthStatusAndFetchData();

    // Listener para atualizar quando conectar/desconectar Mercado Pago
    const handleOAuthChange = (event: MessageEvent) => {
      if (event.data?.type === 'mercadopago_oauth_success') {
        console.log('[MinhasAfiliacoes] Mercado Pago conectado, atualizando...');
        checkOAuthStatusAndFetchData();
      }
    };

    window.addEventListener('message', handleOAuthChange);

    // 4. Função de Cleanup (Essencial para evitar o erro de DOM)
    return () => {
      isMounted = false;
      window.removeEventListener('message', handleOAuthChange);
    };
  }, []);

  const fetchAffiliations = async (userId: string, isMounted: boolean) => {
    try {
      const { data, error } = await supabase
        .from("affiliates")
        .select(`
          id,
          commission_rate,
          affiliate_code,
          status,
          total_sales_count,
          total_sales_amount,
          product:products (
            id,
            name,
            checkouts (
              slug,
              is_default
            )
          )
        `)
        .eq("user_id", userId);

      if (error) throw error;
      
      // Proteção: só atualiza o estado se o componente ainda estiver montado
      if (isMounted) {
        setAffiliations(data as any);
      }
    } catch (error) {
      console.error("Erro ao buscar afiliações:", error);
      if (isMounted) {
        toast.error("Erro ao carregar suas afiliações.");
      }
    }
  };

  const getProductLink = (code: string, checkouts: { slug: string, is_default: boolean }[]) => {
    const defaultCheckout = checkouts.find(c => c.is_default) || checkouts[0];
    
    if (!defaultCheckout?.slug) return null;

    const baseUrl = "https://risecheckout.com";
    return `${baseUrl}/pay/${defaultCheckout.slug}?ref=${code}`;
  };

  const copyLink = (link: string | null) => {
    if (!link) {
      toast.error("Este produto não tem um checkout ativo configurado.");
      return;
    }
    navigator.clipboard.writeText(link);
    toast.success("Link de afiliado copiado!");
  };

  const handleConnectMP = () => {
    navigate('/dashboard/financeiro');
  };

  if (loading || checkingOAuth) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Afiliações</h1>
          <p className="text-muted-foreground">
            Gerencie os produtos que você promove e acompanhe seus resultados.
          </p>
        </div>
      </div>

      {/* ⚠️ Alerta de Conexão (se não tiver OAuth) */}
      {!hasOAuth && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-800 font-bold">Conexão Necessária</AlertTitle>
          <AlertDescription className="text-yellow-700">
            <p className="mb-3">
              Para gerar links de afiliado e receber suas comissões automaticamente, você precisa conectar sua conta do Mercado Pago.
            </p>
            <Button 
              variant="default" 
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={handleConnectMP}
            >
              Conectar Conta Mercado Pago
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ✅ Badge de Conta Conectada */}
      {hasOAuth && oauthEmail && (
        <Alert variant="default" className="border-green-500 bg-green-50">
          <AlertCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800 font-bold">✅ Conta Conectada</AlertTitle>
          <AlertDescription className="text-green-700">
            Conectado como: <strong>{oauthEmail}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* SEMPRE MOSTRAR PRODUTOS (com ou sem OAuth) */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Afiliados</CardTitle>
        </CardHeader>
        <CardContent>
          {affiliations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-muted-foreground mb-4">Você ainda não é afiliado de nenhum produto.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vendas</TableHead>
                  <TableHead>Faturamento</TableHead>
                  <TableHead className="text-right">Seu Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliations.map((item) => {
                  const link = getProductLink(item.affiliate_code, item.product?.checkouts || []);
                  
                  return (
                    <TableRow 
                      key={item.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/dashboard/minhas-afiliacoes/${item.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.product?.name || "Produto sem nome"}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-bold text-green-600">
                          {item.commission_rate}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'active' ? 'default' : 'outline'}>
                          {item.status === 'active' ? 'Ativo' : 
                           item.status === 'pending' ? 'Pendente' : 
                           item.status === 'rejected' ? 'Recusado' : item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.total_sales_count || 0}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((item.total_sales_amount || 0) / 100)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status === 'active' ? (
                          // Se NÃO TEM OAUTH: Mostrar aviso de conexão
                          !hasOAuth ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs text-yellow-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Conecte o Mercado Pago
                              </span>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConnectMP();
                                }}
                              >
                                Conectar Agora
                              </Button>
                            </div>
                          ) : (
                            // Se TEM OAUTH: Mostrar link normalmente
                            link ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyLink(link);
                                }}
                              >
                                <Copy className="h-4 w-4" />
                                Copiar Link
                              </Button>
                            ) : (
                              <span className="text-xs text-red-500 flex items-center justify-end gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Sem Checkout
                              </span>
                            )
                          )
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
