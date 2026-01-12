import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Database, Lock, Eye, UserX, Mail, FileText, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PoliticaDePrivacidade = () => {
  const sections = [
    { icon: <FileText className="w-5 h-5" />, title: "Introdução", id: "introducao" },
    { icon: <Database className="w-5 h-5" />, title: "Dados Coletados", id: "dados-coletados" },
    { icon: <Eye className="w-5 h-5" />, title: "Uso dos Dados", id: "uso-dados" },
    { icon: <Lock className="w-5 h-5" />, title: "Proteção dos Dados", id: "protecao" },
    { icon: <Shield className="w-5 h-5" />, title: "Seus Direitos", id: "direitos" },
    { icon: <UserX className="w-5 h-5" />, title: "Direito ao Esquecimento", id: "esquecimento" },
    { icon: <Database className="w-5 h-5" />, title: "Retenção de Dados", id: "retencao" },
    { icon: <Mail className="w-5 h-5" />, title: "Contato", id: "contato" },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/50 mb-4">
            Política de Privacidade
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Atualizado em 12 de janeiro de 2026
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Índice */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-8 bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Índice</h3>
              <nav className="space-y-2">
                {sections.map((section, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToSection(section.id)}
                    className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-primary/10 transition-colors group"
                  >
                    <div className="text-muted-foreground group-hover:text-primary transition-colors">
                      {section.icon}
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {section.title}
                    </span>
                  </button>
                ))}
              </nav>

              {/* CTA Direito ao Esquecimento */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Deseja exercer seu direito ao esquecimento?
                </p>
                <Link to="/lgpd/esquecimento">
                  <Button variant="outline" size="sm" className="w-full">
                    <UserX className="w-4 h-4 mr-2" />
                    Solicitar Exclusão
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Conteúdo Principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-8">
              <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  
                  {/* Introdução */}
                  <section id="introducao" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <FileText className="w-7 h-7 text-primary" />
                      1. Introdução
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <p>
                        A RiseCheckout ("nós", "nosso" ou "nossa") está comprometida com a proteção da privacidade e dos dados pessoais de nossos usuários. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                      </p>
                      <p>
                        Ao utilizar nossa plataforma, você concorda com as práticas descritas nesta política. Recomendamos a leitura atenta deste documento.
                      </p>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 my-4">
                        <p className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          Nosso Compromisso
                        </p>
                        <p className="text-sm mt-2">
                          Tratamos seus dados com o máximo cuidado e transparência. Você tem total controle sobre suas informações e pode exercer seus direitos a qualquer momento.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Dados Coletados */}
                  <section id="dados-coletados" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <Database className="w-7 h-7 text-primary" />
                      2. Dados que Coletamos
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <p className="font-semibold text-foreground">2.1. Dados fornecidos por você:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Dados de identificação:</strong> Nome completo, CPF/CNPJ, email, telefone</li>
                        <li><strong>Dados de pagamento:</strong> Informações de cartão de crédito (processadas por gateways seguros), dados bancários para recebimentos</li>
                        <li><strong>Dados de conta:</strong> Credenciais de acesso, preferências de configuração</li>
                      </ul>

                      <p className="font-semibold text-foreground mt-6">2.2. Dados coletados automaticamente:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Dados de navegação:</strong> Endereço IP, tipo de navegador, páginas visitadas, tempo de acesso</li>
                        <li><strong>Dados de dispositivo:</strong> Sistema operacional, resolução de tela, idioma</li>
                        <li><strong>Dados de transação:</strong> Histórico de compras, status de pagamentos</li>
                        <li><strong>Dados de marketing:</strong> Parâmetros UTM, origem do tráfego</li>
                      </ul>
                    </div>
                  </section>

                  {/* Uso dos Dados */}
                  <section id="uso-dados" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <Eye className="w-7 h-7 text-primary" />
                      3. Como Usamos seus Dados
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <p>Utilizamos seus dados pessoais para as seguintes finalidades:</p>
                      
                      <div className="space-y-3">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">Processamento de Pagamentos</p>
                          <p className="text-sm">Processar suas compras e transferir valores para vendedores e afiliados.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">Prestação de Serviços</p>
                          <p className="text-sm">Fornecer acesso aos produtos adquiridos, gerenciar sua conta e oferecer suporte.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">Comunicações</p>
                          <p className="text-sm">Enviar notificações sobre suas compras, atualizações de produtos e comunicações importantes.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">Segurança e Prevenção a Fraudes</p>
                          <p className="text-sm">Detectar e prevenir atividades fraudulentas, proteger sua conta e nossos sistemas.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">Obrigações Legais</p>
                          <p className="text-sm">Cumprir obrigações fiscais, legais e regulatórias aplicáveis.</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Proteção dos Dados */}
                  <section id="protecao" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <Lock className="w-7 h-7 text-primary" />
                      4. Proteção dos seus Dados
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <p>Implementamos medidas técnicas e organizacionais robustas para proteger seus dados:</p>
                      
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Criptografia:</strong> Dados sensíveis são criptografados em trânsito (TLS 1.3) e em repouso (AES-256)</li>
                        <li><strong>Controle de Acesso:</strong> Acesso restrito baseado em papéis (RBAC) e autenticação multi-fator</li>
                        <li><strong>Monitoramento:</strong> Sistemas de detecção de intrusão e auditoria contínua</li>
                        <li><strong>Backup:</strong> Backups regulares com retenção segura</li>
                        <li><strong>Conformidade:</strong> Infraestrutura em conformidade com padrões de segurança internacionais</li>
                      </ul>

                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 my-4">
                        <p className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                          <Lock className="w-5 h-5" />
                          Dados de Pagamento
                        </p>
                        <p className="text-sm mt-2">
                          Não armazenamos dados completos de cartão de crédito. Os pagamentos são processados por gateways certificados PCI-DSS (Mercado Pago, Stripe, Asaas).
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Seus Direitos */}
                  <section id="direitos" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <Shield className="w-7 h-7 text-primary" />
                      5. Seus Direitos (LGPD)
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <p>Conforme a LGPD, você tem os seguintes direitos sobre seus dados pessoais:</p>
                      
                      <div className="grid gap-3">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">✓ Confirmação e Acesso</p>
                          <p className="text-sm">Confirmar a existência de tratamento e acessar seus dados.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">✓ Correção</p>
                          <p className="text-sm">Solicitar a correção de dados incompletos, inexatos ou desatualizados.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">✓ Anonimização, Bloqueio ou Eliminação</p>
                          <p className="text-sm">Solicitar a anonimização ou eliminação de dados desnecessários.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">✓ Portabilidade</p>
                          <p className="text-sm">Obter seus dados em formato estruturado para transferência.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">✓ Informação sobre Compartilhamento</p>
                          <p className="text-sm">Saber com quais entidades seus dados foram compartilhados.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">✓ Revogação de Consentimento</p>
                          <p className="text-sm">Revogar consentimentos previamente fornecidos.</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Direito ao Esquecimento */}
                  <section id="esquecimento" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <UserX className="w-7 h-7 text-primary" />
                      6. Direito ao Esquecimento
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <p>
                        Você tem o direito de solicitar a eliminação dos seus dados pessoais. Implementamos um sistema automatizado para facilitar este processo.
                      </p>

                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 my-4">
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                          <UserX className="w-5 h-5 text-primary" />
                          Como Solicitar
                        </h3>
                        <ol className="list-decimal pl-6 space-y-2 text-sm">
                          <li>Acesse nossa página de solicitação LGPD</li>
                          <li>Informe o email associado às suas compras</li>
                          <li>Você receberá um email de confirmação com um link válido por 24 horas</li>
                          <li>Clique no link para confirmar a exclusão</li>
                          <li>Seus dados serão anonimizados imediatamente</li>
                        </ol>
                        <div className="mt-4">
                          <Link to="/lgpd/esquecimento">
                            <Button className="w-full sm:w-auto">
                              <UserX className="w-4 h-4 mr-2" />
                              Solicitar Exclusão de Dados
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 my-4">
                        <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          Importante
                        </p>
                        <p className="text-sm mt-2">
                          Alguns dados são mantidos por obrigação legal (ex: dados fiscais por 5 anos conforme Art. 173 do CTN). Estes dados são anonimizados mas não podem ser completamente eliminados.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Retenção de Dados */}
                  <section id="retencao" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <Database className="w-7 h-7 text-primary" />
                      7. Retenção de Dados
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <p>Mantemos seus dados pelo período necessário para cumprir as finalidades descritas nesta política:</p>
                      
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border border-border p-3 text-left text-foreground">Tipo de Dado</th>
                            <th className="border border-border p-3 text-left text-foreground">Período</th>
                            <th className="border border-border p-3 text-left text-foreground">Justificativa</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-border p-3">Dados de conta</td>
                            <td className="border border-border p-3">Enquanto ativa</td>
                            <td className="border border-border p-3">Prestação do serviço</td>
                          </tr>
                          <tr>
                            <td className="border border-border p-3">Dados de transação</td>
                            <td className="border border-border p-3">5 anos</td>
                            <td className="border border-border p-3">Obrigação fiscal (CTN)</td>
                          </tr>
                          <tr>
                            <td className="border border-border p-3">Logs de acesso</td>
                            <td className="border border-border p-3">6 meses</td>
                            <td className="border border-border p-3">Marco Civil da Internet</td>
                          </tr>
                          <tr>
                            <td className="border border-border p-3">Dados de marketing</td>
                            <td className="border border-border p-3">Até revogação</td>
                            <td className="border border-border p-3">Consentimento</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Contato */}
                  <section id="contato" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <Mail className="w-7 h-7 text-primary" />
                      8. Contato
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <p>Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:</p>
                      
                      <div className="bg-muted/50 rounded-lg p-6">
                        <p className="font-semibold text-foreground mb-2">Encarregado de Proteção de Dados (DPO)</p>
                        <p className="text-sm">Email: privacidade@risecheckout.com</p>
                        <p className="text-sm mt-4 text-muted-foreground">
                          Responderemos sua solicitação em até 15 dias úteis, conforme estabelecido pela LGPD.
                        </p>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-4">
                        <Link to="/termos-de-uso">
                          <Button variant="outline">
                            <FileText className="w-4 h-4 mr-2" />
                            Termos de Uso
                          </Button>
                        </Link>
                        <Link to="/lgpd/esquecimento">
                          <Button variant="outline">
                            <UserX className="w-4 h-4 mr-2" />
                            Direito ao Esquecimento
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </section>

                </div>
              </ScrollArea>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PoliticaDePrivacidade;
