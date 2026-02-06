/**
 * Política de Privacidade - RiseCheckout
 * Content source: user-uploaded document (06/02/2026)
 */

import { Helmet } from "react-helmet-async";
import { Shield } from "lucide-react";
import { LegalPageLayout, type LegalSection } from "./LegalPageLayout";
import { Link } from "react-router-dom";

const SECTIONS: LegalSection[] = [
  {
    id: "visao-geral",
    title: "Visão Geral",
    content: (
      <>
        <p><strong>A.</strong> Bem-vindo ao RiseCheckout! A sua privacidade é nossa prioridade. Esta Política de Privacidade explica de maneira clara como suas informações serão coletadas, usadas, compartilhadas e armazenadas.</p>
        <p><strong>B.</strong> Esta Política é de propriedade da <strong>Rise Community LTDA</strong>, inscrita no CNPJ <strong>58.566.585/0001-91</strong>, com sede na Rua 11, Quadra 257, N 5, Dalva 4, Luziânia/GO, CEP 72821-150.</p>
        <p><strong>C.</strong> Ao acessar ou usar o site, aplicativo ou serviços do RiseCheckout, você indica que está ciente e em total acordo com esta Política.</p>
        <p><strong>D.</strong> O RiseCheckout atua como plataforma de tecnologia de checkout, e NÃO como intermediadora financeira.</p>
        <p><strong>E.</strong> Este documento deve ser lido em conjunto com nossos <Link to="/termos-de-uso">Termos de Uso</Link> e <Link to="/termos-de-compra">Termos de Compra</Link>.</p>
      </>
    ),
  },
  {
    id: "informacoes-coletadas",
    title: "1. Informações Coletadas",
    content: (
      <>
        <p><strong>1.1. Informações que você nos fornece:</strong></p>
        <ul>
          <li><strong>Dados de Cadastro:</strong> Nome, e-mail, senha, CPF/CNPJ, data de nascimento, telefone, endereço.</li>
          <li><strong>Dados de Pagamento:</strong> Processados diretamente pelo gateway. O RiseCheckout NÃO armazena dados completos do cartão.</li>
          <li><strong>Informações de Autenticação:</strong> Foto do documento ou outras informações de verificação.</li>
          <li><strong>Conteúdo inserido na Plataforma:</strong> Informações sobre produtos, descrições, imagens, configurações.</li>
        </ul>
        <p><strong>1.2. Informações geradas automaticamente:</strong></p>
        <ul>
          <li><strong>Registros de Acesso:</strong> IP, data/hora, dispositivo, navegador, sistema operacional.</li>
          <li><strong>Dados de Uso:</strong> Páginas acessadas, cliques, tempo de permanência.</li>
          <li><strong>Dados de Transação:</strong> Valor, produto, data/hora das transações.</li>
          <li><strong>Geolocalização aproximada:</strong> Baseada no endereço IP.</li>
          <li><strong>Cookies:</strong> Para mais detalhes, consulte nossa <Link to="/politica-de-cookies">Política de Cookies</Link>.</li>
        </ul>
      </>
    ),
  },
  {
    id: "finalidade",
    title: "2. Finalidade do Uso das Informações",
    content: (
      <ul>
        <li>Viabilizar e operar os serviços da Plataforma</li>
        <li>Gerenciar contas de usuários e autenticação</li>
        <li>Processar transações (através dos gateways de pagamento)</li>
        <li><strong>Segurança e Prevenção à Fraude:</strong> Identificar, prevenir e responder a fraudes</li>
        <li><strong>Suporte ao Cliente:</strong> Ajudar com dúvidas e problemas técnicos</li>
        <li><strong>Comunicação:</strong> E-mails transacionais e de marketing (com consentimento)</li>
        <li><strong>Melhoria da Plataforma:</strong> Análises estatísticas e métricas de uso</li>
        <li><strong>Cumprimento de Obrigações Legais</strong></li>
      </ul>
    ),
  },
  {
    id: "bases-legais",
    title: "3. Bases Legais para Tratamento (LGPD)",
    content: (
      <ol>
        <li><strong>Execução de contrato</strong> (Art. 7º, V) — Para fornecer os serviços e processar transações</li>
        <li><strong>Cumprimento de obrigação legal</strong> (Art. 7º, II) — Obrigações fiscais e regulatórias</li>
        <li><strong>Exercício regular de direitos</strong> (Art. 7º, VI) — Defesa em processos judiciais</li>
        <li><strong>Legítimo interesse</strong> (Art. 7º, IX) — Melhoria dos serviços e prevenção a fraudes</li>
        <li><strong>Consentimento do titular</strong> (Art. 7º, I) — Comunicações de marketing</li>
        <li><strong>Proteção da vida</strong> (Art. 7º, VII) — Situações emergenciais</li>
      </ol>
    ),
  },
  {
    id: "compartilhamento",
    title: "4. Compartilhamento de Informações",
    content: (
      <>
        <p><strong>4.1.</strong> O RiseCheckout NÃO vende, NÃO aluga e NÃO compartilha dados pessoais com terceiros para fins comerciais sem consentimento expresso.</p>
        <p><strong>4.2.</strong> Podemos compartilhar suas informações com:</p>
        <ul>
          <li><strong>Gateways de Pagamento</strong> (Mercado Pago, Stripe) para processar transações</li>
          <li><strong>Produtores e Vendedores</strong> para entrega e suporte</li>
          <li><strong>Prestadores de serviços essenciais</strong> (Supabase, AWS, suporte técnico, antifraude)</li>
          <li><strong>Ferramentas de Analytics</strong> (Google Analytics)</li>
          <li><strong>Ferramentas de Marketing</strong> (Mailchimp)</li>
          <li><strong>Autoridades Públicas</strong> mediante solicitação legal válida</li>
          <li>Em caso de <strong>fusão, aquisição ou reestruturação</strong></li>
        </ul>
      </>
    ),
  },
  {
    id: "retencao",
    title: "5. Retenção e Exclusão de Dados",
    content: (
      <>
        <p><strong>5.1. Períodos de retenção:</strong></p>
        <table>
          <thead><tr><th>Tipo de Dado</th><th>Período</th><th>Base Legal</th></tr></thead>
          <tbody>
            <tr><td>Dados de cadastro</td><td>Conta ativa + 5 anos</td><td>Obrigação legal fiscal</td></tr>
            <tr><td>Dados de transações</td><td>5 anos</td><td>Obrigação contábil e fiscal</td></tr>
            <tr><td>Logs de acesso</td><td>6 meses</td><td>Marco Civil da Internet</td></tr>
            <tr><td>Dados de marketing</td><td>Até revogação</td><td>Consentimento</td></tr>
            <tr><td>Dados de suporte</td><td>2 anos após resolução</td><td>Legítimo interesse</td></tr>
          </tbody>
        </table>
        <p><strong>5.2.</strong> Você pode solicitar a exclusão de seus dados através do e-mail <strong>suporte@risecheckout.com</strong> ou pela nossa <Link to="/lgpd/esquecimento">página de Direito ao Esquecimento</Link>.</p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "6. Segurança da Informação",
    content: (
      <>
        <p><strong>6.1. Medidas técnicas:</strong></p>
        <ul>
          <li>Criptografia TLS/SSL em todas as comunicações</li>
          <li>Criptografia AES-256 para dados em repouso</li>
          <li>Autenticação de dois fatores (2FA)</li>
          <li>Firewall e sistemas de detecção de intrusão (IDS)</li>
          <li>Monitoramento contínuo 24/7</li>
          <li>Backups automáticos com redundância geográfica</li>
        </ul>
        <p><strong>6.2. Medidas organizacionais:</strong> Controle de acesso RBAC, treinamento de funcionários, auditorias periódicas, plano de resposta a incidentes.</p>
        <p><strong>6.3.</strong> Em caso de incidente de segurança, notificaremos a ANPD em até 2 dias úteis e os titulares afetados em prazo razoável.</p>
      </>
    ),
  },
  {
    id: "transferencia",
    title: "7. Transferência Internacional de Dados",
    content: (
      <p>Alguns fornecedores podem estar no exterior (AWS, Google Cloud). Garantimos conformidade com a LGPD através de cláusulas contratuais padrão aprovadas pela ANPD, verificação de proteção no país de destino e consentimento específico quando necessário.</p>
    ),
  },
  {
    id: "direitos-usuario",
    title: "8. Direitos do Usuário (LGPD)",
    content: (
      <>
        <p>Você, como titular dos dados, possui os seguintes direitos (Art. 18 da LGPD):</p>
        <ul>
          <li>Confirmação da existência de tratamento</li>
          <li>Acesso aos seus dados pessoais</li>
          <li>Correção de dados incompletos ou desatualizados</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
          <li>Portabilidade dos dados</li>
          <li>Eliminação dos dados tratados com consentimento</li>
          <li>Informação sobre entidades com as quais compartilhamos dados</li>
          <li>Revogação do consentimento</li>
          <li>Petição perante a ANPD</li>
          <li>Oposição a tratamento realizado sem consentimento</li>
          <li>Revisão de decisões automatizadas</li>
        </ul>
        <p>Para exercer seus direitos: <strong>suporte@risecheckout.com</strong>. Responderemos em até 15 dias úteis.</p>
      </>
    ),
  },
  {
    id: "anpd",
    title: "9. Direito de Petição perante a ANPD",
    content: (
      <p>Você tem o direito de apresentar reclamação diretamente à ANPD: <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">www.gov.br/anpd</a></p>
    ),
  },
  {
    id: "menores",
    title: "10. Menores de Idade",
    content: (
      <>
        <p><strong>10.1.</strong> O RiseCheckout não se destina a menores de 18 anos.</p>
        <p><strong>10.2.</strong> Não coletamos intencionalmente dados de menores. Se identificarmos tal situação, os dados serão prontamente excluídos.</p>
        <p><strong>10.3.</strong> Pais ou responsáveis devem contatar <strong>suporte@risecheckout.com</strong>.</p>
      </>
    ),
  },
  {
    id: "dados-pagamento",
    title: "11. Dados de Pagamento",
    content: (
      <>
        <p><strong>11.1.</strong> O RiseCheckout NÃO coleta, NÃO processa e NÃO armazena dados bancários ou de cartões de crédito. Todas as transações são realizadas por gateways terceirizados.</p>
        <p><strong>11.2.</strong> A segurança dos dados financeiros é de responsabilidade dos processadores de pagamento, que operam em conformidade com PCI DSS e LGPD.</p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "12. Cookies e Tecnologias Semelhantes",
    content: (
      <>
        <p>Utilizamos cookies para autenticação, preferências, análise de uso e funcionalidades essenciais. Para mais detalhes, consulte nossa <Link to="/politica-de-cookies">Política de Cookies</Link>.</p>
      </>
    ),
  },
  {
    id: "responsabilidades",
    title: "13. Responsabilidades Limitadas",
    content: (
      <>
        <p><strong>13.1.</strong> O RiseCheckout NÃO se responsabiliza por conteúdos, produtos ou serviços oferecidos por terceiros.</p>
        <p><strong>13.2.</strong> Decisões comerciais são de inteira responsabilidade do usuário.</p>
        <p><strong>13.3.</strong> Nos isentamos de responsabilidade por perdas decorrentes de indisponibilidade temporária, falhas de terceiros ou força maior.</p>
      </>
    ),
  },
  {
    id: "alteracoes",
    title: "14. Alterações nesta Política",
    content: (
      <>
        <p><strong>14.1.</strong> Podemos atualizar esta Política a qualquer momento.</p>
        <p><strong>14.2.</strong> Alterações substanciais serão comunicadas por e-mail ou pela Plataforma.</p>
        <p><strong>14.3.</strong> O uso contínuo da Plataforma representa aceitação da nova versão.</p>
      </>
    ),
  },
  {
    id: "contato",
    title: "15. Contato",
    content: (
      <>
        <p>E-mail: <strong>suporte@risecheckout.com</strong></p>
        <p>Endereço: Rua 11, Quadra 257, N 5, Dalva 4, Luziânia/GO, CEP 72821-150</p>
        <p>CNPJ: 58.566.585/0001-91</p>
        <p>Responderemos em até 15 dias úteis.</p>
        <p>Esta Política está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
      </>
    ),
  },
];

function PoliticaDePrivacidade() {
  return (
    <>
      <Helmet>
        <title>Política de Privacidade | RiseCheckout</title>
        <meta name="description" content="Como o RiseCheckout coleta, usa, compartilha e protege seus dados pessoais. Em conformidade com a LGPD." />
      </Helmet>
      <LegalPageLayout
        icon={<Shield className="w-6 h-6" />}
        title="Política de Privacidade"
        lastUpdated="06 de fevereiro de 2026"
        sections={SECTIONS}
      />
    </>
  );
}

export default PoliticaDePrivacidade;
