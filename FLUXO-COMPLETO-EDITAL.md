# Fluxo Completo — Ciclo de Vida do Edital

Guia passo a passo de como um edital percorre todas as fases no Portal PNAB, desde a criação até o encerramento.

---

## Visão Geral

```
RASCUNHO → PUBLICADO → INSCRICOES_ABERTAS → INSCRICOES_ENCERRADAS
    → HABILITACAO → AVALIACAO → RESULTADO_PRELIMINAR
    → RECURSO → RESULTADO_FINAL → ENCERRADO
```

Cada fase pode avançar de duas formas:
- **Automática (scheduler):** o cronograma do edital define datas e o sistema avança sozinho
- **Manual (admin):** o admin executa uma ação que avança o status

---

## Atores

| Ator | O que faz |
|------|-----------|
| **Admin** | Cria editais, gerencia todo o processo, publica resultados |
| **Habilitador** | Analisa documentação e marca inscrições como habilitadas/inabilitadas |
| **Avaliador** | Atribui notas e pareceres às inscrições habilitadas |
| **Proponente** | Se cadastra, faz inscrição, acompanha status, interpõe recursos |
| **Scheduler** | Processo automático que avança fases conforme datas do cronograma |

---

## Fase 1 — RASCUNHO

**Quem age:** Admin

### O que acontece
1. Admin acessa `/admin/editais` e cria um novo edital
2. Preenche: título, descrição, objeto, valor total, vagas, categorias
3. Define o **cronograma** com datas para cada fase
4. Define **critérios de avaliação** com pesos
5. Faz upload de anexos (PDF do edital, modelos, etc.) no bucket `editais`
6. Edital fica salvo como rascunho — invisível ao público

### Próximo passo
- Admin clica em **"Publicar"** → status muda para `PUBLICADO`

---

## Fase 2 — PUBLICADO

**Quem age:** Scheduler (automático)

### O que acontece
1. Edital aparece na página pública `/editais` e em `/editais/[slug]`
2. Proponentes podem visualizar o edital, cronograma e anexos
3. **Ainda não é possível se inscrever** — aguarda data de abertura

### Próximo passo
- Scheduler detecta que chegou a data de **"início das inscrições"** do cronograma
- Status avança automaticamente para `INSCRICOES_ABERTAS`

---

## Fase 3 — INSCRIÇÕES ABERTAS

**Quem age:** Proponente

### O que acontece

#### Cadastro do Proponente (se ainda não tem conta)
1. Acessa `/cadastro`
2. Escolhe tipo: Pessoa Física (CPF), MEI (CNPJ), Pessoa Jurídica (CNPJ) ou Coletivo
3. Preenche dados pessoais, endereço e cria senha
4. Conta criada com role `PROPONENTE`

#### Criação da Inscrição
1. Proponente acessa `/proponente/inscricoes/nova`
2. Seleciona o edital aberto
3. Sistema cria uma inscrição com status `RASCUNHO`
4. Proponente preenche campos dinâmicos do formulário (definidos pelo edital)
5. Faz upload de anexos obrigatórios (documentos, projeto, etc.) → bucket `propostas`
6. Pode salvar e voltar quantas vezes quiser

#### Submissão
1. Proponente clica em **"Enviar Inscrição"**
2. Sistema valida:
   - Edital está em `INSCRICOES_ABERTAS`
   - Todos os campos obrigatórios preenchidos
   - Pelo menos 1 anexo enviado
   - Categoria selecionada (se edital exige)
3. Status da inscrição muda: `RASCUNHO` → `ENVIADA`
4. Registra `submittedAt` (data/hora)
5. **E-mail enviado:** comprovante de inscrição com número e data

### Próximo passo
- Scheduler detecta data de **"encerramento das inscrições"**
- Status do edital avança para `INSCRICOES_ENCERRADAS`

---

## Fase 4 — INSCRIÇÕES ENCERRADAS

**Quem age:** Scheduler (automático)

### O que acontece
1. Proponentes **não podem mais** submeter inscrições
2. Inscrições em `RASCUNHO` ficam abandonadas (não foram enviadas)
3. Apenas inscrições com status `ENVIADA` seguem no processo

### Próximo passo
- Scheduler detecta data de **"início da habilitação"**
- Status avança para `HABILITACAO`

---

## Fase 5 — HABILITAÇÃO

**Quem age:** Habilitador / Admin

### O que acontece
1. Habilitador acessa `/admin/inscricoes` e filtra por status `ENVIADA`
2. Para cada inscrição, analisa a documentação enviada
3. Decide:
   - **HABILITADA** — documentação OK, segue para avaliação
   - **INABILITADA** — documentação com pendência; obrigatório informar o motivo
4. **E-mail enviado** ao proponente informando resultado da habilitação
   - Se inabilitada: inclui motivo e aviso sobre prazo de recurso

