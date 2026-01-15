/**
 * EnvironmentSelector - Seletor de ambiente Sandbox/Produção
 */

import type { PushinPayEnvironment } from '../types';

interface EnvironmentSelectorProps {
  environment: PushinPayEnvironment;
  onEnvironmentChange: (env: PushinPayEnvironment) => void;
  isAdmin: boolean;
}

export function EnvironmentSelector({
  environment,
  onEnvironmentChange,
  isAdmin,
}: EnvironmentSelectorProps) {
  if (!isAdmin) return null;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
        Ambiente
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onEnvironmentChange("sandbox")}
          className={`p-4 rounded-xl border-2 transition-all ${
            environment === "sandbox"
              ? "border-blue-500 bg-blue-500/10"
              : "border-border bg-background hover:border-blue-500/50"
          }`}
        >
          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Sandbox
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--subtext)' }}>
            Testes
          </div>
        </button>
        <button
          type="button"
          onClick={() => onEnvironmentChange("production")}
          className={`p-4 rounded-xl border-2 transition-all ${
            environment === "production"
              ? "border-green-500 bg-green-500/10"
              : "border-border bg-background hover:border-green-500/50"
          }`}
        >
          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Produção
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--subtext)' }}>
            Pagamentos reais
          </div>
        </button>
      </div>
    </div>
  );
}
