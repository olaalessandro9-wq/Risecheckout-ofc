/**
 * Data Retention Executor - Edge Function
 * 
 * Centralized data retention system for automated cleanup of:
 * - OAuth states (1 hour)
 * - Producer/Buyer sessions (expired + 7 days)
 * - Vault access logs (90 days)
 * - Key rotation logs (365 days)
 * - GDPR data (90/365 days)
 * - Rate limits (24 hours)
 * - Legacy tables (various)
 * 
 * RISE Protocol V3 Compliant:
 * - Under 300 lines (this file: ~90 lines)
 * - Zero unnecessary `any` types
 * - Single Responsibility: Router only
 * 
 * @module data-retention-executor
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import type { CleanupRequest, CleanupCategory } from './types.ts';
import { RETENTION_POLICIES } from './types.ts';
import { createLogger } from '../_shared/logger.ts';

const log = createLogger('DataRetentionExecutor');
import { 
  executeFullCleanup, 
  executeCategoryCleanup, 
  executeDryRun 
} from './handlers/execute-cleanup.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Valid categories for validation */
const VALID_CATEGORIES: CleanupCategory[] = ['oauth', 'sessions', 'security', 'gdpr', 'rate_limit', 'debug', 'all'];

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request
    const body = await req.json() as CleanupRequest;
    const { action, category } = body;

    // Validate action
    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing action parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route to appropriate handler
    switch (action) {
      case 'run-all': {
        const result = await executeFullCleanup();
        return new Response(
          JSON.stringify(result),
          { status: result.success ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'run-category': {
        if (!category || !VALID_CATEGORIES.includes(category)) {
          return new Response(
            JSON.stringify({ success: false, error: `Invalid category. Valid: ${VALID_CATEGORIES.join(', ')}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const result = await executeCategoryCleanup(category);
        return new Response(
          JSON.stringify(result),
          { status: result.success ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'dry-run': {
        const result = await executeDryRun();
        return new Response(
          JSON.stringify(result),
          { status: result.success ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'status': {
        return new Response(
          JSON.stringify({
            success: true,
            timestamp: new Date().toISOString(),
            policies: RETENTION_POLICIES,
            categories: VALID_CATEGORIES.filter(c => c !== 'all'),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    log.error('Error', { error: errorMessage });
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
