/**
 * ApiKeyInput - Campo de input para API Key com toggle de visibilidade
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  isValidated: boolean;
  hasChanges: boolean;
}

export function ApiKeyInput({
  apiKey,
  onApiKeyChange,
  isValidated,
  hasChanges,
}: ApiKeyInputProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor="apiKey">API Key</Label>
      <div className="relative">
        <Input
          id="apiKey"
          type={showApiKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="$aact_..."
          className={cn(
            'pr-20',
            isValidated && !hasChanges && 'border-green-500 focus-visible:ring-green-500'
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          {isValidated && !hasChanges && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>
    </div>
  );
}
