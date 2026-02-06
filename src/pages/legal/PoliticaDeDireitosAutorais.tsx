/**
 * Política de Direitos Autorais - RiseCheckout
 * Content source: user-uploaded document (06/02/2026)
 */

import { Helmet } from "react-helmet-async";
import { Scale } from "lucide-react";
import { LegalPageLayout, type LegalSection } from "./LegalPageLayout";

const SECTIONS: LegalSection[] = [
  {
    id: "visao-geral",
    title: "1. Visão Geral",
    content: (
      <p>O RiseCheckout respeita os direitos de propriedade intelectual de terceiros e espera que os Vendedores façam o mesmo. Esta política descreve como lidamos com denúncias de violação de direitos autorais. O RiseCheckout é uma plataforma de tecnologia de checkout, e NÃO o vendedor dos produtos. A responsabilidade pelo conteúdo e legalidade é exclusivamente do <strong>VENDEDOR</strong>.</p>
    ),
  },
  {
    id: "compromisso",
    title: "2. Compromisso com a Propriedade Intelectual",
    content: (
      <ol>
        <li>Proteger os direitos de propriedade intelectual de criadores de conteúdo</li>
        <li>Remover checkouts de produtos que violem direitos autorais de terceiros</li>
        <li>Suspender contas de Vendedores que violem repetidamente direitos autorais</li>
        <li>Cooperar com autoridades e titulares de direitos em investigações</li>
      </ol>
    ),
  },
  {
    id: "o-que-constitui",
    title: "3. O que Constitui Violação?",
    content: (
      <ul>
        <li>Vender cópias não autorizadas de obras protegidas (livros, cursos, softwares, etc.)</li>
        <li>Usar imagens, vídeos ou músicas de terceiros sem autorização</li>
        <li>Vender produtos que são cópias substanciais de obras de terceiros</li>
        <li>Usar marcas registradas de terceiros sem autorização</li>
      </ul>
    ),
  },
  {
    id: "como-denunciar",
    title: "4. Como Denunciar Violação",
    content: (
      <>
        <p>Envie uma denúncia para: <strong>suporte@risecheckout.com</strong></p>
        <p><strong>Informações Necessárias:</strong></p>
        <ol>
          <li><strong>Identificação da obra original:</strong> Título, autor, data de publicação, link para a obra original</li>
          <li><strong>Prova de titularidade</strong> dos direitos autorais</li>
          <li><strong>Identificação da violação:</strong> URL do checkout infrator, descrição de como viola seus direitos, prints ou evidências</li>
          <li><strong>Informações de contato:</strong> Nome completo, e-mail, telefone</li>
          <li><strong>Declaração de boa-fé</strong> de que o uso não foi autorizado</li>
          <li><strong>Declaração de veracidade</strong> de que as informações são verdadeiras</li>
        </ol>
      </>
    ),
  },
  {
    id: "processo-analise",
    title: "5. Processo de Análise",
    content: (
      <>
        <p>Ao receber uma denúncia válida:</p>
        <ol>
          <li>Analisaremos em até 5 dias úteis</li>
          <li>Notificaremos o Vendedor sobre a denúncia</li>
          <li>Suspenderemos temporariamente o checkout durante a investigação</li>
          <li>Solicitaremos ao Vendedor prova de autorização ou licença</li>
        </ol>
        <p><strong>5.1 Se Confirmada:</strong> Checkout permanentemente removido, Vendedor notificado, reincidência leva à suspensão da conta.</p>
        <p><strong>5.2 Se NÃO Confirmada:</strong> Checkout reativado, denunciante notificado sobre a decisão.</p>
      </>
    ),
  },
  {
    id: "contranotificacao",
    title: "6. Contranotificação (Vendedor)",
    content: (
      <>
        <p>Se você é Vendedor e acredita que seu checkout foi removido por engano, envie contranotificação para <strong>suporte@risecheckout.com</strong> com:</p>
        <ol>
          <li>Identificação do checkout removido (URL, nome do produto)</li>
          <li>Prova de autorização (licença, contrato, autorização por escrito)</li>
          <li>Declaração de boa-fé de que possui os direitos</li>
          <li>Suas informações de contato</li>
        </ol>
      </>
    ),
  },
  {
    id: "tres-strikes",
    title: "7. Política de Três Strikes",
    content: (
      <table>
        <thead><tr><th>Violação</th><th>Consequência</th></tr></thead>
        <tbody>
          <tr><td>1ª Violação</td><td>Remoção do checkout + Aviso</td></tr>
          <tr><td>2ª Violação</td><td>Remoção + Suspensão temporária (30 dias)</td></tr>
          <tr><td>3ª Violação</td><td>Banimento permanente da plataforma</td></tr>
        </tbody>
      </table>
    ),
  },
  {
    id: "limitacao",
    title: "8. Limitação de Responsabilidade",
    content: (
      <p>O RiseCheckout NÃO é responsável por violações cometidas por Vendedores, danos causados a titulares de direitos, ou disputas entre titulares e Vendedores. O RiseCheckout é apenas a tecnologia de checkout. No entanto, agiremos prontamente ao receber denúncias válidas.</p>
    ),
  },
  {
    id: "cooperacao",
    title: "9. Cooperação com Autoridades",
    content: (
      <p>O RiseCheckout cooperará plenamente com autoridades policiais em investigações de pirataria, ordens judiciais de remoção de conteúdo e titulares de direitos em processos legais contra infratores.</p>
    ),
  },
  {
    id: "alteracoes",
    title: "10. Alterações nesta Política",
    content: (
      <p>Podemos atualizar esta Política a qualquer momento. Quando possível, notificaremos por e-mail sobre mudanças significativas. É responsabilidade do usuário revisar periodicamente.</p>
    ),
  },
  {
    id: "contato",
    title: "11. Contato",
    content: (
      <>
        <p>E-mail: <strong>suporte@risecheckout.com</strong></p>
        <p>Endereço: Rua 11, Quadra 257, N 5, Dalva 4, Luziânia/GO, CEP 72821-150</p>
        <p>CNPJ: 58.566.585/0001-91 — Rise Community LTDA</p>
      </>
    ),
  },
];

function PoliticaDeDireitosAutorais() {
  return (
    <>
      <Helmet>
        <title>Política de Direitos Autorais | RiseCheckout</title>
        <meta name="description" content="Como o RiseCheckout protege a propriedade intelectual e lida com denúncias de violação de direitos autorais." />
      </Helmet>
      <LegalPageLayout
        icon={<Scale className="w-6 h-6" />}
        title="Política de Direitos Autorais"
        lastUpdated="06 de fevereiro de 2026"
        sections={SECTIONS}
      />
    </>
  );
}

export default PoliticaDeDireitosAutorais;
