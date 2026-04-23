# Quem loga com quem

**Senha de TODOS:** `Teste@123`

## ⚠️ Atenção ao swap Caio ↔ Alef

No seed técnico, o usuário CPF `90000000001` tem nome "Alef Almeida" e o CPF `90000000012` tem nome "Caio Nunes". Por decisão da equipe, **invertemos as pessoas que executam esses papéis**:

- O bolsista **Caio Nunes** loga com CPF `90000000001` (admin). No sistema aparecerá "Alef Almeida" no cabeçalho — ignore, é só o nome do usuário do seed.
- O bolsista **Alef Almeida** loga com CPF `90000000012` (proponente). No sistema aparecerá "Caio Nunes" no cabeçalho — também ignore.

Os outros bolsistas batem com o nome do seed.

---

## Tabela completa

| Bolsista (pessoa real) | CPF/CNPJ de login | Role | Nome no sistema |
|------------------------|-------------------|------|-----------------|
| Caio Nunes | `90000000001` | ADMIN | Alef Almeida |
| Gabriel Barauna | `90000000002` | ADMIN | Gabriel Barauna |
| Giovane Neves | `90000000003` | HABILITADOR | Giovane Neves |
| Iago William | `90000000004` | HABILITADOR | Iago William |
| José Henrique | `90000000005` | HABILITADOR | José Henrique |
| Larissa Miranda | `90000000006` | AVALIADOR | Larissa Miranda |
| Mariana Franca | `90000000007` | AVALIADOR | Mariana Franca |
| Gislaine Santos | `90000000008` | AVALIADOR | Gislaine Santos |
| Rafael Muniz | `90000000009` | AVALIADOR | Rafael Muniz |
| Caio Alves | `90000000010` | ATENDIMENTO | Caio Alves |
| Jorge Roberto | `90000000011` | ATENDIMENTO | Jorge Roberto |
| Alef Almeida | `90000000012` | PROPONENTE (PF) | Caio Nunes |
| Cauã Gomes | `90000000013` | PROPONENTE (PF) | Cauã Gomes |
| Eduardo Pereira | `12300000000100` | PROPONENTE (MEI) | Eduardo Pereira |
| Atus Batista | `12300000000200` | PROPONENTE (PJ) | Atus Batista |
| Jeovani Nunes | `12300000000300` | PROPONENTE (COLETIVO) | Jeovani Nunes |
| João Alves | — (gera em 4devs) | PROPONENTE (PF) | você mesmo |
| Juan Teles | — (gera em 4devs) | PROPONENTE (PF) | você mesmo |
| Felipe Gomes | — (gera em 4devs) | PROPONENTE (PF) | você mesmo |

---

## Auto-cadastro (João, Juan, Felipe)

Vocês **não têm usuário pré-criado** — vão gerar um CPF fictício em https://www.4devs.com.br/gerador_de_cpf e criar sua conta em `/cadastro`. Depois, anote o CPF que você usou em `CPFs-gerados-4devs.md` (nesta mesma pasta) pra gente rastrear depois.
