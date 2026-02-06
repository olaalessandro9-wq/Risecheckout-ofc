/**
 * Política de Conteúdo - RiseCheckout
 * Content source: user-uploaded document (06/02/2026)
 */

import { Helmet } from "react-helmet-async";
import { BookOpen } from "lucide-react";
import { LegalPageLayout, type LegalSection } from "./LegalPageLayout";

const SECTIONS: LegalSection[] = [
  {
    id: "visao-geral",
    title: "1. Visão Geral",
    content: (
      <p>Esta Política de Conteúdo estabelece as diretrizes sobre quais produtos e serviços podem ser vendidos através do RiseCheckout. O RiseCheckout é uma plataforma de tecnologia de checkout, e NÃO o vendedor dos produtos. A responsabilidade pelo conteúdo, qualidade e legalidade do produto é exclusivamente do <strong>VENDEDOR</strong>.</p>
    ),
  },
  {
    id: "permitidos",
    title: "2. Produtos e Serviços Permitidos",
    content: (
      <>
        <p><strong>2.1 Produtos Digitais:</strong></p>
        <ul>
          <li>Cursos online e treinamentos</li>
          <li>E-books e livros digitais</li>
          <li>Softwares e aplicativos</li>
          <li>Templates e recursos digitais</li>
          <li>Músicas, vídeos e conteúdo audiovisual</li>
          <li>Assinaturas e memberships</li>
          <li>Mentorias e consultorias online</li>
          <li>Infoprodutos de diversos nichos (incluindo relacionamento, sedução, desenvolvimento pessoal)</li>
        </ul>
        <p><strong>2.2 Serviços Digitais:</strong></p>
        <ul>
          <li>Consultorias e mentorias</li>
          <li>Serviços de design, programação, marketing, tradução e redação</li>
          <li>Coaching e desenvolvimento pessoal</li>
        </ul>
        <p><strong>2.3 Produtos Físicos (em breve):</strong> O RiseCheckout está expandindo para permitir a venda de produtos físicos que exigem envio postal.</p>
      </>
    ),
  },
  {
    id: "filosofia",
    title: "3. Liberdade com Responsabilidade",
    content: (
      <>
        <p>O RiseCheckout acredita na liberdade de empreender. Somos uma plataforma liberal que permite diversos tipos de produtos, desde que legais e entregues.</p>
        <p><strong>Permitimos:</strong> Marketing agressivo (desde que verdadeiro), produtos polêmicos (desde que legais), diversos nichos de mercado, estratégias de vendas criativas.</p>
        <p><strong>TOLERÂNCIA ZERO para:</strong> Golpes e fraudes, vender sem entregar, produtos ilegais, uso de cartões clonados ou fraudados.</p>
      </>
    ),
  },
  {
    id: "proibidos",
    title: "4. Produtos e Serviços Proibidos",
    content: (
      <>
        <p><strong>4.1 Golpes e Fraudes (TOLERÂNCIA ZERO):</strong> Vender sem entregar, promessas falsas, esquemas de pirâmide, falsas promessas de enriquecimento rápido, cursos vazios.</p>
        <p><strong>4.2 Atividades Criminosas (TOLERÂNCIA ZERO):</strong> Cartões clonados, documentos falsos, contas hackeadas, softwares pirateados, produtos falsificados, lavagem de dinheiro.</p>
        <p><strong>4.3 Conteúdo Ilegal:</strong> Pornografia infantil, crimes violentos, apologia ao terrorismo, tráfico de drogas, armas de fogo.</p>
        <p><strong>4.4 Produtos Regulamentados Sem Autorização:</strong> Medicamentos sem ANVISA, suplementos proibidos, serviços médicos sem registro, empréstimos sem autorização do Banco Central, investimentos não regulamentados pela CVM.</p>
        <p><strong>4.5 Conteúdo Extremamente Nocivo:</strong> Conteúdo que promova suicídio/automutilação, ódio racial/étnico/religioso, ou violência contra grupos específicos.</p>
      </>
    ),
  },
  {
    id: "nao-proibido",
    title: "5. O que NÃO é Proibido",
    content: (
      <>
        <p>Para deixar claro, o RiseCheckout PERMITE:</p>
        <ul>
          <li>✅ Infoprodutos de relacionamento e sedução (conteúdo adulto educacional)</li>
          <li>✅ Marketing agressivo (desde que não seja enganoso)</li>
          <li>✅ Produtos polêmicos (desde que legais)</li>
          <li>✅ Promessas de resultados (desde que com disclaimers adequados)</li>
          <li>✅ Produtos de alto ticket</li>
          <li>✅ Upsells e downsells (estratégias de vendas)</li>
        </ul>
        <p><strong>Nossa regra é simples:</strong> Se é legal e você entrega o que promete, pode vender.</p>
      </>
    ),
  },
  {
    id: "responsabilidade-vendedor",
    title: "6. Responsabilidade do Vendedor",
    content: (
      <ol>
        <li>Possui todos os direitos necessários para vender o produto/serviço</li>
        <li>O produto está em conformidade com todas as leis aplicáveis</li>
        <li>Não viola direitos de propriedade intelectual de terceiros</li>
        <li>As informações de venda são verdadeiras e precisas</li>
        <li>Irá entregar o produto conforme prometido</li>
        <li>Possui estrutura para entregar e dar suporte ao cliente</li>
        <li>Não está envolvido em atividades fraudulentas ou criminosas</li>
      </ol>
    ),
  },
  {
    id: "recusa-suspensao",
    title: "7. Direito de Recusa e Suspensão",
    content: (
      <>
        <p>O RiseCheckout reserva-se o direito de recusar checkouts, suspender checkouts existentes, encerrar contas, reportar atividades ilegais e congelar fundos em coordenação com o gateway.</p>
        <p><strong>7.1 Suspensão Imediata (Sem Aviso):</strong> Golpes, fraude, venda sem entrega, cartões clonados, atividades criminosas.</p>
        <p><strong>7.2 Aviso Prévio:</strong> Para violações menos graves, aviso de 48 horas para correção.</p>
      </>
    ),
  },
  {
    id: "denuncias",
    title: "8. Sistema de Denúncias",
    content: (
      <>
        <p><strong>8.1</strong> Para denunciar: <strong>suporte@risecheckout.com</strong>. Inclua URL do checkout, descrição da violação e evidências.</p>
        <p><strong>8.2</strong> Analisamos todas as denúncias em até 5 dias úteis. Denúncias de golpes e fraudes são priorizadas (24h). Notificamos o Vendedor e damos direito de defesa.</p>
      </>
    ),
  },
  {
    id: "protecao-comprador",
    title: "9. Proteção ao Comprador",
    content: (
      <>
        <p>O RiseCheckout está comprometido em proteger compradores: monitoramento de padrões suspeitos, análise de denúncias, cooperação com gateways para estornos, banimento de golpistas.</p>
        <p>Se você comprou e não recebeu: <strong>suporte@risecheckout.com</strong></p>
      </>
    ),
  },
  {
    id: "limitacao",
    title: "10. Limitação de Responsabilidade",
    content: (
      <p>O RiseCheckout NÃO é responsável por qualidade, legalidade, adequação dos produtos, cumprimento de promessas, entrega ou disputas entre Vendedor e Comprador. O RiseCheckout é apenas a tecnologia de checkout. No entanto, agiremos prontamente ao identificar golpes, fraudes ou atividades ilegais.</p>
    ),
  },
  {
    id: "alteracoes",
    title: "11. Alterações nesta Política",
    content: (
      <p>Podemos atualizar esta Política a qualquer momento. Quando possível, notificaremos por e-mail sobre mudanças significativas. É responsabilidade do Vendedor revisar periodicamente.</p>
    ),
  },
  {
    id: "contato",
    title: "12. Contato",
    content: (
      <>
        <p>E-mail: <strong>suporte@risecheckout.com</strong></p>
        <p>Endereço: Rua 11, Quadra 257, N 5, Dalva 4, Luziânia/GO, CEP 72821-150</p>
        <p>CNPJ: 58.566.585/0001-91 — Rise Community LTDA</p>
      </>
    ),
  },
];

function PoliticaDeConteudo() {
  return (
    <>
      <Helmet>
        <title>Política de Conteúdo | RiseCheckout</title>
        <meta name="description" content="O que pode e não pode ser vendido na plataforma RiseCheckout. Produtos permitidos e proibidos." />
      </Helmet>
      <LegalPageLayout
        icon={<BookOpen className="w-6 h-6" />}
        title="Política de Conteúdo"
        lastUpdated="06 de fevereiro de 2026"
        sections={SECTIONS}
      />
    </>
  );
}

export default PoliticaDeConteudo;
