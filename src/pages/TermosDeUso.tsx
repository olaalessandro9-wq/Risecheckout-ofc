import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Shield, Users, CreditCard, Lock, AlertCircle } from "lucide-react";

const TermosDeUso = () => {
  const sections = [
    { icon: <FileText className="w-5 h-5" />, title: "Preâmbulo", id: "preambulo" },
    { icon: <Users className="w-5 h-5" />, title: "Definições", id: "definicoes" },
    { icon: <Shield className="w-5 h-5" />, title: "Atividade da RiseCheckout", id: "atividade" },
    { icon: <Users className="w-5 h-5" />, title: "Cadastro e Conta", id: "cadastro" },
    { icon: <AlertCircle className="w-5 h-5" />, title: "Uso da Plataforma", id: "uso" },
    { icon: <FileText className="w-5 h-5" />, title: "Produtos e Marketplace", id: "produtos" },
    { icon: <Users className="w-5 h-5" />, title: "Programa de Afiliados", id: "afiliados" },
    { icon: <CreditCard className="w-5 h-5" />, title: "Pagamentos e Comissões", id: "pagamentos" },
    { icon: <Shield className="w-5 h-5" />, title: "Propriedade Intelectual", id: "propriedade" },
    { icon: <Lock className="w-5 h-5" />, title: "Privacidade e LGPD", id: "privacidade" },
    { icon: <AlertCircle className="w-5 h-5" />, title: "Responsabilidades", id: "responsabilidades" },
    { icon: <FileText className="w-5 h-5" />, title: "Rescisão", id: "rescisao" },
    { icon: <FileText className="w-5 h-5" />, title: "Disposições Gerais", id: "disposicoes" },
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
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/50 mb-4">
            Termos de Uso
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Atualizado em 21 de dezembro de 2025
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
                  {/* Preâmbulo */}
                  <section id="preambulo" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <FileText className="w-7 h-7 text-primary" />
                      Preâmbulo
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <p className="text-lg font-semibold text-foreground">
                        Bem-vindo ao RiseCheckout!
                      </p>
                      <p>
                        Estes Termos de Uso ("Termos") regem o acesso e uso da plataforma RiseCheckout, de propriedade de [NOME DA EMPRESA], pessoa jurídica de direito privado, inscrita no CNPJ sob o nº [CNPJ], com sede em [ENDEREÇO COMPLETO], doravante denominada simplesmente "RiseCheckout", "nós" ou "nossa".
                      </p>
                      <p>
                        Ao acessar ou utilizar a Plataforma RiseCheckout, você ("Usuário", "você" ou "seu") concorda em estar vinculado a estes Termos e se compromete a cumprir todas as suas disposições. Caso não concorde com qualquer parte destes Termos, você não deve utilizar a Plataforma.
                      </p>
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 my-4">
                        <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          Leia estes Termos com atenção
                        </p>
                        <p className="text-sm mt-2 text-muted-foreground">
                          Estes Termos contêm informações importantes sobre seus direitos e obrigações, incluindo limitações de responsabilidade e renúncias de garantias.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Definições */}
                  <section id="definicoes" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <Users className="w-7 h-7 text-primary" />
                      1. Definições
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <p>Para facilitar a compreensão destes Termos, as seguintes expressões terão os significados abaixo:</p>
                      
                      <div className="space-y-3">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">1.1. Plataforma:</p>
                          <p className="text-sm">Refere-se ao site www.risecheckout.com, suas subdominios, aplicativos móveis, APIs e todos os recursos, serviços, tecnologias e software disponibilizados pelo RiseCheckout.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">1.2. Usuário:</p>
                          <p className="text-sm">Qualquer pessoa física ou jurídica que acesse ou utilize a Plataforma, incluindo Produtores, Afiliados e Compradores.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">1.3. Produtor:</p>
                          <p className="text-sm">Usuário que cria, oferece e comercializa Produtos através da Plataforma.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">1.4. Afiliado:</p>
                          <p className="text-sm">Usuário que promove e divulga Produtos de terceiros (Produtores) através da Plataforma, recebendo comissões pelas vendas realizadas.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">1.5. Comprador:</p>
                          <p className="text-sm">Usuário que adquire Produtos através da Plataforma.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">1.6. Produto:</p>
                          <p className="text-sm">Qualquer bem ou serviço, digital ou físico, oferecido para venda através da Plataforma, incluindo cursos online, e-books, softwares, consultorias, assinaturas, entre outros.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">1.7. Marketplace:</p>
                          <p className="text-sm">Ambiente da Plataforma onde Produtores listam seus Produtos para que Afiliados possam promovê-los.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">1.8. Comissão:</p>
                          <p className="text-sm">Percentual ou valor fixo que o Afiliado recebe sobre cada venda realizada através de seu link de afiliado.</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">1.9. Split de Pagamento:</p>
                          <p className="text-sm">Divisão automática do valor da venda entre Produtor, Afiliado (se aplicável) e RiseCheckout (taxas).</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-semibold text-foreground">1.10. LGPD:</p>
                          <p className="text-sm">Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Atividade da RiseCheckout */}
                  <section id="atividade" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <Shield className="w-7 h-7 text-primary" />
                      2. Da Atividade da RiseCheckout
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <div>
                        <p className="font-semibold text-foreground mb-2">2.1. Serviços Oferecidos:</p>
                        <p className="mb-3">O RiseCheckout é uma plataforma tecnológica que oferece soluções para:</p>
                        <ul className="list-disc pl-6 space-y-2">
                          <li><strong>Processamento de Pagamentos:</strong> Intermediação de transações financeiras entre Compradores e Produtores, utilizando gateways de pagamento como Mercado Pago, Stripe e outros.</li>
                          <li><strong>Checkout Personalizado:</strong> Páginas de checkout otimizadas para conversão, com recursos como order bumps, upsells, downsells e recuperação de carrinho abandonado.</li>
                          <li><strong>Marketplace de Afiliados:</strong> Ambiente onde Produtores podem listar seus Produtos e Afiliados podem encontrar oportunidades de promoção, com sistema automatizado de comissões.</li>
                          <li><strong>Gestão de Produtos:</strong> Ferramentas para criação, edição e gerenciamento de Produtos, ofertas, preços e condições de venda.</li>
                          <li><strong>Relatórios e Analytics:</strong> Painéis de controle com métricas de vendas, conversão, comissões e desempenho.</li>
                        </ul>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 my-4">
                        <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">2.2. Natureza da Relação:</p>
                        <p className="text-sm">
                          O RiseCheckout atua como intermediador tecnológico e financeiro, facilitando transações entre Usuários. <strong>O RiseCheckout não é parte da relação de compra e venda</strong> entre Produtor e Comprador, nem garante a qualidade, legalidade ou entrega dos Produtos.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">2.3. Independência dos Usuários:</p>
                        <p className="mb-2">Ao utilizar a Plataforma, você reconhece que:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Você <strong>não é empregado, representante, agente ou sócio</strong> do RiseCheckout.</li>
                          <li>Você atua em <strong>seu próprio nome e por sua conta e risco</strong>.</li>
                          <li>Você é <strong>totalmente responsável</strong> por suas atividades, obrigações fiscais, trabalhistas e legais.</li>
                        </ul>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 my-4">
                        <p className="font-semibold text-amber-700 dark:text-amber-400 mb-2">2.4. Sem Garantia de Resultados:</p>
                        <p className="text-sm">
                          O RiseCheckout <strong>não promete nem garante</strong> que você obterá qualquer rendimento, lucro, resultado ou número específico de vendas ao utilizar a Plataforma. Seu sucesso depende de múltiplos fatores, incluindo qualidade do Produto, estratégias de marketing, público-alvo e condições de mercado.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Cadastro e Conta */}
                  <section id="cadastro" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <Users className="w-7 h-7 text-primary" />
                      3. Cadastro e Conta
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <div>
                        <p className="font-semibold text-foreground mb-2">3.1. Requisitos para Cadastro:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Ser maior de 18 anos ou ter autorização legal de responsável.</li>
                          <li>Fornecer informações verdadeiras, precisas e atualizadas.</li>
                          <li>Possuir CPF ou CNPJ válido (para Produtores e Afiliados).</li>
                          <li>Concordar com estes Termos e com a Política de Privacidade.</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">3.2. Responsabilidades do Usuário:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Manter a confidencialidade</strong> de suas credenciais de acesso (login e senha).</li>
                          <li><strong>Notificar imediatamente</strong> o RiseCheckout sobre qualquer uso não autorizado de sua conta.</li>
                          <li><strong>Atualizar suas informações cadastrais</strong> sempre que houver alterações.</li>
                          <li><strong>Não compartilhar</strong> sua conta com terceiros.</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">3.3. Suspensão e Cancelamento de Conta:</p>
                        <p className="mb-2">O RiseCheckout pode, a seu exclusivo critério e sem aviso prévio:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Suspender</strong> o acesso à sua conta em caso de suspeita de fraude, violação destes Termos ou atividade ilegal.</li>
                          <li><strong>Cancelar</strong> sua conta definitivamente em caso de violações graves ou reincidentes.</li>
                          <li><strong>Reter valores</strong> pendentes até a conclusão de investigações ou resolução de disputas.</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">3.4. Exclusão de Conta pelo Usuário:</p>
                        <p>
                          Você pode solicitar a exclusão de sua conta a qualquer momento através do painel de controle ou entrando em contato com nosso suporte. A exclusão será processada em até 30 dias, respeitando obrigações legais de retenção de dados.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Uso da Plataforma */}
                  <section id="uso" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <AlertCircle className="w-7 h-7 text-primary" />
                      4. Uso da Plataforma
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <div>
                        <p className="font-semibold text-foreground mb-2">4.1. Licença de Uso:</p>
                        <p>
                          Ao aceitar estes Termos, o RiseCheckout concede a você uma licença <strong>não exclusiva, intransferível e revogável</strong> para acessar e utilizar a Plataforma, exclusivamente para os fins previstos nestes Termos.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">4.2. Restrições de Uso:</p>
                        <p className="mb-2">Você <strong>não pode</strong>:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Copiar, modificar, distribuir, vender ou alugar qualquer parte da Plataforma.</li>
                          <li>Fazer engenharia reversa ou tentar extrair o código-fonte da Plataforma.</li>
                          <li>Utilizar a Plataforma para fins ilegais, fraudulentos ou não autorizados.</li>
                          <li>Interferir ou interromper o funcionamento da Plataforma ou dos servidores.</li>
                          <li>Coletar dados de outros Usuários sem autorização.</li>
                          <li>Criar contas falsas ou utilizar bots, scripts ou automações não autorizadas.</li>
                          <li>Enviar spam, malware, vírus ou qualquer código malicioso.</li>
                          <li>Violar direitos de propriedade intelectual de terceiros.</li>
                        </ul>
                      </div>

                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 my-4">
                        <p className="font-semibold text-red-700 dark:text-red-400 mb-2">4.3. Conduta Proibida:</p>
                        <p className="text-sm mb-2">São expressamente proibidas as seguintes condutas:</p>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li><strong>Produtos Ilegais:</strong> Venda de produtos ilegais, falsificados, pirateados ou que violem direitos autorais.</li>
                          <li><strong>Conteúdo Impróprio:</strong> Produtos com conteúdo pornográfico, violento, discriminatório, difamatório ou que incitem ódio.</li>
                          <li><strong>Fraude:</strong> Práticas enganosas, falsas promessas, esquemas de pirâmide ou marketing multinível ilegal.</li>
                          <li><strong>Manipulação:</strong> Manipulação de métricas, avaliações falsas ou compra de tráfego fraudulento.</li>
                          <li><strong>Spam:</strong> Envio não autorizado de mensagens em massa ou práticas de spam.</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">4.4. Consequências de Violações:</p>
                        <p className="mb-2">Em caso de violação destas restrições, o RiseCheckout pode:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Remover o Produto ou conteúdo infrator.</li>
                          <li>Suspender ou cancelar sua conta.</li>
                          <li>Reter ou estornar pagamentos.</li>
                          <li>Reportar atividades ilegais às autoridades competentes.</li>
                          <li>Buscar reparação judicial por danos causados.</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* Produtos e Marketplace */}
                  <section id="produtos" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <FileText className="w-7 h-7 text-primary" />
                      5. Produtos e Marketplace
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <div>
                        <p className="font-semibold text-foreground mb-2">5.1. Responsabilidades do Produtor:</p>
                        <p className="mb-2">Como Produtor, você é <strong>integralmente responsável</strong> por:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Qualidade e Legalidade:</strong> Garantir que seu Produto é legal, de qualidade e cumpre todas as leis aplicáveis.</li>
                          <li><strong>Descrição Precisa:</strong> Fornecer descrições, imagens e informações precisas sobre o Produto.</li>
                          <li><strong>Entrega:</strong> Entregar o Produto ao Comprador conforme prometido.</li>
                          <li><strong>Suporte:</strong> Prestar suporte adequado aos Compradores sobre o uso do Produto.</li>
                          <li><strong>Reembolsos:</strong> Processar reembolsos conforme sua política de garantia e legislação aplicável.</li>
                          <li><strong>Licenças e Autorizações:</strong> Possuir todas as licenças, permissões e autorizações necessárias.</li>
                          <li><strong>Propriedade Intelectual:</strong> Garantir que possui todos os direitos sobre o conteúdo do Produto.</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">5.2. Listagem no Marketplace:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Ao listar um Produto no Marketplace, você autoriza Afiliados a promovê-lo conforme as condições definidas.</li>
                          <li>Você pode definir a <strong>comissão padrão</strong> que será paga aos Afiliados (percentual ou valor fixo).</li>
                          <li>Você pode <strong>exigir aprovação manual</strong> de Afiliados ou permitir afiliação imediata.</li>
                          <li>Você pode <strong>remover o Produto do Marketplace</strong> a qualquer momento, mas deve honrar comissões de vendas já realizadas.</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">5.3. Aprovação de Produtos:</p>
                        <p className="mb-2">O RiseCheckout reserva-se o direito de:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Revisar</strong> Produtos listados na Plataforma.</li>
                          <li><strong>Recusar</strong> a listagem de Produtos que violem estes Termos ou sejam considerados inadequados.</li>
                          <li><strong>Remover</strong> Produtos que recebam reclamações ou sejam identificados como problemáticos.</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* Programa de Afiliados */}
                  <section id="afiliados" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <Users className="w-7 h-7 text-primary" />
                      6. Programa de Afiliados
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <div>
                        <p className="font-semibold text-foreground mb-2">6.1. Adesão ao Programa:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Qualquer Usuário cadastrado pode se tornar Afiliado.</li>
                          <li>Para promover um Produto, o Afiliado deve <strong>solicitar afiliação</strong> através do Marketplace.</li>
                          <li>A afiliação pode ser <strong>aprovada automaticamente</strong> ou <strong>sujeita à aprovação manual</strong> do Produtor.</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">6.2. Comissões:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>O Afiliado receberá a <strong>comissão definida pelo Produtor</strong> sobre cada venda realizada através de seu Link de Afiliado.</li>
                          <li>A comissão pode ser um <strong>percentual do valor da venda</strong> ou um <strong>valor fixo</strong>.</li>
                          <li>A comissão pode incluir <strong>comissão estendida</strong> sobre order bumps, upsells e downsells, se configurado pelo Produtor.</li>
                          <li>A comissão será calculada sobre o <strong>valor líquido da venda</strong> (após descontos e antes de taxas).</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">6.3. Pagamento de Comissões:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>As comissões serão pagas conforme o <strong>prazo de repasse</strong> definido pelo Produtor (ex: 7, 15, 30 dias após a venda).</li>
                          <li>O pagamento está sujeito ao <strong>período de garantia</strong> do Produto (para permitir reembolsos).</li>
                          <li>O Afiliado deve ter uma <strong>conta de pagamento ativa</strong> para receber as comissões.</li>
                          <li>Comissões inferiores ao <strong>valor mínimo de saque</strong> (R$ 10,00) serão acumuladas até atingir o mínimo.</li>
                        </ul>
                      </div>

                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 my-4">
                        <p className="font-semibold text-red-700 dark:text-red-400 mb-2">6.4. Código de Conduta do Afiliado:</p>
                        <p className="text-sm mb-2">O Afiliado <strong>não pode</strong>:</p>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Fazer promessas falsas ou exageradas sobre o Produto.</li>
                          <li>Utilizar spam ou práticas de marketing agressivas.</li>
                          <li>Comprar tráfego fraudulento ou utilizar bots para gerar cliques.</li>
                          <li>Criar páginas falsas que imitem a página oficial do Produto.</li>
                          <li>Utilizar marcas registradas do Produtor sem autorização.</li>
                          <li>Promover produtos concorrentes na mesma campanha.</li>
                          <li>Auto-referenciar (comprar o Produto através do próprio Link de Afiliado).</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">6.5. Rescisão de Afiliação:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>O Produtor pode <strong>cancelar a afiliação</strong> de um Afiliado a qualquer momento, especialmente em caso de violação do código de conduta.</li>
                          <li>O Afiliado pode <strong>cancelar sua afiliação</strong> a qualquer momento.</li>
                          <li>Comissões de vendas já realizadas serão mantidas, salvo em casos de fraude comprovada.</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* Pagamentos e Comissões */}
                  <section id="pagamentos" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <CreditCard className="w-7 h-7 text-primary" />
                      7. Pagamentos e Comissões
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <div>
                        <p className="font-semibold text-foreground mb-2">7.1. Processamento de Pagamentos:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>O RiseCheckout utiliza <strong>gateways de pagamento terceirizados</strong> (Mercado Pago, Stripe, etc.).</li>
                          <li>Você deve <strong>conectar sua conta</strong> no gateway de pagamento escolhido para receber pagamentos.</li>
                          <li>O RiseCheckout <strong>não armazena dados de cartão de crédito</strong> dos Compradores.</li>
                        </ul>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 my-4">
                        <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">7.2. Split de Pagamento:</p>
                        <p className="text-sm mb-2">O valor da venda será <strong>automaticamente dividido</strong> entre:</p>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li><strong>Produtor:</strong> Valor da venda menos comissão do Afiliado e taxas.</li>
                          <li><strong>Afiliado:</strong> Comissão configurada (se aplicável).</li>
                          <li><strong>RiseCheckout:</strong> Taxa de serviço da plataforma.</li>
                        </ul>
                        <p className="text-sm mt-2">
                          O split é realizado <strong>no momento da transação</strong>, garantindo que cada parte receba sua parcela diretamente.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">7.3. Taxas da Plataforma:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>O RiseCheckout cobra uma <strong>taxa de serviço</strong> sobre cada transação processada.</li>
                          <li>As taxas vigentes estão disponíveis na página de preços.</li>
                          <li>As taxas podem incluir taxa fixa por transação e percentual sobre o valor da venda.</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">7.4. Reembolsos e Chargebacks:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Política de Reembolso:</strong> Cada Produtor define sua própria política de garantia e reembolso.</li>
                          <li><strong>Processamento de Reembolso:</strong> O Produtor é responsável por aprovar ou recusar solicitações.</li>
                          <li><strong>Estorno de Comissões:</strong> Em caso de reembolso, a comissão do Afiliado será automaticamente estornada.</li>
                          <li><strong>Chargebacks:</strong> Em caso de contestação, o Produtor será notificado e terá oportunidade de defesa.</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* Propriedade Intelectual */}
                  <section id="propriedade" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <Shield className="w-7 h-7 text-primary" />
                      8. Propriedade Intelectual
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <div>
                        <p className="font-semibold text-foreground mb-2">8.1. Direitos do RiseCheckout:</p>
                        <p>
                          Todos os direitos sobre a Plataforma, incluindo <strong>código-fonte, design, marca, logotipo e conteúdo</strong>, pertencem exclusivamente ao RiseCheckout. Você <strong>não adquire</strong> nenhum direito de propriedade sobre a Plataforma ao utilizá-la.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">8.2. Direitos do Usuário:</p>
                        <p>
                          Você mantém todos os <strong>direitos de propriedade intelectual</strong> sobre o conteúdo que criar e publicar na Plataforma. Ao publicar conteúdo, você concede ao RiseCheckout uma <strong>licença mundial, não exclusiva, livre de royalties</strong> para usar, reproduzir, modificar e exibir esse conteúdo exclusivamente para operar e promover a Plataforma.
                        </p>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 my-4">
                        <p className="font-semibold text-amber-700 dark:text-amber-400 mb-2">8.3. Conteúdo de Terceiros:</p>
                        <p className="text-sm">
                          Você é responsável por garantir que possui <strong>todos os direitos</strong> sobre o conteúdo que publica na Plataforma. Você <strong>não pode</strong> publicar conteúdo que viole direitos autorais, marcas registradas, patentes ou outros direitos de propriedade intelectual de terceiros.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Privacidade e LGPD */}
                  <section id="privacidade" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <Lock className="w-7 h-7 text-primary" />
                      9. Privacidade e Proteção de Dados (LGPD)
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <div>
                        <p className="font-semibold text-foreground mb-2">9.1. Coleta de Dados:</p>
                        <p className="mb-2">O RiseCheckout coleta e processa dados pessoais conforme descrito em nossa Política de Privacidade, incluindo:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Dados cadastrais (nome, email, CPF/CNPJ, telefone, endereço).</li>
                          <li>Dados de pagamento (processados pelos gateways, não armazenados pelo RiseCheckout).</li>
                          <li>Dados de navegação (cookies, IP, dispositivo, navegador).</li>
                          <li>Dados de transações (histórico de vendas, comissões, produtos).</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">9.2. Uso de Dados:</p>
                        <p className="mb-2">Os dados coletados são utilizados para:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Operar e melhorar a Plataforma.</li>
                          <li>Processar transações e pagamentos.</li>
                          <li>Enviar notificações sobre vendas, comissões e atualizações.</li>
                          <li>Cumprir obrigações legais e fiscais.</li>
                          <li>Prevenir fraudes e garantir segurança.</li>
                        </ul>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 my-4">
                        <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">9.4. Direitos do Titular (LGPD):</p>
                        <p className="text-sm mb-2">Você tem direito a:</p>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li><strong>Acessar</strong> seus dados pessoais.</li>
                          <li><strong>Corrigir</strong> dados incompletos ou desatualizados.</li>
                          <li><strong>Excluir</strong> seus dados (direito ao esquecimento), salvo quando houver obrigação legal de retenção.</li>
                          <li><strong>Revogar consentimento</strong> para tratamento de dados.</li>
                          <li><strong>Portabilidade</strong> de dados para outro fornecedor.</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">9.5. Segurança:</p>
                        <p className="mb-2">O RiseCheckout implementa medidas técnicas e organizacionais para proteger seus dados:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Criptografia de dados em trânsito (HTTPS/TLS).</li>
                          <li>Controle de acesso restrito.</li>
                          <li>Monitoramento de segurança e logs de auditoria.</li>
                          <li>Backup regular de dados.</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* Responsabilidades e Limitações */}
                  <section id="responsabilidades" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <AlertCircle className="w-7 h-7 text-primary" />
                      10. Responsabilidades e Limitações
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <div>
                        <p className="font-semibold text-foreground mb-2">10.1. Responsabilidade do Produtor:</p>
                        <p className="mb-2">O Produtor é <strong>integralmente responsável</strong> por:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Qualidade, legalidade e entrega do Produto.</li>
                          <li>Suporte ao Comprador.</li>
                          <li>Processamento de reembolsos.</li>
                          <li>Cumprimento de leis de defesa do consumidor.</li>
                          <li>Obrigações fiscais e tributárias.</li>
                        </ul>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 my-4">
                        <p className="font-semibold text-amber-700 dark:text-amber-400 mb-2">10.3. Limitação de Responsabilidade do RiseCheckout:</p>
                        <p className="text-sm mb-2">O RiseCheckout <strong>não é responsável</strong> por:</p>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li><strong>Qualidade ou Legalidade dos Produtos:</strong> O RiseCheckout não cria, controla ou garante os Produtos.</li>
                          <li><strong>Disputas entre Usuários:</strong> O RiseCheckout não é parte de disputas entre Produtor, Afiliado e Comprador.</li>
                          <li><strong>Falhas de Terceiros:</strong> Indisponibilidade de gateways de pagamento ou outros serviços terceirizados.</li>
                          <li><strong>Lucros Cessantes:</strong> Perda de receita, lucros ou oportunidades de negócio.</li>
                          <li><strong>Ataques Cibernéticos:</strong> Danos causados por hackers, vírus ou malware, salvo negligência comprovada.</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">10.4. Isenção de Garantias:</p>
                        <p>
                          A Plataforma é fornecida <strong>"no estado em que se encontra"</strong> e <strong>"conforme disponível"</strong>, sem garantias de qualquer tipo, incluindo disponibilidade ininterrupta ou livre de erros.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">10.5. Indenização:</p>
                        <p>
                          Você concorda em <strong>indenizar e isentar</strong> o RiseCheckout de quaisquer reivindicações, perdas, danos e despesas decorrentes de seu uso da Plataforma, violação destes Termos ou violação de direitos de terceiros.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Rescisão */}
                  <section id="rescisao" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <FileText className="w-7 h-7 text-primary" />
                      11. Rescisão e Suspensão
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <div>
                        <p className="font-semibold text-foreground mb-2">11.1. Rescisão pelo Usuário:</p>
                        <p>
                          Você pode encerrar sua conta a qualquer momento através do painel de controle ou entrando em contato com o suporte.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">11.2. Rescisão pelo RiseCheckout:</p>
                        <p className="mb-2">O RiseCheckout pode suspender ou encerrar sua conta em caso de:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Violação destes Termos.</li>
                          <li>Suspeita de fraude ou atividade ilegal.</li>
                          <li>Inatividade prolongada (mais de 12 meses).</li>
                          <li>Solicitação de autoridades competentes.</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">11.3. Efeitos da Rescisão:</p>
                        <p className="mb-2">Após o encerramento da conta:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Você perderá o acesso à Plataforma e a todos os dados associados.</li>
                          <li>Vendas e comissões pendentes serão processadas normalmente.</li>
                          <li>Obrigações financeiras pendentes devem ser quitadas.</li>
                          <li>O RiseCheckout pode reter dados conforme exigido por lei.</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* Disposições Gerais */}
                  <section id="disposicoes" className="mb-12 scroll-mt-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                      <FileText className="w-7 h-7 text-primary" />
                      12. Disposições Gerais
                    </h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <div>
                        <p className="font-semibold text-foreground mb-2">12.1. Lei Aplicável e Foro:</p>
                        <p>
                          Estes Termos são regidos pelas leis da <strong>República Federativa do Brasil</strong>. Fica eleito o foro da comarca de [CIDADE/ESTADO] para dirimir quaisquer controvérsias.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">12.2. Alterações dos Termos:</p>
                        <p>
                          O RiseCheckout reserva-se o direito de modificar estes Termos a qualquer momento. Você será notificado sobre alterações e o uso continuado da Plataforma constitui aceitação dos novos Termos.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground mb-2">12.3. Independência das Cláusulas:</p>
                        <p>
                          Se qualquer disposição destes Termos for considerada inválida ou inexequível, as demais disposições permanecerão em pleno vigor e efeito.
                        </p>
                      </div>

                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 my-6">
                        <h3 className="text-xl font-bold text-foreground mb-3">13. Aceitação dos Termos</h3>
                        <p className="text-sm mb-3">
                          <strong>Ao criar uma conta, acessar ou utilizar a Plataforma RiseCheckout, você declara que:</strong>
                        </p>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">✅</span>
                            <span>Leu e compreendeu integralmente estes Termos de Uso.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">✅</span>
                            <span>Concorda em cumprir todas as disposições aqui estabelecidas.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">✅</span>
                            <span>Tem capacidade legal para celebrar este contrato.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">✅</span>
                            <span>Forneceu informações verdadeiras e precisas.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">✅</span>
                            <span>Está ciente das responsabilidades e limitações descritas nestes Termos.</span>
                          </li>
                        </ul>
                      </div>

                      <div className="text-center pt-6 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                          <strong>Última atualização:</strong> 21 de dezembro de 2025
                        </p>
                        <p className="text-lg font-semibold text-primary mt-2">
                          RiseCheckout - Transformando vendas digitais em sucesso.
                        </p>
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

export default TermosDeUso;
