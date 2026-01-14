/**
 * Fallback Editor - Editor Genérico para Tipos Desconhecidos
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

interface FallbackEditorProps {
  componentType: string;
}

export function FallbackEditor({ componentType }: FallbackEditorProps) {
  return (
    <div className="p-4 border border-yellow-200 bg-yellow-50 rounded text-sm text-yellow-800">
      <p>Tipo de componente não suportado: <strong>{componentType}</strong></p>
      <p className="text-xs mt-1">Considere atualizar para o novo editor visual.</p>
    </div>
  );
}
