# Cronograma — 7 marcos

Datas pensadas pra caber em ~2 meses, pra exercitar todas as fases do UAT.
Ajuste os anos conforme a data real do teste (hoje: 2026-04-23).

| # | Marco | Data início | Data fim |
|---|-------|-------------|----------|
| 1 | **Publicação do edital** | 23/04/2026 | — |
| 2 | **Período de inscrições** | 25/04/2026 | 15/05/2026 |
| 3 | **Habilitação documental** | 16/05/2026 | 22/05/2026 |
| 4 | **Resultado da habilitação + Recursos** | 23/05/2026 | 27/05/2026 |
| 5 | **Avaliação de mérito** | 28/05/2026 | 10/06/2026 |
| 6 | **Resultado preliminar + Recursos** | 11/06/2026 | 18/06/2026 |
| 7 | **Resultado final** | 20/06/2026 | — |

---

## Como preencher no sistema

Dentro da criação do edital, na seção **Cronograma**, clique em "Adicionar marco" 7 vezes (ou use o botão "Carregar cronograma padrão" se existir) e preencha cada linha acima.

**Ordem obrigatória:** o sistema NÃO deve aceitar "Fim das inscrições" (15/05) antes de "Início das inscrições" (25/04). Se aceitar, reporte como BUG ALTO.

---

## Formato de data

O sistema aceita ISO 8601 (`2026-04-23`) ou data brasileira (`23/04/2026`). Teste os dois pra ver se converte.

## Datas para testar edge cases (opcional)

- Horário 00:00 vs 23:59 (início do dia vs fim do dia)
- Data no passado (sistema deve avisar/bloquear)
- Marco 4 (recursos) com duração = 0 (fim == início)