### Recurso de habilitação (se proponente discordar)
- Proponente acessa `/proponente/inscricoes/[id]/recurso`
- Interpõe recurso com texto (20-5000 caracteres) e anexos opcionais
- Status da inscrição: `INABILITADA` → `RECURSO_ABERTO`
- Admin/Habilitador analisa e decide: `DEFERIDO` (volta para HABILITADA) ou `INDEFERIDO` (mantém INABILITADA)
- **E-mail enviado** com decisão do recurso

### Verificação antes de avançar
- Scheduler verifica se existem inscrições `ENVIADA` (não analisadas)
- Se existem → **não avança** e loga aviso
- Se todas foram analisadas → avança

### Próximo passo
- Scheduler detecta data de **"início da avaliação"** e verifica que não há pendências
- Status avança para `AVALIACAO`

---

## Fase 6 — AVALIAÇÃO

**Quem age:** Avaliador / Admin

### O que acontece
1. Inscrições habilitadas ficam disponíveis para avaliação
2. Admin pode atribuir inscrições a avaliadores específicos
3. Avaliador acessa `/admin/inscricoes/[id]` e vê a inscrição atribuída
4. Para cada inscrição, preenche:
   - **Notas por critério** (definidos no edital, cada um com peso)
   - **Parecer** (texto opcional de análise qualitativa)
5. Clica em **"Finalizar Avaliação"** — a avaliação fica travada
6. Se múltiplos avaliadores: cada um avalia independentemente

### Cálculo da nota
- Nota do avaliador = média ponderada: `Σ(nota × peso) / Σ(pesos)`
- Se múltiplos avaliadores: `notaFinal = média aritmética das notas dos avaliadores`
- Arredondamento: 2 casas decimais

### Próximo passo
- **Ação manual do Admin:** clicar em "Publicar Resultado Preliminar"
- OU scheduler avança por data → admin ainda pode publicar depois (fix aplicado)

---

## Fase 7 — RESULTADO PRELIMINAR

**Quem age:** Admin (publicação) + Proponente (consulta)

### O que acontece

#### Publicação (Admin)
1. Admin acessa `/admin/editais/[id]/resultados`
2. Clica em **"Publicar Resultado Preliminar"**
3. Confirma a ação (modal de confirmação)
4. Sistema executa:
   - Busca todas as inscrições habilitadas com avaliações finalizadas
   - Calcula nota final de cada inscrição (média ponderada dos avaliadores)
   - Ordena por nota (maior → menor)
   - Atualiza status das inscrições para `RESULTADO_PRELIMINAR`
   - Salva `notaFinal` em cada inscrição
5. **E-mail enviado** a todos os proponentes com link para consulta
6. Status do edital avança para `RESULTADO_PRELIMINAR`

#### Consulta (público)
- Página pública: `/editais/[slug]/resultados`
- Mostra ranking com posição, nome do projeto, nota final
- Proponente pode ver sua nota e posição em `/proponente/inscricoes/[id]`

### Botão disponível em
- Status `INSCRICOES_ENCERRADAS`, `HABILITACAO`, `AVALIACAO` ou `RESULTADO_PRELIMINAR`
- Permite republicar/recalcular mesmo após scheduler avançar

### Próximo passo
- Scheduler detecta data do **"início dos recursos"**
- Status avança para `RECURSO`

---

## Fase 8 — RECURSO

**Quem age:** Proponente (interpõe) + Admin/Habilitador (decide)

### O que acontece

#### Proponente interpõe recurso
1. Proponente acessa `/proponente/inscricoes/[id]/recurso`
2. Condições para recursar:
   - `INABILITADA` → recurso de habilitação
   - `RESULTADO_PRELIMINAR` → recurso de mérito
   - `NAO_CONTEMPLADA` ou `SUPLENTE` → recurso do resultado final
3. Preenche texto do recurso (20-5000 caracteres)
4. Pode anexar documentos complementares
5. Submete → status da inscrição: `RECURSO_ABERTO`
6. **E-mail enviado** ao admin notificando novo recurso
7. Apenas 1 recurso por fase (não permite duplicação)

#### Admin analisa recurso
1. Admin acessa `/admin/recursos` ou `/admin/inscricoes/[id]`
2. Lê o texto e os anexos do recurso
3. Decide:
   - **DEFERIDO** — recurso aceito; inscrição retorna ao status anterior favorável
   - **INDEFERIDO** — recurso negado; inscrição mantém status desfavorável
4. Obrigatório justificar a decisão (mínimo 10 caracteres)
5. **E-mail enviado** ao proponente com decisão e justificativa

### Próximo passo
- **Ação manual do Admin:** clicar em "Publicar Resultado Final"
- OU scheduler avança por data → admin ainda pode publicar depois (fix aplicado)

---

## Fase 9 — RESULTADO FINAL

**Quem age:** Admin (publicação) + Proponente (consulta)

### O que acontece

