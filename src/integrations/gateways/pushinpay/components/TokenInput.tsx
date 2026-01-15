/**
 * TokenInput - Campo de input para API Token com toggle de visibilidade
 */

import { Eye, EyeOff } from 'lucide-react';

interface TokenInputProps {
  apiToken: string;
  onTokenChange: (value: string) => void;
  showToken: boolean;
  onToggleShowToken: () => void;
  placeholder?: string;
}

export function TokenInput({
  apiToken,
  onTokenChange,
  showToken,
  onToggleShowToken,
  placeholder = "Bearer token da PushinPay",
}: TokenInputProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
        API Token
      </label>
      <div className="relative">
        <input
          type={showToken ? "text" : "password"}
          value={apiToken}
          onChange={(e) => onTokenChange(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggleShowToken}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
        >
          {showToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
