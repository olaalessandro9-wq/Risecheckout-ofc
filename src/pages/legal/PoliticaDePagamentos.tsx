/**
 * Política de Pagamentos - RiseCheckout
 * Content source: user-uploaded document (06/02/2026)
 */

import { Helmet } from "react-helmet-async";
import { CreditCard } from "lucide-react";
import { LegalPageLayout, type LegalSection } from "./LegalPageLayout";
import { Link } from "react-router-dom";

const SECTIONS: LegalSection[] = [
  {
    id: "visao-geral",
    title: "1. Visão Geral",
    content: (
      <>
        <p>Esta Política de Pagamentos explica como os pagamentos são processados quando você compra um produto através do RiseCheckout. O RiseCheckout é uma plataforma de tecnologia de checkout, e NÃO um gateway de pagamento.</p>
        <p><strong>O que isso significa?</strong></p>
        <ul>
          <li>O RiseCheckout NÃO processa pagamentos</li>
          <li>O RiseCheckout NÃO retém valores</li>
          <li>O RiseCheckout NÃO tem acesso ao dinheiro da transação</li>
        </ul>
        <p>Nós apenas fornecemos a interface de checkout para que o Vendedor possa processar o pagamento através de seu próprio gateway (ex: Mercado Pago, Stripe, PagSeguro, etc.).</p>
      </>
    ),
  },
  {
    id: "como-funciona",
    title: "2. Como Funciona o Processo de Pagamento",
    content: (
      <>
        <p><strong>Fluxo Simplificado:</strong></p>
        <ol>
          <li>Você preenche o formulário de checkout no RiseCheckout</li>
          <li>RiseCheckout transmite seus dados de forma criptografada para o gateway do Vendedor</li>
          <li>O gateway de pagamento processa a transação</li>
          <li>O gateway aprova ou recusa a transação</li>
          <li>O Vendedor recebe o valor diretamente em sua conta no gateway</li>
        </ol>
        <p>O RiseCheckout NÃO participa do fluxo financeiro. Somos apenas a tecnologia que conecta você ao gateway do Vendedor.</p>
      </>
    ),
  },
  {
    id: "gateways",
    title: "3. Gateways de Pagamento Suportados",
    content: (
      <>
        <p>O RiseCheckout integra com os principais gateways:</p>
        <ul>
          <li>Mercado Pago</li>
          <li>Stripe</li>
          <li>PagSeguro</li>
          <li>PagBank</li>
          <li>Outros (conforme configurado pelo Vendedor)</li>
        </ul>
        <p>Cada Vendedor escolhe qual gateway utilizar. O RiseCheckout apenas facilita a integração.</p>
      </>
    ),
  },
  {
    id: "metodos",
    title: "4. Métodos de Pagamento",
    content: (
      <>
        <p><strong>4.1 Cartão de Crédito:</strong> Visa, Mastercard, American Express, Elo, Hipercard. Parcelamento conforme configurado pelo Vendedor. Processamento em tempo real.</p>
        <p><strong>4.2 PIX:</strong> Pagamento instantâneo, disponível 24/7, confirmação em segundos.</p>
        <p><strong>4.3 Boleto Bancário:</strong> Prazo de vencimento (geralmente 3 dias), confirmação em 1-3 dias úteis após pagamento.</p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "5. Segurança dos Dados de Pagamento",
    content: (
      <>
        <p><strong>5.1 Criptografia:</strong> Todos os dados são transmitidos via HTTPS (SSL/TLS) com criptografia de 256 bits.</p>
        <p><strong>5.2 NÃO Armazenamos Dados de Cartão:</strong> O RiseCheckout NUNCA armazena números completos de cartão. Os dados são transmitidos diretamente para o gateway. Seguimos as normas PCI DSS.</p>
        <p><strong>5.3 Tokenização:</strong> Quando você salva um cartão para compras futuras, o gateway gera um token. O RiseCheckout armazena apenas o token, nunca o número real do cartão.</p>
      </>
    ),
  },
  {
    id: "aprovacao-recusa",
    title: "6. Aprovação e Recusa de Pagamentos",
    content: (
      <>
        <p>A aprovação ou recusa é de responsabilidade do gateway e do banco emissor.</p>
        <p><strong>Motivos Comuns de Recusa:</strong></p>
        <ul>
          <li>Saldo ou limite insuficiente</li>
          <li>Dados de cartão incorretos</li>
          <li>Cartão bloqueado ou vencido</li>
          <li>Suspeita de fraude pelo banco</li>
          <li>Restrições do emissor do cartão</li>
        </ul>
        <p>O RiseCheckout NÃO tem controle sobre aprovação ou recusa. Em caso de recusa, entre em contato com seu banco.</p>
      </>
    ),
  },
  {
    id: "prazos",
    title: "7. Prazos de Processamento",
    content: (
      <table>
        <thead><tr><th>Método</th><th>Confirmação</th></tr></thead>
        <tbody>
          <tr><td>Cartão de Crédito</td><td>Imediato</td></tr>
          <tr><td>PIX</td><td>Imediato</td></tr>
          <tr><td>Boleto Bancário</td><td>1-3 dias úteis</td></tr>
        </tbody>
      </table>
    ),
  },
  {
    id: "taxas",
    title: "8. Taxas e Tarifas",
    content: (
      <>
        <p><strong>8.1</strong> O RiseCheckout cobra uma taxa de serviço do Vendedor por cada transação. Esta taxa NÃO é cobrada do Comprador. O preço no checkout é o preço que você paga — sem taxas ocultas.</p>
        <p><strong>8.2</strong> O gateway de pagamento cobra suas próprias taxas do Vendedor (ex: 3-5% + R$ 0,40). Estas taxas NÃO são repassadas ao Comprador.</p>
      </>
    ),
  },
  {
    id: "reembolsos",
    title: "9. Reembolsos e Estornos",
    content: (
      <p>Como o RiseCheckout NÃO processa pagamentos, NÃO processamos reembolsos. Toda a responsabilidade é do Vendedor e do gateway. Consulte nossa <Link to="/politica-de-reembolso">Política de Reembolso</Link>.</p>
    ),
  },
  {
    id: "chargebacks",
    title: "10. Chargebacks (Contestações)",
    content: (
      <p>Se você contestar uma compra junto ao seu banco (chargeback), o processo será conduzido entre você, seu banco emissor, o gateway de pagamento e o Vendedor. O RiseCheckout NÃO participa, mas podemos fornecer informações sobre a transação se solicitado.</p>
    ),
  },
  {
    id: "moeda",
    title: "11. Moeda",
    content: (
      <p>Todas as transações são processadas em Reais Brasileiros (BRL), salvo se o Vendedor configurar outra moeda através de seu gateway.</p>
    ),
  },
  {
    id: "impostos",
    title: "12. Impostos",
    content: (
      <p>O preço exibido no checkout já inclui todos os impostos aplicáveis (quando aplicável). Não há impostos adicionais no momento da compra.</p>
    ),
  },
  {
    id: "limitacao",
    title: "13. Limitação de Responsabilidade",
    content: (
      <p>O RiseCheckout NÃO é responsável por falhas no processamento pelo gateway, recusa de pagamentos por bancos, atrasos na liberação de valores para o Vendedor, taxas cobradas pelo gateway ou disputas de chargeback. O RiseCheckout é apenas a tecnologia de checkout.</p>
    ),
  },
  {
    id: "alteracoes",
    title: "14. Alterações nesta Política",
    content: (
      <p>Podemos atualizar esta Política a qualquer momento. Quando possível, notificaremos por e-mail sobre mudanças significativas. É responsabilidade do usuário revisar periodicamente.</p>
    ),
  },
  {
    id: "contato",
    title: "15. Contato",
    content: (
      <>
        <p>E-mail: <strong>suporte@risecheckout.com</strong></p>
        <p>Endereço: Rua 11, Quadra 257, N 5, Dalva 4, Luziânia/GO, CEP 72821-150</p>
        <p>CNPJ: 58.566.585/0001-91 — Rise Community LTDA</p>
      </>
    ),
  },
];

function PoliticaDePagamentos() {
  return (
    <>
      <Helmet>
        <title>Política de Pagamentos | RiseCheckout</title>
        <meta name="description" content="Como os pagamentos são processados no RiseCheckout. Gateways, segurança, prazos e taxas." />
      </Helmet>
      <LegalPageLayout
        icon={<CreditCard className="w-6 h-6" />}
        title="Política de Pagamentos"
        lastUpdated="06 de fevereiro de 2026"
        sections={SECTIONS}
      />
    </>
  );
}

export default PoliticaDePagamentos;
