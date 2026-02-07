-- Add CHECK constraint for status integrity on failed_facebook_events
ALTER TABLE public.failed_facebook_events
  ADD CONSTRAINT chk_failed_fb_events_status
  CHECK (status IN ('pending', 'reprocessing', 'success', 'failed'));