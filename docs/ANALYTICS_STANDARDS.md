# Padrões de Analytics - RiseCheckout

> **Versão:** 1.0  
> **Atualizado:** 2026-01-21  
> **Mantenedor:** Lead Architect

---

## Contagem de Visitas

### Total de Visitas
- **Definição:** Cada registro em `checkout_visits` = 1 visita
- **Deduplicação:** Nenhuma - conta pageviews totais
- **Limite de Query:** 50.000 registros por consulta (removido limite padrão de 1000)

### Visitantes Únicos

#### Método Atual: Hash Híbrido
- **Fórmula:** `hash(IP + User-Agent[0:50] + Data)`
- **Fallback quando IP é NULL:** `hash("unknown" + User-Agent + Data)`
- **Precisão estimada:** 80-85%
- **Justificativa:** 98.9% dos registros históricos têm `ip_address = NULL`

#### Limitações Conhecidas
| Limitação | Impacto | Mitigação |
|-----------|---------|-----------|
| IPs compartilhados (NAT) | Subestima usuários | User-Agent diferencia dispositivos |
| Mesmo dispositivo em dias diferentes | Conta como visitantes diferentes | Aceitável para analytics diário |
| VPNs | Pode contar mesmo usuário como diferente | Baixo impacto na prática |

### Futuro: FingerprintJS (Roadmap)
- **Prioridade:** Média
- **Implementação:** Adicionar fingerprint no checkout público
- **Armazenamento:** Nova coluna `visitor_id` em `checkout_visits`
- **Precisão esperada:** 95%+

---

## Fontes de Tráfego (UTM)

### Agregação
- Baseada no campo `utm_source` da tabela `checkout_visits`
- Valor padrão quando vazio: "Direto"
- Top 10 fontes ordenadas por volume

### Fontes Comuns
| Fonte | Descrição |
|-------|-----------|
| `Direto` | Acesso direto ou sem UTM |
| `google` | Google Ads / Orgânico |
| `facebook` | Meta Ads |
| `instagram` | Instagram Ads |
| `youtube` | YouTube Ads |
| `email` | Campanhas de email |

---

## Taxa de Conversão

### Fórmula
```
Taxa = (Pedidos Pagos / Total de Visitas) × 100
```

### Considerações
- Apenas pedidos com `status = 'paid'` são contados
- O período de visitas e pedidos deve ser o mesmo
- Arredondamento: 2 casas decimais

---

## Limites de Query

| Tabela | Limite Padrão Supabase | Limite Configurado |
|--------|------------------------|-------------------|
| `checkout_visits` | 1000 | 50.000 |
| `orders` | 1000 | 50.000 |

**Nota:** Para períodos muito longos (>1 ano), considerar implementar agregação no banco via RPC.

---

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0 | 2026-01-21 | Documento inicial - Hash híbrido para visitantes únicos |
