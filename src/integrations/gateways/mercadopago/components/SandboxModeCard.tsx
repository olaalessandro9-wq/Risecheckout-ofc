/**
 * SandboxModeCard Component
 * 
 * Card para configurar credenciais manuais (modo sandbox).
 * Apenas visível para admins.
 */

import { Loader2, Eye, EyeOff, FlaskConical } from 'lucide-react';
import type { ConnectionMode } from '../types';

interface SandboxModeCardProps {
  currentMode: ConnectionMode;
  accessToken: string;
  setAccessToken: (value: string) => void;
  publicKey: string;
  setPublicKey: (value: string) => void;
  showToken: boolean;
  setShowToken: (value: boolean) => void;
  showPublicKey: boolean;
  setShowPublicKey: (value: boolean) => void;
  savingSandbox: boolean;
  onSave: () => void;
}

export function SandboxModeCard({
  currentMode,
  accessToken,
  setAccessToken,
  publicKey,
  setPublicKey,
  showToken,
  setShowToken,
  showPublicKey,
  setShowPublicKey,
  savingSandbox,
  onSave,
}: SandboxModeCardProps) {
  const isDisabled = currentMode === 'production';
  const isActive = currentMode === 'sandbox';
  const canEdit = currentMode === 'none' || currentMode === 'sandbox';

  return (
    <div
      className={`rounded-xl border-2 p-5 transition-all ${
        currentMode === 'none'
          ? 'border-border hover:border-yellow-500/50'
          : isActive
          ? 'border-yellow-500/50 bg-yellow-500/5'
          : 'border-border opacity-50 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="bg-yellow-500/20 rounded-lg p-2">
          <FlaskConical className="h-6 w-6 text-yellow-500" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>
            🧪 Sandbox (Teste)
          </h4>
          <p className="text-sm mb-4" style={{ color: 'var(--subtext)' }}>
            Use credenciais de teste para validar sua integração. Pagamentos não são
            processados de verdade.
          </p>

          {isDisabled && (
            <p className="text-sm text-green-600 dark:text-green-400">
              ⚠️ Desconecte a Produção para usar Sandbox
            </p>
          )}

          {canEdit && (
            <div className="space-y-4 mt-4">
              {/* Access Token */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Access Token (Teste)
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    disabled={isActive}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                    placeholder="TEST-... ou APP_USR-..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Public Key */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Public Key (Teste)
                </label>
                <div className="relative">
                  <input
                    type={showPublicKey ? 'text' : 'password'}
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    disabled={isActive}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                    placeholder="TEST-... ou APP_USR-..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowPublicKey(!showPublicKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
                  >
                    {showPublicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {currentMode === 'none' && (
                <button
                  onClick={onSave}
                  disabled={savingSandbox || !accessToken || !publicKey}
                  className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2.5 px-4 rounded-lg transition-all disabled:opacity-50"
                >
                  {savingSandbox ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <FlaskConical className="h-4 w-4" />
                      <span>Ativar Sandbox</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
