# 🛡️ Backup do Layout Minimalista (Versão Final)

Este arquivo documenta o backup de segurança do layout minimalista do checkout, criado em **10 de Dezembro de 2025**.

## 📂 Localização do Backup
Os arquivos originais e funcionais deste layout estão salvos na pasta:
`./layout_backup_minimalist_v1/`

## 🎨 O que este layout contém?
Este é o layout "Minimalista Premium" aprovado, com as seguintes características:
1.  **Seção de Pagamento:** Limpa, sem blocos pesados, com a caixa "Liberação Imediata" estilo lateral colorido.
2.  **Order Bumps:** Tamanho equilibrado (não gigante), com imagens de 80px.
3.  **Resumo do Pedido:**
    *   Envolto em caixa com borda arredondada.
    *   Linhas divisórias sólidas (visíveis no Dark Mode).
    *   Preço do produto principal abaixo do nome (alinhado à esquerda).
    *   Fontes ajustadas para legibilidade (mesmo em caixa baixa).
4.  **Ofertas Limitadas:** Cabeçalho com ícone de raio e divisor superior.

## 🛠️ Como Restaurar este Layout
Se o checkout quebrar ou o design for alterado acidentalmente, você (ou qualquer IA) pode restaurar o visual original copiando os arquivos da pasta de backup de volta para a pasta de componentes.

### Comando Rápido para Restaurar (Linux/Mac/Git Bash):
```bash
cp -r layout_backup_minimalist_v1/components/* src/components/checkout/shared/
```

### Arquivos Críticos e suas Funções:

| Arquivo | Função no Layout |
| :--- | :--- |
| `SharedCheckoutLayout.tsx` | Estrutura geral, divisores entre seções e espaçamentos principais. |
| `SharedOrderSummary.tsx` | A caixa de resumo do pedido, total, cupom e lista de produtos. |
| `SharedOrderBumps.tsx` | A lista de ofertas extras (Order Bumps) com o design equilibrado. |
| `SharedProductSection.tsx` | O cabeçalho do produto principal (topo da página) com a fonte ajustada. |

---
**Nota para IAs futuras:** Ao trabalhar neste projeto, **SEMPRE** consulte esta pasta antes de fazer alterações drásticas no design. Se o usuário pedir para "voltar como era antes", use estes arquivos como fonte da verdade.
