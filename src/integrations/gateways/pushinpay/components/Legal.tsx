/**
 * Legal - Aviso Legal da PushinPay
 * Módulo: src/integrations/gateways/pushinpay
 * 
 * Componente de aviso legal sobre responsabilidades da PushinPay.
 * 
 * Migrado de: src/components/pix/PushinPayLegal.tsx
 */

export function Legal() {
  return (
    <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 text-sm">
      <p className="text-yellow-900 dark:text-yellow-100 font-medium mb-2">
        ⚠️ Aviso Legal Importante
      </p>
      <p className="text-yellow-800 dark:text-yellow-200">
        A <strong>PUSHIN PAY</strong> atua exclusivamente como processadora de pagamentos e{" "}
        <strong>não possui qualquer responsabilidade</strong> pela entrega, suporte, conteúdo,
        qualidade ou cumprimento das obrigações relacionadas aos produtos ou serviços oferecidos
        pelo vendedor.
      </p>
    </div>
  );
}
