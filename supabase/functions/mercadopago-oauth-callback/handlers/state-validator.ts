/**
 * State Validator Handler
 * 
 * Responsabilidade: Validar state/nonce anti-CSRF na tabela oauth_states
 * 
 * @module mercadopago-oauth-callback/handlers/state-validator
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";

const log = createLogger("mercadopago-oauth-callback");

export interface OAuthStateRecord {
  state: string;
  vendor_id: string;
  used_at: string | null;
  expires_at: string;
}

export interface StateValidationResult {
  valid: boolean;
  vendorId?: string;
  error?: string;
}

/**
 * Valida o state OAuth na tabela oauth_states
 * - Verifica se existe
 * - Verifica se não foi usado
 * - Verifica se não expirou
 * - Marca como usado imediatamente (previne replay attack)
 */
export async function validateOAuthState(
  supabase: SupabaseClient,
  state: string
): Promise<StateValidationResult> {
  log.info('Validando state na tabela oauth_states...');

  try {
    // Buscar state válido (não usado e não expirado)
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (stateError || !oauthState) {
      log.error('State inválido, expirado ou já usado:', { state });
      return {
        valid: false,
        error: 'Sessão expirada ou inválida. Por favor, tente novamente.'
      };
    }

    const stateRecord = oauthState as OAuthStateRecord;
    const vendorId = stateRecord.vendor_id;
    log.info('State validado!', { vendorId });

    // Marcar state como usado IMEDIATAMENTE (previne replay attack)
    const { error: updateStateError } = await supabase
      .from('oauth_states')
      .update({ used_at: new Date().toISOString() })
      .eq('state', state);

    if (updateStateError) {
      log.warn('Erro ao marcar state como usado:', { error: updateStateError });
      // Continuar mesmo assim, pois a validação já passou
    }

    return {
      valid: true,
      vendorId
    };

  } catch (error) {
    log.error('Exception ao validar state:', { error });
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Erro ao validar sessão'
    };
  }
}
