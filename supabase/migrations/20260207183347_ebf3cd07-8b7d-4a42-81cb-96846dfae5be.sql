
-- ============================================================================
-- Facebook CAPI: Failed Events Queue
-- ============================================================================
-- Tabela para persistir eventos que falharam após todas as tentativas de retry.
-- Acessada EXCLUSIVAMENTE via service_role (edge functions).
-- ============================================================================

CREATE TABLE public.failed_facebook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pixel_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_payload JSONB NOT NULL,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_retry_at TIMESTAMPTZ,
  reprocessed_at TIMESTAMPTZ
);

-- Index para busca de pendentes pelo reprocessador
CREATE INDEX idx_failed_fb_events_status_retry
  ON public.failed_facebook_events (status, last_retry_at)
  WHERE status = 'pending';

-- Index para cleanup de eventos antigos
CREATE INDEX idx_failed_fb_events_status_reprocessed
  ON public.failed_facebook_events (status, reprocessed_at)
  WHERE status = 'success';

-- RLS: DENY ALL (apenas service_role acessa)
ALTER TABLE public.failed_facebook_events ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy = nenhum acesso via anon/authenticated

-- ============================================================================
-- RPC: Buscar eventos pendentes para reprocessamento
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_pending_failed_facebook_events(p_limit INTEGER DEFAULT 50)
RETURNS SETOF public.failed_facebook_events
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.failed_facebook_events
  WHERE status = 'pending'
    AND retry_count < 10
    AND (last_retry_at IS NULL OR last_retry_at < now() - INTERVAL '1 hour')
  ORDER BY created_at ASC
  LIMIT p_limit;
$$;

-- ============================================================================
-- RPC: Marcar evento como reprocessado (sucesso ou incrementar retry)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.mark_facebook_event_reprocessed(
  p_event_id UUID,
  p_success BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_success THEN
    UPDATE public.failed_facebook_events
    SET status = 'success',
        reprocessed_at = now(),
        last_retry_at = now()
    WHERE id = p_event_id;
  ELSE
    UPDATE public.failed_facebook_events
    SET retry_count = retry_count + 1,
        last_retry_at = now(),
        status = CASE 
          WHEN retry_count + 1 >= 10 THEN 'failed'
          ELSE 'pending'
        END
    WHERE id = p_event_id;
  END IF;
END;
$$;

-- ============================================================================
-- RPC: Cleanup de eventos antigos (sucesso > 30 dias, failed > 90 dias)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_failed_facebook_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.failed_facebook_events
  WHERE (status = 'success' AND reprocessed_at < now() - INTERVAL '30 days')
     OR (status = 'failed' AND created_at < now() - INTERVAL '90 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
