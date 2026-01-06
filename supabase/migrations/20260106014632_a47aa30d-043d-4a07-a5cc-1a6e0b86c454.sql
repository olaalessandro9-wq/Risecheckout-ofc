-- ============================================================================
-- STUDENT INVITE TOKENS
-- Stores single-use tokens for student invitations
-- ============================================================================

CREATE TABLE public.student_invite_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  buyer_id uuid NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  is_used boolean NOT NULL DEFAULT false
);

-- Index for fast token lookups
CREATE INDEX idx_student_invite_tokens_hash ON public.student_invite_tokens(token_hash);
CREATE INDEX idx_student_invite_tokens_buyer ON public.student_invite_tokens(buyer_id);
CREATE INDEX idx_student_invite_tokens_product ON public.student_invite_tokens(product_id);

-- Enable RLS
ALTER TABLE public.student_invite_tokens ENABLE ROW LEVEL SECURITY;

-- Producers can view tokens for their own products
CREATE POLICY "Producers can view own product invite tokens"
  ON public.student_invite_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = student_invite_tokens.product_id 
      AND products.user_id = auth.uid()
    )
  );

-- Producers can insert tokens for their own products
CREATE POLICY "Producers can create invite tokens for own products"
  ON public.student_invite_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = student_invite_tokens.product_id 
      AND products.user_id = auth.uid()
    )
  );

-- Producers can update tokens for their own products
CREATE POLICY "Producers can update invite tokens for own products"
  ON public.student_invite_tokens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = student_invite_tokens.product_id 
      AND products.user_id = auth.uid()
    )
  );

-- Comment for documentation
COMMENT ON TABLE public.student_invite_tokens IS 'Single-use tokens for inviting students to access products';