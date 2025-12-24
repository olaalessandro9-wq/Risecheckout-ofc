/**
 * Mercado Pago Sync Helpers
 * 
 * Funções auxiliares para sincronizar campos customizados com
 * os campos hidden requeridos pelo SDK do Mercado Pago.
 * 
 * O SDK do Mercado Pago requer campos hidden no DOM para funcionar.
 * Estas funções abstraem essa lógica de sincronização.
 */

export interface MercadoPagoSyncData {
  cardholderName: string;
  cardholderDocument: string;
  installments: number;
}

/**
 * Sincroniza os campos customizados com os campos hidden do SDK do Mercado Pago.
 * 
 * O SDK do Mercado Pago requer que certos campos estejam presentes no DOM
 * com IDs específicos. Esta função atualiza esses campos hidden com os
 * valores dos campos customizados.
 */
export function syncMercadoPagoHiddenFields(data: MercadoPagoSyncData): void {
  const { cardholderName, cardholderDocument, installments } = data;
  
  // Limpar documento (remover máscara)
  const cleanDoc = cardholderDocument.replace(/\D/g, '');
  
  // Determinar tipo de documento
  const docType = cleanDoc.length > 11 ? 'CNPJ' : 'CPF';
  
  // Sincronizar campo de documento
  const hiddenDoc = document.getElementById('form-checkout__identificationNumber') as HTMLInputElement | null;
  if (hiddenDoc) {
    hiddenDoc.value = cleanDoc;
    hiddenDoc.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Sincronizar tipo de documento
  const hiddenType = document.getElementById('form-checkout__identificationType') as HTMLSelectElement | null;
  if (hiddenType) {
    hiddenType.value = docType;
    hiddenType.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Sincronizar nome do titular
  const hiddenName = document.getElementById('form-checkout__cardholderName') as HTMLInputElement | null;
  if (hiddenName) {
    hiddenName.value = cardholderName;
    hiddenName.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Sincronizar parcelas
  const hiddenInstallments = document.getElementById('form-checkout__installments') as HTMLSelectElement | null;
  if (hiddenInstallments) {
    hiddenInstallments.value = installments.toString();
    hiddenInstallments.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/**
 * Atualiza o select de parcelas do SDK do Mercado Pago.
 * 
 * Quando as parcelas são calculadas, precisamos atualizar o select
 * hidden do SDK com as opções disponíveis.
 */
export function updateMercadoPagoInstallmentsSelect(
  installmentsData: Array<{ installments: number }>,
  selectedInstallments: number
): void {
  const installmentsSelect = document.getElementById('form-checkout__installments') as HTMLSelectElement | null;
  
  if (!installmentsSelect) return;
  
  // Limpar opções existentes
  installmentsSelect.innerHTML = '';
  
  // Adicionar novas opções
  installmentsData.forEach(cost => {
    const option = document.createElement('option');
    option.value = cost.installments.toString();
    option.text = `${cost.installments}x`;
    installmentsSelect.appendChild(option);
  });
  
  // Selecionar valor atual
  installmentsSelect.value = selectedInstallments.toString();
}
