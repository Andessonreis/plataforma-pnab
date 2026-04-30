# 00 — LEIA PRIMEIRO

Bem-vindo ao UAT do **Portal PNAB Irecê**. Este é o material oficial de testes.

---

## Acessos

- **URL do sistema:** https://culturaeturismo.irece.ba.gov.br
- **Senha padrão (todos os usuários do seed):** `Teste@123`
- **Planilha de testes:** [PREENCHA O LINK DO GOOGLE SHEETS AQUI]
- **Canal de dúvidas:** [PREENCHA O LINK DO GRUPO WHATSAPP/TELEGRAM]
- **Prazo:** [PREENCHA — recomendo 48h a partir do kickoff]

---

## Antes de começar

1. Leia este documento inteiro.
2. Leia as linhas `LEIA`, `REPORT_TEMPLATE`, `FILOSOFIA` e `IDEIAS_ATAQUE` no topo da planilha.
3. Identifique seu nome na coluna `Bolsista` — só faça as tarefas atribuídas a você.
4. Respeite a **ordem das fases** (veja seção abaixo). Algumas tarefas dependem de outras já feitas.
5. Use o CPF/CNPJ e senha da sua linha para logar.

---

## Ordem de execução (Fases)

| Fase | O que acontece | Quem |
|------|----------------|------|
| **1** | Admin cria editais, categorias, notícias, slides, equipe | Caio Nunes, Gabriel Barauna |
| **2** | Bolsistas auto-cadastrados criam suas próprias contas | João Alves, Juan Teles, Felipe Gomes, Jeovani Nunes |
| **3** | Proponentes se inscrevem nos editais abertos | Alef Almeida, Cauã Gomes, Eduardo Pereira, Jeovani Nunes, João Alves, Juan Teles |
| **4** | Habilitadores analisam e decidem inscrições | Giovane Neves, Iago William, José Henrique |
| **5** | Avaliadores lançam notas | Larissa Miranda, Mariana Franca, Gislaine Santos, Rafael Muniz |
| **6** | Proponentes acompanham resultado e interpõem recurso | Atus Batista, Jeovani Nunes |
| **7** | Admin decide recursos | Caio Nunes |
| **8** | Atendimento responde tickets (pode rodar em paralelo) | Caio Alves, Jorge Roberto |
| **9** | Transversal — UX, segurança, performance, acessibilidade | Todos |

**Dica:** se sua tarefa depende de outra (coluna `Depende_de` na planilha), espere seu colega sinalizar no grupo antes de começar.

---

## Como reportar um bug

1. Na linha da tarefa, mude `Status` de `PENDENTE` para `BUG`.
2. Preencha `Descricao_do_bug_ou_observacao` usando o **template de bug** (tem um exemplo na linha `REPORT_TEMPLATE` da planilha).
3. Preencha `Severidade` (BLOQUEADOR / ALTO / MEDIO / BAIXO / SUGESTAO / DUVIDA).
4. Preencha `URL_onde_aconteceu`, `Navegador_SO_Dispositivo` e `Timestamp`.
5. Tire um **screenshot** da tela e suba em:
   `04-Screenshots-bugs/<Seu-Nome>/T###-<descricao-curta>.png`
6. Cole o link público do screenshot em `Screenshot_ou_link`.

### Escala de severidades (exemplos reais)

| Severidade | Exemplo |
|------------|---------|
| **BLOQUEADOR** | Botão "Enviar inscrição" não funciona. Vaza dados de outro usuário. Login não aceita CPF correto. |
| **ALTO** | Upload de PDF válido dá erro. Habilitação não manda email. Cálculo da nota total está errado. |
| **MEDIO** | Filtro da fila não funciona em um caso específico. Busca não ignora acentos. |
| **BAIXO** | Texto desalinhado no rodapé. Typo em uma página. Ícone trocado. |
| **SUGESTAO** | "Seria útil ter um atalho de teclado para salvar rascunho". |
| **DUVIDA** | "Vi isso e não sei se é bug — quero opinião". |

---

## Exploração livre (depois das tarefas)

Após terminar suas tarefas atribuídas, vá pra sua linha `EXPLIVRE-<nome>-01` no final da planilha e **tente quebrar o sistema**. Leia a linha `IDEIAS_ATAQUE` pra inspiração. Qualquer bug achado aqui conta em dobro.

Se achar mais de um bug, **duplique a linha** e reporte cada um separadamente: `EXPLIVRE-<nome>-02`, `-03`, etc.

---

## Materiais de apoio (neste Drive)

- **`01-Credenciais/`** — mapa de quem loga com qual CPF/CNPJ
- **`02-Arquivos-de-teste/`** — PDFs, imagens e payloads prontos pra usar nas tarefas
- **`03-Dados-amostra-edital/`** — texto pronto pra copiar/colar na tarefa de criar edital (T001)
- **`04-Screenshots-bugs/`** — sua subpasta pra subir screenshots
- **`05-Pos-UAT/`** — templates que a gente vai preencher depois

---

## Dúvidas?

- **Entendimento da tarefa**: pergunta no grupo
- **Sistema travou / erro estranho**: reporta como bug, mesmo sem certeza
- **Acesso quebrado**: avisa imediatamente a equipe técnica

Boa caça aos bugs! 🐛
