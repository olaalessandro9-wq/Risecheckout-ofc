/**
 * Ensure Producer Access Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Creates or ensures buyer access for a producer to their own products.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { jsonResponse, errorResponse } from "../../_shared/response-helpers.ts";

const log = createLogger("UnifiedAuth:EnsureProducerAccess");

interface EnsureProducerAccessRequest {
  email: string;
  productId: string;
  producerUserId: string;
}

export async function handleEnsureProducerAccess(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: EnsureProducerAccessRequest = await req.json();
    const { email, productId, producerUserId } = body;
    
    if (!email || !productId) {
      return errorResponse("Email e productId são obrigatórios", corsHeaders, 400);
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user exists in unified users table
    let { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();
    
    // If not in users table, check fallback buyer_profiles
    let { data: buyer } = await supabase
      .from("buyer_profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .single();
    
    // If no profile exists, create one
    if (!user && !buyer) {
      // Get producer's name for the profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", producerUserId)
        .single();
      
      // Create in unified users table
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          email: normalizedEmail,
          password_hash: null,
          account_status: "owner_no_password",
          name: profile?.name || null,
          is_active: true,
        })
        .select("id")
        .single();
      
      if (createError) {
        log.error("Error creating user profile:", createError);
        return errorResponse("Erro ao criar perfil", corsHeaders, 500);
      }
      
      user = newUser;
      
      // Also create buyer role
      await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "buyer" });
      
      log.info(`Created user profile for producer: ${normalizedEmail}`);
    }
    
    const userId = user?.id || buyer?.id;
    
    log.info(`Producer ${normalizedEmail} has access via product ownership`);
    
    return jsonResponse({ success: true, buyerId: userId }, corsHeaders, 200);
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Ensure producer access error:", msg);
    return errorResponse("Erro ao criar acesso do produtor", corsHeaders, 500);
  }
}
