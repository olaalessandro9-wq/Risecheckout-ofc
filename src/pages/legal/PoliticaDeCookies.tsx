/**
 * Política de Cookies - RiseCheckout
 * Content source: user-uploaded document (06/02/2026)
 */

import { Helmet } from "react-helmet-async";
import { Cookie } from "lucide-react";
import { LegalPageLayout, type LegalSection } from "./LegalPageLayout";

const SECTIONS: LegalSection[] = [
  {
    id: "o-que-sao",
    title: "1. O que são Cookies?",
    content: (
      <p>Cookies são pequenos arquivos de texto que são armazenados no seu navegador quando você visita um site. Eles são usados para lembrar suas preferências, otimizar sua experiência e coletar dados de análise.</p>
    ),
  },
  {
    id: "como-usamos",
    title: "2. Como Usamos Cookies",
    content: (
      <>
        <p><strong>a) Cookies Essenciais:</strong></p>
        <ul>
          <li><strong>Funcionalidade do checkout:</strong> Manter os produtos no carrinho, lembrar informações de preenchimento</li>
          <li><strong>Segurança:</strong> Prevenir fraudes e proteger suas informações</li>
        </ul>
        <p><strong>b) Cookies de Performance e Análise:</strong></p>
        <ul>
          <li><strong>Google Analytics:</strong> Dados anônimos sobre uso do checkout (páginas visitadas, tempo gasto)</li>
          <li><strong>Hotjar:</strong> Comportamento visual do usuário (mapas de calor, gravações de sessão)</li>
        </ul>
        <p><strong>c) Cookies de Marketing e Rastreamento:</strong></p>
        <ul>
          <li><strong>Facebook Pixel:</strong> Rastrear conversões de anúncios e criar públicos personalizados</li>
          <li><strong>Google Ads:</strong> Rastrear conversões e otimizar campanhas</li>
          <li><strong>TikTok Pixel:</strong> Rastrear conversões de anúncios do TikTok</li>
        </ul>
      </>
    ),
  },
  {
    id: "terceiros",
    title: "3. Cookies de Terceiros",
    content: (
      <>
        <p>Quando você utiliza o RiseCheckout, cookies de terceiros podem ser armazenados no seu navegador. São de responsabilidade dos respectivos terceiros:</p>
        <ul>
          <li><strong>Gateways de Pagamento</strong> (Mercado Pago, Stripe, etc.) — Para processar o pagamento e prevenir fraudes</li>
          <li><strong>Vendedores</strong> — Para rastrear vendas de afiliados e otimizar campanhas</li>
        </ul>
      </>
    ),
  },
  {
    id: "gerenciar",
    title: "4. Como Gerenciar seus Cookies",
    content: (
      <>
        <p>Você pode gerenciar e/ou deletar cookies a qualquer momento através das configurações do seu navegador.</p>
        <ul>
          <li><strong>Google Chrome:</strong> Configurações → Privacidade → Cookies</li>
          <li><strong>Mozilla Firefox:</strong> Configurações → Privacidade → Cookies</li>
          <li><strong>Microsoft Edge:</strong> Configurações → Privacidade → Cookies</li>
        </ul>
        <p><strong>Atenção:</strong> Desativar cookies essenciais pode impedir o funcionamento do checkout.</p>
      </>
    ),
  },
  {
    id: "consentimento",
    title: "5. Consentimento",
    content: (
      <p>Ao utilizar o RiseCheckout, você concorda com o uso de cookies conforme descrito nesta política. Nós exibiremos um banner de consentimento de cookies na sua primeira visita.</p>
    ),
  },
  {
    id: "contato",
    title: "6. Contato",
    content: (
      <>
        <p>E-mail: <strong>suporte@risecheckout.com</strong></p>
        <p>Rise Community LTDA — CNPJ: 58.566.585/0001-91</p>
      </>
    ),
  },
];

function PoliticaDeCookies() {
  return (
    <>
      <Helmet>
        <title>Política de Cookies | RiseCheckout</title>
        <meta name="description" content="Como o RiseCheckout utiliza cookies e tecnologias de rastreamento para otimizar sua experiência." />
      </Helmet>
      <LegalPageLayout
        icon={<Cookie className="w-6 h-6" />}
        title="Política de Cookies"
        lastUpdated="06 de fevereiro de 2026"
        sections={SECTIONS}
      />
    </>
  );
}

export default PoliticaDeCookies;