#### Publicação (Admin)
1. Admin acessa `/admin/editais/[id]/resultados`
2. Clica em **"Publicar Resultado Final"**
3. Confirma a ação (modal reforçando que é **definitiva**)
4. Sistema executa:
   - Recalcula notas considerando recursos deferidos
   - Aplica regra de vagas (se configurado no edital):

| Posição no ranking | Status final |
|--------------------|--------------|
| 1 até N (vagas titulares) | `CONTEMPLADA` |
| N+1 até N+M (vagas suplentes) | `SUPLENTE` |
| Restantes | `NAO_CONTEMPLADA` |
| Sem nota/avaliação | `NAO_CONTEMPLADA` |

   - Se vagas não configuradas → todos com nota > 0 = `CONTEMPLADA`
5. **E-mail enviado** a todos os proponentes com resultado final
6. Status do edital avança para `RESULTADO_FINAL`

#### Consulta (público)
- Página pública: `/editais/[slug]/resultados` atualizada com resultado final
- Proponente vê status definitivo: CONTEMPLADA, SUPLENTE ou NÃO CONTEMPLADA

### Botão disponível em
- Status `RESULTADO_PRELIMINAR`, `RECURSO` ou `RESULTADO_FINAL`
- Permite republicar/recalcular mesmo após scheduler avançar

### Próximo passo
- Scheduler detecta data de **"encerramento"**
- Status avança para `ENCERRADO`

---

## Fase 10 — ENCERRADO

**Status terminal — nenhuma ação possível**

### O que acontece
1. Edital é marcado como finalizado
2. Página pública continua acessível (transparência)
3. Resultados permanecem visíveis
4. Nenhuma nova inscrição ou recurso é aceita
5. Dados preservados para auditoria e prestação de contas

---

## Resumo: Quem Faz O Quê em Cada Fase

| Fase | Scheduler | Admin | Habilitador | Avaliador | Proponente |
|------|-----------|-------|-------------|-----------|------------|
| RASCUNHO | — | Cria/edita edital | — | — | — |
| PUBLICADO | Avança quando chega data | — | — | — | Visualiza edital |
| INSCRICOES_ABERTAS | Avança quando chega data | — | — | — | **Se inscreve** |
| INSCRICOES_ENCERRADAS | Avança quando chega data | — | — | — | — |
| HABILITACAO | Avança (se sem pendências) | Supervisiona | **Habilita/inabilita** | — | Recurso (se inabilitado) |
| AVALIACAO | Avança por data | Supervisiona | — | **Atribui notas** | — |
| RESULTADO_PRELIMINAR | Avança quando chega data | **Publica resultado** | — | — | Consulta nota |
| RECURSO | Avança quando chega data | **Analisa recursos** | Analisa recursos | — | **Interpõe recurso** |
| RESULTADO_FINAL | Avança quando chega data | **Publica resultado final** | — | — | Consulta resultado |
| ENCERRADO | — | — | — | — | Consulta (transparência) |

---

## Notificações por E-mail

| Momento | Destinatário | Template |
|---------|-------------|----------|
| Inscrição enviada | Proponente | `comprovante_inscricao` |
| Habilitação decidida | Proponente | `habilitacao` |
| Resultado preliminar publicado | Todos os proponentes | `resultado_preliminar` |
| Recurso submetido | Admin | `recurso_submetido` |
| Recurso decidido | Proponente | `recurso_decidido` |
| Resultado final publicado | Todos os proponentes | `resultado_final` |

Todos os e-mails são processados via fila BullMQ (Redis) com 3 tentativas e backoff exponencial.

---

## Scheduler vs Admin: Como Convivem

O **scheduler** cuida do **calendário** — avança fases conforme datas do cronograma.
O **admin** cuida das **ações de gestão** — habilitar, avaliar, publicar resultados.

### Cenário ideal
O admin executa as ações antes do scheduler avançar a fase.

### Cenário real
Às vezes o scheduler avança antes do admin agir. Neste caso:
- Os botões de publicação **continuam disponíveis** mesmo após o avanço
- O admin pode publicar/calcular resultados a qualquer momento
- O sistema não bloqueia ações retroativas

### Transições automáticas vs manuais

| Transição | Tipo |
|-----------|------|
| PUBLICADO → INSCRICOES_ABERTAS | Automática (data) |
| INSCRICOES_ABERTAS → INSCRICOES_ENCERRADAS | Automática (data) |
| INSCRICOES_ENCERRADAS → HABILITACAO | Automática (data) |
| HABILITACAO → AVALIACAO | Automática (data + verificação de pendências) |
| AVALIACAO → RESULTADO_PRELIMINAR | Automática (data) |
| RESULTADO_PRELIMINAR → RECURSO | Automática (data) |
| RECURSO → RESULTADO_FINAL | Automática (data) |
| RESULTADO_FINAL → ENCERRADO | Automática (data) |

> **Nota:** A publicação de resultados (cálculo de notas e classificação) é sempre uma ação manual do admin, independente do avanço automático de status.
