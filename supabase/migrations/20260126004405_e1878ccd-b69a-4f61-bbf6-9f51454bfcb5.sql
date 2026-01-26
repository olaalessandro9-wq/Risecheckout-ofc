-- =====================================================
-- REFRESH LOCKS TABLE - Server-Side Refresh Coordination
-- Session Commander Architecture - RISE V3 10.0/10
-- =====================================================

-- Create table for atomic server-side refresh locking
CREATE TABLE IF NOT EXISTS refresh_locks (
  session_id UUID PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
  locked_by_tab TEXT NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment for documentation
COMMENT ON TABLE refresh_locks IS 'Server-side atomic locks for token refresh coordination across browser tabs (Session Commander)';
COMMENT ON COLUMN refresh_locks.session_id IS 'Session being refreshed';
COMMENT ON COLUMN refresh_locks.locked_by_tab IS 'Tab ID that holds the lock';
COMMENT ON COLUMN refresh_locks.expires_at IS 'Lock auto-expires after 30 seconds';

-- Index for efficient cleanup of expired locks
CREATE INDEX idx_refresh_locks_expires_at ON refresh_locks(expires_at);

-- Enable RLS
ALTER TABLE refresh_locks ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can manage locks
CREATE POLICY "Service role manages refresh locks"
  ON refresh_locks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to cleanup expired locks (called by cron or on-demand)
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_locks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM refresh_locks WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;