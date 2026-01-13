/**
 * Rate Limiting Middleware
 * 
 * Protege contra ataques de brute force e abuso de API
 * Usa Supabase como armazenamento de tentativas
 * 
 * Baseado em OWASP Top 10 - Authentication Failures (#7)
 * RISE Protocol Compliant
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// deno-lint-ignore no-explicit-any
type SupabaseClientGeneric = { from: (table: string) => any };

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  identifier: string;
  action: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

interface RateLimitAttempt {
  id: string;
  identifier: string;
  action: string;
  success: boolean;
  created_at: string;
}

export async function checkRateLimit(
  supabase: SupabaseClientGeneric,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxAttempts, windowMs, identifier, action } = config;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  const { data: attempts, error } = await (supabase as any)
    .from('rate_limit_attempts')
    .select('*')
    .eq('identifier', identifier)
    .eq('action', action)
    .gte('created_at', windowStart.toISOString())
    .order('created_at', { ascending: false }) as { data: RateLimitAttempt[] | null; error: any };

  if (error) {
    console.error('Error checking rate limit:', error);
    return {
      allowed: true,
      remaining: maxAttempts,
      resetAt: new Date(now.getTime() + windowMs),
    };
  }

  const attemptCount = attempts?.length || 0;
  const remaining = Math.max(0, maxAttempts - attemptCount);
  const allowed = attemptCount < maxAttempts;

  let resetAt = new Date(now.getTime() + windowMs);
  let retryAfter: number | undefined;

  if (!allowed && attempts && attempts.length > 0) {
    const oldestAttempt = new Date(attempts[attempts.length - 1].created_at);
    resetAt = new Date(oldestAttempt.getTime() + windowMs);
    retryAfter = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);
  }

  return {
    allowed,
    remaining,
    resetAt,
    retryAfter,
  };
}

export async function recordAttempt(
  supabase: SupabaseClientGeneric,
  config: RateLimitConfig,
  success: boolean = false
): Promise<void> {
  const { identifier, action } = config;

  const { error } = await (supabase as any)
    .from('rate_limit_attempts')
    .insert({
      identifier,
      action,
      success,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error recording attempt:', error);
  }

  const cleanupDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await (supabase as any)
    .from('rate_limit_attempts')
    .delete()
    .lt('created_at', cleanupDate.toISOString());
}

export async function rateLimitMiddleware(
  req: Request,
  config: RateLimitConfig
): Promise<Response | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const result = await checkRateLimit(supabase, config);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': result.retryAfter?.toString() || '900',
          'X-RateLimit-Limit': config.maxAttempts.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetAt.toISOString(),
        },
      }
    );
  }

  return null;
}

export function getIdentifier(req: Request, preferUserId: boolean = false): string {
  if (preferUserId) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub) return `user:${payload.sub}`;
      } catch (e) {
        // Ignorar erros de parsing
      }
    }
  }

  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  
  return `ip:${ip.split(',')[0].trim()}`;
}
