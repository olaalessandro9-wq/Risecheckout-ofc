/**
 * AuthPageLoader - Unified loader for auth pages
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * This loader uses the auth theme (dark background) to prevent
 * the visual "flash" between Suspense fallback and component mount.
 * 
 * Before: PageLoader (light) → AuthThemeProvider + Loader2 (dark) = FLASH
 * After:  AuthPageLoader (dark) → AuthThemeProvider (dark) = SMOOTH
 * 
 * @module components/auth
 * @version 1.0.0
 */

import { Loader2 } from "lucide-react";

export function AuthPageLoader() {
  return (
    <div 
      className="dark min-h-screen w-full flex items-center justify-center bg-[hsl(var(--auth-bg))] text-[hsl(var(--auth-text-secondary))]"
      data-theme="auth"
    >
      <Loader2 className="w-8 h-8 text-[hsl(var(--auth-accent))] animate-spin" />
    </div>
  );
}
