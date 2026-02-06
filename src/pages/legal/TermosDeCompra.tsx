/**
 * Termos de Compra - RiseCheckout
 * Content source: user-uploaded document (06/02/2026)
 */

import { Helmet } from "react-helmet-async";
import { ShoppingCart } from "lucide-react";
import { LegalPageLayout, type LegalSection } from "./LegalPageLayout";
import { Link } from "react-router-dom";

const SECTIONS: LegalSection[] = [
  {
    id: "visao-geral",
    title: "1. Visão Geral",
    content: (
      <>
        <p>Bem-vindo ao RiseCheckout! Este documento estabelece os termos e condições aplicáveis a todas as compras realizadas através da nossa plataforma de checkout.</p>
        <p>Ao finalizar uma compra utilizando o RiseCheckout, você ("Comprador") declara ter lido, compreendido e concordado integralmente com as disposições aqui descritas, bem como com nossos <Link to="/termos-de-uso">Termos de Uso</Link> e nossa <Link to="/politica-de-privacidade">Política de Privacidade</Link>.</p>
      </>
    ),
  },
  {
    id: "natureza",
    title: "2. Natureza da Plataforma",
    content: (
      <>
        <p><strong>2.1. O Que é o RiseCheckout:</strong> O RiseCheckout é uma plataforma de tecnologia que fornece uma interface de checkout otimizada para Vendedores de produtos e serviços digitais. Atuamos exclusivamente como facilitadores tecnológicos.</p>
        <p><strong>Importante:</strong> O RiseCheckout NÃO é um gateway de pagamento, NÃO processa transações financeiras e NÃO retém valores.</p>
        <p><strong>2.2. Nossa Função:</strong></p>
        <ul>
          <li>Fornecer uma interface de checkout segura e otimizada para conversão</li>
          <li>Coletar os dados da sua compra e transmiti-los de forma criptografada para o gateway de pagamento</li>
          <li>Facilitar a comunicação entre você e o Vendedor</li>
          <li>Garantir a conformidade com as melhores práticas de segurança</li>
        </ul>
        <p><strong>2.3. O Que NÃO Fazemos:</strong> O RiseCheckout NÃO é responsável por processar/aprovar/recusar pagamentos, reter/administrar valores, processar reembolsos, qualidade/veracidade dos Produtos, entrega ou suporte técnico.</p>
      </>
    ),
  },
  {
    id: "processo-compra",
    title: "3. Processo de Compra e Pagamento",
    content: (
      <>
        <p><strong>3.1. Como Funciona:</strong></p>
        <ol>
          <li>Você escolhe o Produto na página de vendas do Vendedor</li>
          <li>Você é direcionado para o checkout do RiseCheckout</li>
          <li>Você preenche seus dados pessoais e escolhe o método de pagamento</li>
          <li>O RiseCheckout transmite seus dados de forma segura para o gateway</li>
          <li>O gateway de pagamento processa a transação</li>
          <li>Você e o Vendedor são notificados sobre a aprovação ou recusa</li>
          <li>O Vendedor libera o acesso ao Produto após a confirmação</li>
        </ol>
        <p><strong>3.2. Meios de Pagamento:</strong> Cartão de crédito, PIX, boleto bancário, carteiras digitais (PayPal, Mercado Pago, etc.).</p>
        <p><strong>3.3. Prazos de Processamento:</strong></p>
        <table>
          <thead><tr><th>Método</th><th>Prazo de Aprovação</th></tr></thead>
          <tbody>
            <tr><td>Cartão de Crédito</td><td>Imediato a 48 horas</td></tr>
            <tr><td>PIX</td><td>Imediato a 2 horas</td></tr>
            <tr><td>Boleto Bancário</td><td>1 a 3 dias úteis</td></tr>
            <tr><td>Carteiras Digitais</td><td>Imediato a 24 horas</td></tr>
          </tbody>
        </table>
        <p><strong>3.4.</strong> O beneficiário em sua fatura será o Vendedor ou o gateway de pagamento. O RiseCheckout NÃO aparecerá como beneficiário.</p>
        <p><strong>3.5.</strong> Se a compra for recusada, as causas mais comuns incluem: saldo insuficiente, dados incorretos, bloqueio de segurança ou falha técnica. Contate sua instituição financeira ou o Vendedor.</p>
      </>
    ),
  },
  {
    id: "entrega",
    title: "4. Entrega e Acesso aos Produtos",
    content: (
      <>
        <p><strong>4.1.</strong> O Vendedor é o único responsável por garantir a qualidade, liberar o acesso, fornecer suporte técnico e cumprir prazos de entrega.</p>
        <p><strong>4.2.</strong> Caso não receba o acesso no prazo prometido, entre em contato diretamente com o Vendedor.</p>
        <p><strong>4.3.</strong> Para produtos físicos, o Vendedor é responsável pela logística de envio. O RiseCheckout não participa desse processo.</p>
      </>
    ),
  },
  {
    id: "reembolsos",
    title: "5. Reembolsos, Cancelamentos e Garantia",
    content: (
      <>
        <p><strong>5.1.</strong> TODA a responsabilidade sobre reembolsos é exclusivamente do VENDEDOR. O RiseCheckout NÃO tem acesso ao seu dinheiro e NÃO pode processar reembolsos.</p>
        <p><strong>5.2. Direito de Arrependimento (7 Dias):</strong> Conforme o Art. 49 do CDC, você tem 7 dias corridos para solicitar reembolso. Contate diretamente o Vendedor.</p>
        <p><strong>5.3. Hipóteses de Reembolso:</strong> Não receber acesso, cobrança indevida, produto diferente do anunciado, problemas técnicos persistentes, dentro do prazo de garantia do Vendedor.</p>
        <p><strong>5.4. Hipóteses de Recusa:</strong> O reembolso pode ser recusado se identificado consumo substancial do Produto (assistir 30%+ das aulas, download de materiais, acesso a módulos avançados, etc.).</p>
        <p><strong>5.5.</strong> Para solicitar, contate diretamente o Vendedor com o ID da transação e o email utilizado.</p>
        <p><strong>5.6. Prazos de Reembolso:</strong></p>
        <table>
          <thead><tr><th>Método</th><th>Prazo</th></tr></thead>
          <tbody>
            <tr><td>Cartão de Crédito</td><td>Até 2 faturas (60 dias)</td></tr>
            <tr><td>PIX</td><td>Até 48 horas</td></tr>
            <tr><td>Boleto Bancário</td><td>Até 10 dias úteis</td></tr>
          </tbody>
        </table>
      </>
    ),
  },
  {
    id: "assinatura",
    title: "6. Produtos por Assinatura",
    content: (
      <>
        <p><strong>6.1.</strong> A renovação ocorre automaticamente ao final de cada período. Você será cobrado pelo mesmo método de pagamento.</p>
        <p><strong>6.2.</strong> Para cancelar uma assinatura, contate diretamente o Vendedor. O cancelamento impede apenas renovações futuras.</p>
        <p><strong>6.3.</strong> O atraso no pagamento pode resultar em bloqueio do acesso, cancelamento automático e cobrança de juros e multa.</p>
      </>
    ),
  },
  {
    id: "protecao-abuso",
    title: "7. Proteção Contra Abuso",
    content: (
      <>
        <p><strong>7.1.</strong> Solicitações reiteradas de reembolso podem ser interpretadas como comportamento fraudulento, podendo resultar em negação de reembolsos futuros, bloqueio de acesso e medidas legais.</p>
        <p><strong>7.2.</strong> O RiseCheckout pode bloquear preventivamente o acesso de um Comprador sempre que identificar indícios de fraude, violação dos Termos ou uso indevido.</p>
      </>
    ),
  },
  {
    id: "dados-privacidade",
    title: "8. Dados e Privacidade",
    content: (
      <>
        <p><strong>8.1.</strong> Durante a compra, coletamos: nome, CPF/CNPJ, email, telefone, endereço de cobrança. Dados de pagamento são transmitidos diretamente para o gateway.</p>
        <p><strong>8.2.</strong> Seus dados são usados exclusivamente para processar a compra, facilitar a comunicação com o Vendedor e cumprir obrigações legais.</p>
        <p><strong>8.3.</strong> Dados são compartilhados com o Vendedor, o gateway de pagamento e autoridades quando exigido por lei.</p>
        <p><strong>8.4.</strong> O RiseCheckout está em conformidade com a LGPD. Para mais informações, consulte nossa <Link to="/politica-de-privacidade">Política de Privacidade</Link>.</p>
      </>
    ),
  },
  {
    id: "disposicoes",
    title: "9. Disposições Gerais",
    content: (
      <>
        <p><strong>9.1.</strong> Podemos atualizar estes Termos de Compra a qualquer momento, sem aviso prévio.</p>
        <p><strong>9.2.</strong> Dúvidas sobre o Produto: contate o Vendedor. Problemas técnicos com o checkout: contate <strong>suporte@risecheckout.com</strong>.</p>
        <p><strong>9.3.</strong> Regidos pelas leis do Brasil, especialmente o CDC e a LGPD.</p>
        <p><strong>9.4.</strong> Foro da comarca de domicílio do Comprador.</p>
      </>
    ),
  },
  {
    id: "contato",
    title: "10. Contato",
    content: (
      <>
        <p><strong>Rise Community LTDA</strong></p>
        <p>CNPJ: 58.566.585/0001-91</p>
        <p>Endereço: Rua 11, Quadra 257, N 5, Dalva 4, Luziânia/GO, CEP 72821-150</p>
        <p>Email: suporte@risecheckout.com</p>
        <p>Ao clicar em "Finalizar Compra", você confirma que leu e concorda com estes Termos de Compra.</p>
      </>
    ),
  },
];

function TermosDeCompra() {
  return (
    <>
      <Helmet>
        <title>Termos de Compra | RiseCheckout</title>
        <meta name="description" content="Termos e condições para compras realizadas através do checkout RiseCheckout." />
      </Helmet>
      <LegalPageLayout
        icon={<ShoppingCart className="w-6 h-6" />}
        title="Termos de Compra"
        lastUpdated="06 de fevereiro de 2026"
        sections={SECTIONS}
      />
    </>
  );
}

export default TermosDeCompra;
