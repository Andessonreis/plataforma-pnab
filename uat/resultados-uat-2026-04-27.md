# Resultados UAT — Portal PNAB Irecê

**Data de execução:** 2026-04-27
**Executor:** Claude Code (pilotando via Playwright MCP)
**Ambiente:** Local (`http://localhost:3000`)
**Stack:** Next.js dev server + Postgres + Redis (containers locais)
**Seed aplicado:** `npm run db:seed:uat` (42 usuários, 10 editais, 62 inscrições, 6 tickets)
**Senha das contas de teste:** `Teste@123`

> Plano de testes: `uat/testes-uat.csv` (64 casos T### em 9 fases + Exploração Livre)
> Esta sessão executou **fluxos críticos representativos de cada fase**, não os 64 casos um por um (custo de UI manual via MCP é alto). Cobertura: smoke test do ciclo-de-vida ponta-a-ponta + RBAC + algumas rotas de segurança.

## Convenções de severidade

| Severidade | Critério |
|---|---|
| **BLOQUEADOR** | Não dá pra usar o sistema / perda de dados / furo de segurança |
| **ALTO** | Fluxo importante quebrado |
| **MEDIO** | Erro em fluxo secundário |
| **BAIXO** | Cosmético / typo |
| **SUGESTAO** | Ideia de melhoria |
| **DUVIDA** | Comportamento ambíguo |

---

## Fase 1 — Admin prepara cenário

| ID | O que fazer | Status | Severidade | Observação |
|----|-------------|--------|------------|------------|
| **PRE-LOGIN** | Login ADMIN (CPF 90000000001) | OK | — | Redireciona para `/admin` |
| **T001** | Criar edital novo do zero e publicar | OK | — | Slug auto-gerado (`uat-2026-04-27-t001-edital-2026`); status mudou via select+Salvar; aparece em /editais como card "Publicado" |
| **T002** | Mudar para INSCRICOES_ABERTAS | OK | — | Botão "Inscrever-se" passou a aparecer na pág. pública após mudança |
| **T006** | RBAC reverso: admin acessando `/proponente` | OK | — | Redireciona para `/` (home). RBAC funcionando. |
| **T003-T005, T007** | Categoria/notícia/slide/equipe/export | NÃO EXECUTADO | — | Pulados nesta sessão para priorizar fluxo crítico ponta-a-ponta |

### Bugs Fase 1

#### BUG-001 — Campo "Valor Total" trata input como centavos sem comunicar [ALTO]
- **Onde:** `/admin/editais/novo` — Seção 1, campo "Valor Total (R$)"
- **Repro:** focar campo → digitar `50000`
- **Resultado:** exibe `R$ 500,00` (interpretou 50000 centavos)
- **Esperado:** ou interpretar `50000` como `R$ 50.000,00`, ou exibir máscara em tempo real, ou hint "digite em centavos"
- **Risco real:** admin publicar edital com valor 100× menor que o pretendido (R$ 90.000 vira R$ 900)
- **Workaround atual:** digitar 7 dígitos → `5000000` produz `R$ 50.000,00`

#### BUG-002 — Title HTML duplica "| Portal PNAB Irecê" em todo /admin [BAIXO]
- **Page Title observado:** `Painel Administrativo — Portal PNAB Irecê | Portal PNAB Irecê`
- **Esperado:** `Painel Administrativo — Portal PNAB Irecê` (template metadata `%s | Portal PNAB Irecê` aplicado em cima de title que já contém o nome)
- **Onde corrigir:** layout/metadata de `src/app/admin/**/page.tsx`

#### BUG-003 — "Irece" sem cedilha no title de algumas páginas [BAIXO]
- **Onde:** `/admin/editais/novo` e `/admin/editais/[id]` e detalhe da inscrição admin
- **Title:** `Novo Edital — Portal PNAB Irece | Portal PNAB Irecê` (sem cedilha no primeiro fragmento)
- **Esperado:** "Irecê" em todas as ocorrências
- **Como achar:** grep `PNAB Irece` (sem cedilha) no metadata das pages

#### BUG-004 — favicon.ico 404 em todas as rotas [BAIXO]
- **Console error:** `Failed to load resource: 404 @ http://localhost:3000/favicon.ico`
- **Fix:** adicionar `src/app/favicon.ico` ou `public/favicon.ico`

#### BUG-005 — Cronograma carregado sem datas, edital pode publicar mesmo assim [MEDIO]
- **Onde:** `/admin/editais/novo` Seção 8 (Cronograma)
- **Repro:** clicar "Carregar Cronograma Padrão" → 8 etapas aparecem com campos de data vazios → publicar edital
- **Resultado:** edital publicado com cronograma de datas em branco (todas mostradas como `—` na pág. pública)
- **Esperado:** ou exigir preenchimento das datas antes de PUBLICAR, ou trazer datas placeholder, ou bloquear mudança de status sem cronograma completo
- **Risco:** público vê cronograma vazio, perde confiança

#### OBS-006 — Combo "Tipo do anexo" tem "Declaração" duplicada sem distinção [SUGESTAO]
- **Onde:** Seção 7 (Documentos e Arquivos)
- **Observado:** opção "Declaração" aparece 2× (uma é "Documento Edital", outra "PNAB"), mas no combo aparecem idênticas
- **Sugestão:** prefixar igual a Seção 6 já faz: "Declaração (Edital)" e "Declaração (PNAB)"

---

## Fase 2 — Cadastro de proponente novo

| ID | O que fazer | Status | Severidade | Observação |
|----|-------------|--------|------------|------------|
| **T008** | Criar conta via /cadastro (CPF 52998224725 João Alves UAT) | OK | — | Redirecionou para `/login?cadastro=sucesso` |

### Bugs Fase 2

#### BUG-007 — Label "Numero" sem acento [BAIXO]
- **Onde:** `/cadastro` formulário, campo "Numero" (do endereço)
- **Esperado:** "Número"

#### OBS-008 — Cadastro não pergunta tipo de proponente (PF/MEI/PJ/Coletivo) [DUVIDA]
- **Observado:** form de cadastro tem CPF e nome, mas não pergunta se é PF/MEI/PJ/Coletivo
- **Implicação:** o seed-uat preenche `tipoProponente` para cada user, mas usuários cadastrados via UI ficam sem (`null`)? Ou é inferido do CPF (11 dígitos = PF, 14 = CNPJ)? Validar esse comportamento, em especial para editais que aceitam múltiplos tipos
- **Como reproduzir:** criar conta nova via /cadastro, depois tentar inscrever em edital que aceita só MEI/PJ — vai bloquear corretamente?

---

## Fase 3 — Proponente se inscreve em edital

| ID | O que fazer | Status | Severidade | Observação |
|----|-------------|--------|------------|------------|
| **T014/T015** | Inscrever no edital UAT recém-criado | PARCIAL | — | Wizard 4 etapas funcional; categoria + dados + anexos + revisão; backend bloqueou submit por falta de anexos |

### Bugs Fase 3

#### BUG-009 — Wizard permite avançar até "Enviar" sem anexos obrigatórios [ALTO]
- **Onde:** `/proponente/inscricoes/nova` etapa Anexos
- **Repro:** preencher categoria → próximo → próximo (etapa anexos sem subir nada) → próximo → revisão → "Enviar Inscrição"
- **Resultado frontend:** deixa avançar tranquilamente, mostra "Anexos (0)" na revisão e botão Enviar habilitado
- **Resultado backend:** bloqueia com mensagem "Nenhum anexo enviado"
- **Problema UX:** usuário só descobre depois de chegar na última etapa e tentar enviar. Esperado: bloquear o botão "Próximo" da etapa Anexos quando há tipos obrigatórios faltando, com indicação visual

#### OBS-010 — Edital criado com 1 tipo de anexo selecionado mostra checklist com 7 tipos default [DUVIDA]
- **Onde:** wizard de inscrição etapa Anexos do edital UAT
- **Observado:** apesar de eu ter adicionado apenas "Documento Pessoal (PNAB)" no admin, o checklist mostrou 7 tipos default (Documento Pessoal, Comprovante de Endereço, Portfólio, Projeto/Proposta, Orçamento, Declaração, Outro)
- **Hipótese:** ou meu salvamento não persistiu o tipo selecionado (provável, dado que cliquei "Salvar alterações" mas não verifiquei o DB), ou o sistema cai no default `PNAB_DEFAULT_ATTACHMENT_TYPES` quando o edital tem um único tipo
- **A validar:** olhar `prisma.edital.findUnique({ where: { id }, select: { tiposAnexo: true } })` para o edital criado e ver se `tiposAnexo` está populado

#### BUG-011 — Stepper de andamento omite a fase "Recurso" [SUGESTAO]
- **Onde:** `/proponente/inscricoes/[id]` — stepper "Andamento"
- **Stepper exibido:** Rascunho → Enviada → Habilitada → Em Avaliação → Resultado Preliminar → Resultado Final
- **Falta:** etapa "Recurso" (entre preliminar e final)
- **Impacto:** quando proponente entra com recurso, status fica fora do stepper visual

---

## Fase 4 — Habilitador analisa inscrições

| ID | O que fazer | Status | Severidade | Observação |
|----|-------------|--------|------------|------------|
| **T021** | Habilitar inscrição (Lucas Barbosa UAT-2025FORM-024) | OK | — | Modal "Confirmar" + click → status mudou para "Habilitada" |
| **T022** | Inabilitar inscrição com motivo (Ricardo Mendes UAT-2025FORM-023) | OK | — | Modal pediu motivo via textarea ("Confirmar inabilitação"), submit funcionou |

### Bugs Fase 4

#### BUG-012 — Title da página expõe cuid bruto [BAIXO]
- **Onde:** `/admin/inscricoes/[cuid]`
- **Title observado:** `Inscricao cmohjrw5a003hubmk6l87y0j0 — Admin PNAB | Portal PNAB Irecê`
- **Esperado:** `Inscrição UAT-2025FORM-024 — Admin PNAB` (usar o `numero` da inscrição) — também há "Inscricao" sem cedilha
- **Impacto duplo:** título péssimo para histórico de navegador / abas; e expõe ID interno

#### OBS-013 — Habilitador "Giovane Neves" vê todas as 73 inscrições [DUVIDA]
- **Onde:** `/admin/inscricoes` logado como HABILITADOR
- **Observado:** Giovane Neves (HABILITADOR) vê inscrições de TODOS os editais, mesmo aqueles em que ele não foi atribuído como membro
- **Hipótese:** comportamento default quando edital não define equipe ("Nenhum (todos acessam)") — mas é o caso aqui? Validar se é regra ou furo de RBAC

---

## Fase 5 — Avaliador lança notas

| ID | O que fazer | Status | Severidade | Observação |
|----|-------------|--------|------------|------------|
| **T031** | Lançar notas em inscrição habilitada (Larissa Miranda CPF 90000000006) | OK | — | 4 critérios PNAB padrão (Mérito, Viabilidade, Impacto, Ações afirmativas) com sliders + number input + parecer textarea; finalizar via modal "Confirmar" → status "Finalizada" |

### Bugs Fase 5

#### BUG-014 — Title expõe cuid também na área do avaliador [BAIXO]
- **Onde:** `/avaliador/inscricoes/[cuid]`
- **Title:** `Avaliação cmohjrwdy0075ubmkey4u02ze — Portal PNAB Irecê | Portal PNAB Irecê`
- **Mesmo problema do BUG-012**, replicado em outra área

---

## Fase 6 — Proponente acompanha resultado / recurso

| ID | O que fazer | Status | Severidade | Observação |
|----|-------------|--------|------------|------------|
| **T039** | Submeter recurso (Ana Luiza CPF 70000000003) | OK | — | Recurso submetido com fundamentação, mensagem "Recurso submetido" |

### Bugs Fase 6

#### BUG-015 — Texto sem cedilha em UI principal [BAIXO]
- **Onde:** `/proponente/inscricoes/[id]`
- **Trechos observados:** "Inscricao UAT-2025ARTE-062" (cabeçalho), "Informacoes Gerais" (seção), "Numero" (label)
- **Esperado:** "Inscrição", "Informações Gerais", "Número"

---

## Fase 7 — Admin decide recursos

| ID | O que fazer | Status | Severidade | Observação |
|----|-------------|--------|------------|------------|
| **T044** | Indeferir recurso interposto (admin Alef Almeida) | OK | — | Modal pediu fundamentação da decisão → "Confirmar Decisão" → contador foi de 4→3 pendentes, 0→1 indeferido |

---

## Fase 8 — Atendimento

| ID | O que fazer | Status | Severidade | Observação |
|----|-------------|--------|------------|------------|
| **T050** | Responder ticket aberto (atendente Caio Alves CPF 90000000010) | OK | — | Textarea + Enviar Resposta funcionou |

### Bugs Fase 8

#### BUG-016 — Botão "Encerrar Atendimento" duplicado [SUGESTAO]
- **Onde:** `/admin/tickets/[id]`
- **Observado:** 2 botões "Encerrar Atendimento" visíveis simultaneamente (provavelmente um no topo e um no rodapé do detalhe)
- **Impacto:** confunde o atendente sobre qual usar

---

## Fase 9 — Transversal (RBAC e segurança)

| ID | O que fazer | Status | Severidade | Observação |
|----|-------------|--------|------------|------------|
| **RBAC-01** | Proponente acessando `/admin/*` (5 rotas) | OK | — | Todas retornam redirect (opaqueredirect) |
| **RBAC-02** | Proponente acessando `/avaliador/*` (2 rotas) | OK | — | Idem, redirect |
| **RBAC-03** | Proponente acessando inscrição de outro proponente (`/proponente/inscricoes/[id-da-Ana-Luiza]`) | OK | — | Retorna 404 (proteção pela página) |
| **RBAC-04** | Proponente em API admin (`/api/admin/editais` GET) | DUVIDA | — | Retorna **405 Method Not Allowed**, esperado seria 401/403 (ver BUG-017) |
| **RBAC-05** | Proponente em API admin (`/api/admin/usuarios` GET) | OK | — | Retorna 404 |

### Bugs Fase 9

#### BUG-017 — `/api/admin/editais` GET retorna 405 ao invés de 401/403 [DUVIDA]
- **Onde:** API
- **Repro:** logado como PROPONENTE → `fetch('/api/admin/editais')`
- **Resultado:** HTTP 405 (Method Not Allowed)
- **Esperado:** 401 (não autenticado para escopo admin) ou 403 (autenticado mas sem permissão)
- **Hipótese:** rota só implementa POST/PUT, GET cai no fallback do Next.js antes de checar permissão. **Risco baixo se não há GET implementado**, mas idealmente o middleware deveria responder 401/403 antes do roteador chegar no handler

---

## Exploração Livre (IDEIAS_ATAQUE)

Não executada nesta sessão (priorizado fechamento dos fluxos das 9 fases). Itens recomendados como próximos passos:

1. Tentar XSS em campos de texto livre (parecer técnico, fundamentação de recurso, descrição de projeto) com `<script>alert(1)</script>` — verificar sanitização
2. Submeter formulários clicando 2× muito rápido (duplica inscrição/recurso/avaliação?)
3. Abrir mesma inscrição em 2 abas, editar em ambas, salvar → última escrita ganha sem aviso?
4. Trocar `[id]` na URL por ID de inscrição de outro proponente — TESTADO PARCIALMENTE (RBAC-03 OK)
5. Subir arquivo .exe renomeado pra .pdf — testar validação de magic bytes

---

## Resumo executivo

| Métrica | Valor |
|---|---|
| Fases executadas (smoke test) | 9 de 9 |
| Casos T### diretamente executados | ~10 (T001, T002, T006, T008, T014/T015 parcial, T021, T022, T031, T039, T044, T050) |
| Cobertura efetiva por fluxo | login → criar edital → publicar → abrir inscrições → cadastrar proponente → iniciar inscrição → habilitar → avaliar → recurso → indeferir → ticket atendimento → RBAC |
| Total de bugs/observações | 17 |

### Bugs por severidade

| Severidade | Qtd | IDs |
|---|---|---|
| **BLOQUEADOR** | 0 | — |
| **ALTO** | 2 | BUG-001 (valor centavos), BUG-009 (wizard sem bloquear anexos obrigatórios) |
| **MEDIO** | 1 | BUG-005 (publicar com cronograma vazio) |
| **BAIXO** | 7 | BUG-002 (title duplicado), BUG-003 (Irece s/ cedilha), BUG-004 (favicon 404), BUG-007 (Numero s/ acento), BUG-012 (cuid no title admin), BUG-014 (cuid no title avaliador), BUG-015 (Inscricao/Informacoes/Numero s/ cedilha) |
| **SUGESTAO** | 3 | OBS-006 (Declaração duplicada combo), BUG-011 (stepper sem Recurso), BUG-016 (botão Encerrar duplicado) |
| **DUVIDA** | 4 | OBS-008 (cadastro sem tipoProponente), OBS-010 (tipos anexo defaultaram), OBS-013 (habilitador vê tudo), BUG-017 (API admin 405) |

### Próximos passos recomendados

**Tier 1 (corrigir antes de levar para produção real):**
- BUG-001 — ajustar máscara do valor monetário (alto risco financeiro)
- BUG-009 — bloquear "Próximo" na etapa Anexos quando obrigatórios faltam
- BUG-005 — exigir cronograma completo antes de publicar

**Tier 2 (qualidade visível):**
- BUG-002, BUG-003, BUG-007, BUG-015 — corrigir typos e inconsistência ortográfica
- BUG-012, BUG-014 — usar `numero` da inscrição no `<title>`
- BUG-004 — adicionar favicon

**Tier 3 (validar com a Secretaria):**
- OBS-008, OBS-010, OBS-013 — confirmar comportamentos
- BUG-011 — adicionar fase Recurso ao stepper
- BUG-016 — remover botão Encerrar duplicado
- OBS-006, BUG-017 — refinamentos
