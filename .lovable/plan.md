
# Fix: Imagem Nao Aparece no ImageCropDialog (2 Bugs Identificados)

## Causa Raiz (Verificada no Codigo)

Existem **2 bugs** no componente reescrito que impedem a imagem de aparecer:

### Bug 1: ResizeObserver nunca observa o container (CRITICO)

O `useEffect` do `ResizeObserver` tem `[]` como dependencia (linha 147):

```text
useEffect(() => {
  const el = containerRef.current;   // <-- NULL no primeiro render!
  if (!el) return undefined;          // <-- Retorna aqui e nunca mais roda
  observer.observe(el);
  return () => observer.disconnect();
}, []);  // <-- Nunca re-executa
```

**Por que e null:** O componente `ImageCropDialog` e renderizado condicionalmente (`{fileToCrop && <ImageCropDialog .../>}`). Quando ele monta, o React ainda nao renderizou o conteudo do `Dialog` no DOM. O `containerRef.current` e `null` no momento do `useEffect`. Como a dependencia e `[]`, o efeito NUNCA roda novamente.

**Consequencia:** `containerSize` fica `null` para sempre. `stencilSize` fica `null`. `imageDisplaySize` fica `null`. A imagem renderiza com `opacity: 0` (linha 324) e nunca aparece.

### Bug 2: `onWheel` com `preventDefault` em event listener passivo

O erro do console ("Unable to preventDefault inside passive event listener invocation") ocorre porque o React adiciona event listeners de `wheel` como passivos por padrao. Chamar `e.preventDefault()` em um listener passivo gera um erro e o zoom nao funciona.

## Solucao

### Arquivo: `src/components/ui/image-crop-dialog/ImageCropDialog.tsx`

**Correcao do Bug 1:** Substituir o `useEffect` + `useRef` por um **callback ref**. Um callback ref e chamado automaticamente pelo React quando o elemento entra no DOM, garantindo que o `ResizeObserver` sempre observa o container:

```text
// ANTES (bugado):
const containerRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  const el = containerRef.current;  // NULL!
  if (!el) return;
  observer.observe(el);
}, []);

// DEPOIS (correto):
const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
const containerRef = useCallback((node: HTMLDivElement | null) => {
  setContainerEl(node);
}, []);
useEffect(() => {
  if (!containerEl) return;
  const observer = new ResizeObserver((entries) => { ... });
  observer.observe(containerEl);
  return () => observer.disconnect();
}, [containerEl]);
```

Quando o Dialog abre e o `<div ref={containerRef}>` entra no DOM, o callback ref e chamado com o elemento real. O `useState` atualiza, disparando o `useEffect` que configura o `ResizeObserver`. Resultado: `containerSize` e preenchido corretamente.

**Correcao do Bug 2:** Substituir o `onWheel` do JSX por um `addEventListener` direto com `{ passive: false }`:

```text
// ANTES (bugado):
<div onWheel={handleWheel}>  // React adiciona como passive

// DEPOIS (correto):
useEffect(() => {
  if (!containerEl) return;
  const handler = (e: WheelEvent) => {
    e.preventDefault();
    // logica de zoom...
  };
  containerEl.addEventListener("wheel", handler, { passive: false });
  return () => containerEl.removeEventListener("wheel", handler);
}, [containerEl]);
```

O `imageRef` tambem precisa ser um callback ref para funcionar com o container callback ref. Porem, como o `imageRef` so e usado no `handleSaveCrop` para exportar, ele pode permanecer como `useRef` normal -- o problema e apenas com o container.

## Resumo das Mudancas

- **Linha 114-115:** Substituir `useRef` do container por `useState` + callback ref
- **Linhas 131-147:** Reescrever `useEffect` do ResizeObserver para depender do `containerEl` do state
- **Linhas 186-192:** Remover `handleWheel` como callback separado; mover para `useEffect` com `addEventListener` nao-passivo
- **Linha 283-288:** Remover `onWheel`, `onTouchMove`, `onTouchEnd` do JSX; ambos movidos para `useEffect` com `addEventListener`

## Arvore de Arquivos

```text
src/components/ui/image-crop-dialog/
  ImageCropDialog.tsx   <-- EDITAR (2 bugs corrigidos)
  ImageCropDialog.css   <-- SEM MUDANCA
  cropExport.ts         <-- SEM MUDANCA
  presets.ts            <-- SEM MUDANCA
  types.ts              <-- SEM MUDANCA
  index.ts              <-- SEM MUDANCA
```

## Checkpoint de Qualidade (Secao 7.2)

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim -- callback ref e o padrao correto do React para elementos renderizados condicionalmente |
| Existe alguma solucao com nota maior? | Nao -- callback ref e a solucao canonica documentada pelo React |
| Isso cria divida tecnica? | Zero |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim -- callback refs sao API estavel do React |
| Estou escolhendo isso por ser mais rapido? | Nao -- e a unica forma correta |
