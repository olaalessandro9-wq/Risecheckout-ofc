// ✅ P0-7: Endpoint protegido com autenticação e validação de ownership
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // ✅ 1. AUTENTICAR USUÁRIO
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ✅ 2. VALIDAR REQUEST
    const { bucket, paths } = await request.json();

    if (!bucket || !Array.isArray(paths) || paths.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Bad request: bucket and paths are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ✅ P2: LIMITE DE PATHS (DoS protection)
    const MAX_PATHS = 50;
    if (paths.length > MAX_PATHS) {
      console.warn('[storage/remove] Too many paths:', { count: paths.length, max: MAX_PATHS });
      return new Response(
        JSON.stringify({ error: `Too many paths: maximum ${MAX_PATHS} allowed, received ${paths.length}` }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ✅ 3. VALIDAR BUCKET
    const allowedBuckets = ['products', 'checkouts', 'avatars', 'product-images'];
    if (!allowedBuckets.includes(bucket)) {
      return new Response(
        JSON.stringify({ error: `Forbidden: bucket '${bucket}' is not allowed` }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ✅ 4. VALIDAR OWNERSHIP (paths devem começar com user.id)
    const invalidPaths = paths.filter(path => {
      // Paths devem estar no formato: {user_id}/...
      return !path.startsWith(`${user.id}/`);
    });

    if (invalidPaths.length > 0) {
      console.warn('[storage/remove] Forbidden paths:', { 
        user_id: user.id, 
        invalid: invalidPaths 
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden: cannot delete files from other users',
          invalid_paths: invalidPaths
        }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ✅ 5. DELETAR COM SEGURANÇA
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      console.error('[storage/remove] Error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[storage/remove] Success:', { 
      user_id: user.id, 
      bucket, 
      count: paths.length 
    });

    return new Response(
      JSON.stringify({ success: true, removed: data }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[storage/remove] Exception:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// ❌ REMOVER função antiga vulnerável
// export async function removeStorageFileHandler(path: string) { ... }
