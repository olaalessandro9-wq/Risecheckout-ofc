
## Situação atual (prova objetiva)

Os logs da Vercel (print) mostram:

- `Rollup failed to resolve import "cropperjs/dist/cropper.css"`
- Origem: `src/components/ui/image-crop-dialog/ImageCropDialog.tsx`

O estado atual do repositório confirma a causa raiz:

- `package.json` **não** tem `cropperjs` em `dependencies`.
- `package-lock.json` contém `cropperjs` **apenas** em `node_modules/react-cropper/node_modules/cropperjs` (v1.6.2). Não existe `node_modules/cropperjs` na raiz.

### Por que isso quebra no build (root cause real)
O import no nosso código é:

```ts
import "cropperjs/dist/cropper.css";
```

Resolução Node/Vite para um “bare import” (`cropperjs/...`) procura `node_modules/cropperjs` subindo a árvore de diretórios.  
Ela **não** procura dentro de `node_modules/react-cropper/node_modules/cropperjs` (isso é dependência privada do pacote `react-cropper`). Logo:

- Se `cropperjs` não estiver instalado no topo do app, o bundler falha no build.
- Portanto, remover `cropperjs` do root tornou o import **irresolvível** na Vercel.

Isso explica por que continua falhando mesmo após a refatoração do componente unificado (a refatoração está correta; o problema agora é a topologia de dependências).

---

## Auditoria “código morto / legado” (estado atual)
- Não encontrei referências remanescentes aos componentes legados (busca por `ImageCropDialogProduct`, `BannerImageCropDialog`, `modules/members-area/components/dialogs/ImageCropDialog` retornou **0** matches).
- O uso de `ImageCropDialog` está centralizado via `@/components/ui/image-crop-dialog` em todos os consumidores encontrados.
- Documentação/comentários do módulo `image-crop-dialog/` estão consistentes (JSDoc, presets e tipos).

Conclusão: **não há legado aparente no código**, mas o build falha por dependência ausente/errada.

---

## Análise de Soluções (RISE V3 — Seção 4)

### Solução A: Reintroduzir `cropperjs` no root, fixar em v1.x e blindar com `overrides` (NPM)
- Manutenibilidade: 10/10 (dependência explícita onde é consumida; previsível)
- Zero DT: 10/10 (remove ambiguidade/hoisting; resolve na raiz)
- Arquitetura: 10/10 (grafo de deps correto; o app declara o que importa)
- Escalabilidade: 10/10 (evita regressões futuras com v2.x)
- Segurança: 10/10 (sem impacto em secrets; pacote MIT amplamente usado)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 10–20 minutos (com lockfile e validações)

### Solução B: Vite alias para apontar `cropperjs` para o caminho nested do `react-cropper`
- Manutenibilidade: 4/10 (acoplamento a layout interno do `node_modules`)
- Zero DT: 4/10 (quebra com qualquer mudança de instalação/dedupe)
- Arquitetura: 3/10 (config de build “enganando” resolução)
- Escalabilidade: 3/10
- Segurança: 10/10
- **NOTA FINAL: 4.5/10**
- Tempo estimado: 10–30 minutos

### Solução C: Copiar `cropper.css` para dentro do repositório (vendor) e importar localmente
- Manutenibilidade: 6/10 (você vira mantenedor de vendor CSS; atualizações manuais)
- Zero DT: 5/10 (risco de divergência; manutenção contínua)
- Arquitetura: 6/10 (funciona, mas aumenta superfície de manutenção)
- Escalabilidade: 6/10
- Segurança: 9/10 (ok, mas exige gestão de licença/atualizações)
- **NOTA FINAL: 6.0/10**
- Tempo estimado: 30–60 minutos (com licença e documentação)

### Solução D: Migrar de `react-cropper` para outra lib sem dependência no `cropperjs`/CSS externo
- Manutenibilidade: 8/10
- Zero DT: 8/10
- Arquitetura: 8/10
- Escalabilidade: 9/10
- Segurança: 10/10
- **NOTA FINAL: 8.4/10**
- Tempo estimado: 1–3 dias (migração + regressão + UX parity)

### DECISÃO: Solução A (Nota 10.0)
É a única que:
- Corrige o build pela causa raiz (dependência ausente no root)
- Impede retorno acidental ao `cropperjs@2.x`
- Mantém a arquitetura limpa e previsível para Vercel (npm) e para qualquer ambiente

---

## Plano de Execução (implementação)

### 1) Fixar dependência correta no `package.json`
- Adicionar `cropperjs` como dependência direta do app:
  - `"cropperjs": "1.6.2"` (versão exata, sem `^`, para impedir upgrades sem auditoria)
- Adicionar seção `overrides` (NPM) para **bloquear** qualquer transitive para v2.x:
  - `"overrides": { "cropperjs": "1.6.2" }`

Motivo: garante que *qualquer* pacote que puxar `cropperjs` no futuro também ficará preso em 1.6.2 (evita regressão silenciosa do build).

### 2) Atualizar `package-lock.json`
- Regerar lockfile para refletir:
  - `node_modules/cropperjs` presente no root
  - dedupe/override coerentes

### 3) Garantia de não-legado (auditoria final)
- Rodar busca por imports antigos (já validado por ferramentas aqui, mas repetir pós-change):
  - `ImageCropDialogProduct`
  - `BannerImageCropDialog`
  - caminhos antigos em `members-area/.../dialogs/ImageCropDialog`

### 4) Validação “sucesso total” (critérios de aceite)
- Vercel: build passa (sem “failed to resolve import cropperjs/dist/cropper.css”)
- App: abrir os fluxos que usam crop:
  - Produtos: `ImageSelector` → selecionar imagem → crop preset `product`
  - Members area: add/edit módulo → crop preset `module`
  - Members area builder: banner/fixed header → crop preset `banner`
- Verificar ausência de warnings/erros de runtime relacionados ao cropper.

---

## Observação de conformidade RISE (Segurança — Seção 3)
O `.gitignore` já ignora `.env`, então o repositório está preparado para não commitar secrets. Em paralelo ao fix do build, a prática correta é garantir que Vercel use variáveis de ambiente no painel (e que `.env` não seja versionado). Isso não bloqueia o build atual, mas é requisito de segurança “non-negotiable”.

---

## Arquivos que serão modificados (quando eu implementar)
- `package.json` (adicionar `cropperjs` e `overrides`)
- `package-lock.json` (atualização consistente com npm)
