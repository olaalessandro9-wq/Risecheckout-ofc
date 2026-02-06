/**
 * Política de Reembolso - RiseCheckout
 * Content source: user-uploaded document (06/02/2026)
 */

import { Helmet } from "react-helmet-async";
import { RotateCcw } from "lucide-react";
import { LegalPageLayout, type LegalSection } from "./LegalPageLayout";
import { Link } from "react-router-dom";

const SECTIONS: LegalSection[] = [
  {
    id: "visao-geral",
    title: "1. Visão Geral",
    content: (
      <p>Esta Política de Reembolso descreve como o RiseCheckout lida com solicitações de reembolso para produtos adquiridos através de nossa plataforma de checkout. É importante entender que o RiseCheckout é uma plataforma de tecnologia de checkout, e NÃO o vendedor do produto que você adquiriu.</p>
    ),
  },
  {
    id: "responsabilidade",
    title: "2. Responsabilidade pelo Reembolso",
    content: (
      <p>TODA a responsabilidade pelo reembolso, incluindo análise, aprovação e processamento, é exclusivamente do <strong>VENDEDOR</strong> do produto. O RiseCheckout NÃO processa pagamentos, NÃO retém valores e NÃO tem acesso aos fundos da transação. Nós apenas fornecemos a tecnologia para o Vendedor processar o pagamento através de seu próprio gateway (ex: Mercado Pago, Stripe).</p>
    ),
  },
  {
    id: "como-solicitar",
    title: "3. Como Solicitar um Reembolso",
    content: (
      <>
        <p>Para solicitar um reembolso, você deve entrar em contato <strong>DIRETAMENTE com o VENDEDOR</strong> do produto.</p>
        <p>Você pode encontrar as informações de contato do Vendedor:</p>
        <ul>
          <li>No e-mail de confirmação da compra</li>
          <li>Na página de vendas do produto</li>
          <li>No site oficial do Vendedor</li>
        </ul>
      </>
    ),
  },
  {
    id: "arrependimento",
    title: "4. Prazo de Arrependimento (7 dias)",
    content: (
      <p>De acordo com o Art. 49 do Código de Defesa do Consumidor (CDC), você tem o direito de se arrepender da compra no prazo de <strong>7 (sete) dias corridos</strong> a contar da data da compra ou do recebimento do produto, o que ocorrer por último. Este direito deve ser exercido junto ao VENDEDOR.</p>
    ),
  },
  {
    id: "processo",
    title: "5. Processo de Reembolso",
    content: (
      <ol>
        <li><strong>Solicitação:</strong> Você solicita o reembolso ao Vendedor</li>
        <li><strong>Análise:</strong> O Vendedor analisa sua solicitação</li>
        <li><strong>Aprovação:</strong> Se aprovado, o Vendedor processa o reembolso através do gateway</li>
        <li><strong>Estorno:</strong> O gateway de pagamento realiza o estorno para você</li>
      </ol>
    ),
  },
  {
    id: "prazos",
    title: "6. Prazos de Estorno",
    content: (
      <table>
        <thead><tr><th>Método de Pagamento</th><th>Prazo de Estorno (Estimado)</th></tr></thead>
        <tbody>
          <tr><td>Cartão de Crédito</td><td>30-60 dias (1-2 faturas)</td></tr>
          <tr><td>PIX</td><td>Imediato ou até 24 horas</td></tr>
          <tr><td>Boleto Bancário</td><td>1-3 dias úteis (em conta)</td></tr>
        </tbody>
      </table>
    ),
  },
  {
    id: "papel-rise",
    title: "7. Papel do RiseCheckout",
    content: (
      <p>O RiseCheckout pode, a seu critério, facilitar a comunicação entre você e o Vendedor, mas NÃO garante o reembolso. Se você não conseguir contato com o Vendedor, entre em contato: <strong>suporte@risecheckout.com</strong></p>
    ),
  },
  {
    id: "disposicoes",
    title: "8. Disposições Gerais",
    content: (
      <>
        <p>Esta Política de Reembolso é parte integrante dos nossos <Link to="/termos-de-compra">Termos de Compra</Link>. Ao utilizar o RiseCheckout, você concorda com esta política.</p>
        <p>Rise Community LTDA — CNPJ: 58.566.585/0001-91</p>
      </>
    ),
  },
];

function PoliticaDeReembolso() {
  return (
    <>
      <Helmet>
        <title>Política de Reembolso | RiseCheckout</title>
        <meta name="description" content="Como funciona o processo de reembolso para produtos adquiridos através do RiseCheckout." />
      </Helmet>
      <LegalPageLayout
        icon={<RotateCcw className="w-6 h-6" />}
        title="Política de Reembolso"
        lastUpdated="06 de fevereiro de 2026"
        sections={SECTIONS}
      />
    </>
  );
}

export default PoliticaDeReembolso;
