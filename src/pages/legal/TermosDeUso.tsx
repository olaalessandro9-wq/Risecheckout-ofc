/**
 * Termos de Uso - RiseCheckout
 * Content source: user-uploaded document (06/02/2026)
 */

import { Helmet } from "react-helmet-async";
import { FileText } from "lucide-react";
import { LegalPageLayout, type LegalSection } from "./LegalPageLayout";
import { Link } from "react-router-dom";

const SECTIONS: LegalSection[] = [
  {
    id: "visao-geral",
    title: "Visão Geral",
    content: (
      <>
        <p><strong>A.</strong> Bem-vindo ao RiseCheckout! Estes Termos de Uso ("Termos") regem o acesso e uso da plataforma RiseCheckout, de propriedade da <strong>Rise Community LTDA</strong>, CNPJ <strong>58.566.585/0001-91</strong>.</p>
        <p><strong>B.</strong> Ao acessar ou utilizar a Plataforma, você ("Usuário") concorda integralmente com estes Termos. Se não concordar, não utilize a Plataforma.</p>
        <p><strong>C.</strong> O RiseCheckout é uma plataforma de tecnologia de checkout, e nada mais. Nós NÃO processamos pagamentos, NÃO retemos valores, NÃO gerenciamos reembolsos, NÃO vendemos produtos. Nossa única função é fornecer a tecnologia que conecta Vendedores aos gateways de pagamento.</p>
        <p><strong>D.</strong> Estes Termos são um contrato vinculante. As demais políticas do RiseCheckout (<Link to="/politica-de-privacidade">Privacidade</Link>, <Link to="/politica-de-conteudo">Conteúdo</Link>, etc.) são parte integrante destes Termos.</p>
        <p><strong>E.</strong> A licença de uso da Plataforma é não exclusiva e pode ser revogada a qualquer momento, sem aviso prévio. Os recursos podem ser modificados ou removidos a nosso exclusivo critério.</p>
        <p><strong>F.</strong> O uso da Plataforma em desacordo com estes Termos resultará em medidas como suspensão ou cancelamento da sua conta, a nosso exclusivo critério, com ou sem aviso prévio.</p>
        <p><strong>G.</strong> Você nos autoriza a reportar às autoridades qualquer ato que considerarmos ter indícios de irregularidades ou ilegalidades.</p>
      </>
    ),
  },
  {
    id: "definicoes",
    title: "1. Definições",
    content: (
      <ul>
        <li><strong>Plataforma:</strong> A tecnologia do RiseCheckout.</li>
        <li><strong>Usuário:</strong> Qualquer um que acesse a plataforma (Produtor, Afiliado, Comprador).</li>
        <li><strong>Produtor/Vendedor:</strong> O único e exclusivo responsável pelo produto vendido.</li>
        <li><strong>Comprador:</strong> O cliente do Produtor/Vendedor.</li>
      </ul>
    ),
  },
  {
    id: "natureza",
    title: "2. Natureza da Plataforma e Isenção Total",
    content: (
      <>
        <p><strong>2.1.</strong> O RiseCheckout atua EXCLUSIVAMENTE como provedora de TECNOLOGIA e INFRAESTRUTURA. Nossa função é estritamente tecnológica e de automação.</p>
        <p><strong>2.2.</strong> Para fins de clareza, o RiseCheckout NÃO é, e NÃO se confunde com:</p>
        <ul>
          <li>Intermediadora financeira ou de pagamentos</li>
          <li>Garantidora de transações</li>
          <li>Custodiadora ou depositária de valores</li>
          <li>Processadora de pagamentos</li>
          <li>Instituição de pagamento ou financeira</li>
          <li>Vendedora, revendedora ou fornecedora dos Produtos</li>
          <li>Parte na relação comercial entre os Usuários</li>
        </ul>
        <p><strong>2.3.</strong> O RiseCheckout NÃO RECEBE, NÃO ARMAZENA, NÃO PROCESSA e NÃO TRANSFERE valores entre compradores e vendedores. TODO o fluxo financeiro é realizado diretamente por gateways de pagamento terceirizados (Mercado Pago, Stripe, etc.).</p>
      </>
    ),
  },
  {
    id: "isencao",
    title: "3. Isenção de Responsabilidade",
    content: (
      <>
        <p><strong>3.1. Sobre Conteúdo e Ofertas:</strong> O RiseCheckout NÃO cria, NÃO hospeda, NÃO edita, NÃO verifica e NÃO valida conteúdos, produtos ou serviços comercializados por Vendedores, descrições, preços, imagens, qualidade, autenticidade, legalidade ou conformidade de produtos, nem promessas, garantias ou prazos oferecidos por Vendedores.</p>
        <p><strong>3.2. Sobre Entrega e Cumprimento:</strong> O RiseCheckout NÃO se responsabiliza por entrega, atrasos, qualidade, defeitos, reembolsos, trocas, devoluções, suporte pós-venda, garantias ou assistência técnica.</p>
        <p><strong>3.3.</strong> Toda e qualquer disputa, reclamação ou problema DEVE SER RESOLVIDO DIRETAMENTE ENTRE COMPRADOR E VENDEDOR, sem nenhum envolvimento ou responsabilidade do RiseCheckout.</p>
      </>
    ),
  },
  {
    id: "cadastro",
    title: "4. Cadastro e Conta",
    content: (
      <>
        <p><strong>4.1.</strong> Para utilizar a Plataforma, o Usuário deve fornecer informações verdadeiras, precisas e completas.</p>
        <p><strong>4.2.</strong> O Usuário é o único responsável pela segurança de sua senha.</p>
        <p><strong>4.3.</strong> Reservamo-nos o direito de solicitar documentos e informações para verificação de identidade (KYC) a qualquer momento.</p>
      </>
    ),
  },
  {
    id: "proibicoes",
    title: "5. Proibições e Conduta do Usuário",
    content: (
      <>
        <p><strong>5.1.</strong> É ESTRITAMENTE PROIBIDO utilizar a Plataforma para:</p>
        <ul>
          <li>Golpes, fraudes ou estelionato</li>
          <li>Não entrega proposital de produtos/serviços pagos</li>
          <li>Venda de produtos ilegais, falsificados ou que violem nossa <Link to="/politica-de-conteudo">Política de Conteúdo</Link></li>
          <li>Lavagem de dinheiro ou evasão fiscal</li>
          <li>Qualquer atividade ilícita, antiética ou criminosa</li>
        </ul>
        <p><strong>5.2.</strong> Violações resultarão em suspensão ou encerramento IMEDIATO da conta e denúncia formal às autoridades competentes.</p>
      </>
    ),
  },
  {
    id: "propriedade",
    title: "6. Propriedade Intelectual",
    content: (
      <p><strong>6.1.</strong> O RiseCheckout é proprietário de todos os direitos sobre a Plataforma. O Vendedor declara ser o proprietário de todos os direitos sobre seus Produtos.</p>
    ),
  },
  {
    id: "suspensao",
    title: "7. Suspensão e Bloqueio de Contas",
    content: (
      <>
        <p><strong>7.1.</strong> O RiseCheckout pode, a seu exclusivo critério e sem aviso prévio, suspender, bloquear ou cancelar contas que violem estes Termos, apresentem comportamento suspeito ou fraudulento, ou que causem danos à reputação da Plataforma.</p>
        <p><strong>7.2. IMPORTANTE:</strong> Como o RiseCheckout NÃO processa pagamentos e NÃO retém valores, NÃO temos capacidade de bloquear ou reter saldos. Toda gestão financeira é de responsabilidade exclusiva do gateway de pagamento escolhido pelo Vendedor.</p>
        <p><strong>7.3.</strong> Em caso de suspeita de fraude, chargebacks excessivos ou atividades ilícitas, o RiseCheckout poderá: suspender ou encerrar imediatamente o acesso, bloquear a criação de novos checkouts, notificar o gateway de pagamento, reportar às autoridades competentes e fornecer todos os dados e evidências para investigações criminais.</p>
      </>
    ),
  },
  {
    id: "terceiros",
    title: "8. Serviços de Terceiros",
    content: (
      <>
        <p><strong>8.1.</strong> A Plataforma integra e depende de diversos serviços de terceiros, incluindo processadores de pagamento (Mercado Pago, Stripe, etc.), provedores de infraestrutura em nuvem (Supabase, AWS, Vercel) e serviços de e-mail e comunicação.</p>
        <p><strong>8.2.</strong> O RiseCheckout NÃO controla, NÃO garante e NÃO se responsabiliza pela disponibilidade, segurança, precisão ou legalidade dos serviços de terceiros.</p>
      </>
    ),
  },
  {
    id: "forca-maior",
    title: "9. Força Maior e Caso Fortuito",
    content: (
      <p><strong>9.1.</strong> O RiseCheckout não será responsabilizado por qualquer falha ou atraso decorrentes de eventos de força maior ou caso fortuito, incluindo: falhas em serviços de terceiros, ataques cibernéticos, falhas de infraestrutura de internet, catástrofes naturais, pandemias, guerras, mudanças legislativas ou bloqueios governamentais.</p>
    ),
  },
  {
    id: "indenizacao",
    title: "10. Indenização e Defesa",
    content: (
      <>
        <p><strong>10.1.</strong> O Usuário concorda em indenizar, defender e isentar o RiseCheckout de quaisquer reclamações, danos, perdas, responsabilidades, custos e despesas (incluindo honorários advocatícios) decorrentes de violação destes Termos, violação de direitos de terceiros, uso indevido da Plataforma, conteúdos/produtos/serviços oferecidos pelo Usuário, e fraudes ou atividades ilícitas.</p>
        <p><strong>10.2.</strong> O Usuário concorda que o RiseCheckout não tem nenhuma responsabilidade por qualquer dano que possa sofrer como resultado do uso da Plataforma.</p>
      </>
    ),
  },
  {
    id: "alteracoes",
    title: "11. Alterações nos Termos",
    content: (
      <p><strong>11.1.</strong> Podemos atualizar estes Termos a qualquer momento, a nosso exclusivo critério. As modificações terão efeito imediato após publicação na Plataforma. O uso contínuo da Plataforma implica aceitação das alterações.</p>
    ),
  },
  {
    id: "lei-foro",
    title: "12. Lei Aplicável e Foro",
    content: (
      <>
        <p><strong>12.1.</strong> Estes Termos são regidos pelas leis da República Federativa do Brasil.</p>
        <p><strong>12.2.</strong> Fica eleito o Foro da Comarca de Luziânia/GO, com exclusão de qualquer outro, por mais privilegiado que seja, para dirimir quaisquer controvérsias oriundas destes Termos.</p>
      </>
    ),
  },
  {
    id: "contato",
    title: "13. Contato",
    content: (
      <>
        <p><strong>13.1.</strong> Todas as comunicações devem ser feitas através do e-mail <strong>suporte@risecheckout.com</strong>.</p>
        <p>Ao criar uma conta ou utilizar a Plataforma RiseCheckout, você confirma que leu, compreendeu e concorda integralmente com estes Termos de Uso.</p>
      </>
    ),
  },
];

function TermosDeUso() {
  return (
    <>
      <Helmet>
        <title>Termos de Uso | RiseCheckout</title>
        <meta name="description" content="Termos de Uso da plataforma RiseCheckout. Regras de acesso, uso e responsabilidades." />
      </Helmet>
      <LegalPageLayout
        icon={<FileText className="w-6 h-6" />}
        title="Termos de Uso"
        subtitle="Versão Ultra-Defensiva"
        lastUpdated="06 de fevereiro de 2026"
        sections={SECTIONS}
      />
    </>
  );
}

export default TermosDeUso;
