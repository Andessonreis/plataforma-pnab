# Fazer Depois

## Admin UI para tabela `Banner`

**Contexto:** Hoje o banner que aparece no topo do layout público (componente `ActiveBanners` em `src/components/layout/active-banners.tsx`, montado em `src/app/(public)/layout.tsx:25`) é renderizado a partir da tabela `Banner` (`prisma/schema.prisma:199`).

Essa tabela **não tem CRUD admin**. O item "Banner Destaque" da sidebar (`src/app/admin/sidebar.tsx:117`) aponta pra `/admin/slides`, que gerencia outra tabela (`SlideDestaque`, usada no carrossel da home). São coisas diferentes.

Resultado: hoje só dá pra editar a linha da `Banner` direto no banco (foi o que tivemos que fazer pra corrigir o link do edital de Patrimônio Cultural em 08/05/2026 — link estava errado e nem dava pra editar pelo painel).

**O que fazer:**
1. Criar página `/admin/banners` com listagem + edição (espelhar o padrão de `/admin/slides`).
2. Criar API routes `src/app/api/admin/banners/route.ts` (GET/POST) e `src/app/api/admin/banners/[id]/route.ts` (GET/PATCH/DELETE) — seguir o mesmo formato dos slides (`src/app/api/admin/slides/route.ts`).
3. Validar com Zod, gerar `requestId`, registrar em `AuditLog` (entity: `'Banner'`).
4. Adicionar item na sidebar admin apontando pra `/admin/banners` (manter "Banner Destaque" → `/admin/slides`, ou renomear pra ficar mais claro a diferença entre os dois — talvez "Banner Topo" vs "Slide Carrossel").
5. Restringir acesso à role `ADMIN`.

**Por que isso importa:** sem CRUD, qualquer ajuste no banner do topo precisa de acesso ao DB de produção (VPS / Prisma Studio), o que não é fluxo aceitável pra a Secretaria operar sozinha.

---

## Email — Configurar VPS com novas envs do Resend

**Contexto:** o domínio `culturaeturismo.irece.ba.gov.br` foi verificado no Resend em 2026-05-18 (DKIM/SPF/DMARC publicados) e o código agora usa o SDK oficial Resend + templates React Email. As envs antigas `SMTP_*` foram removidas.

**O que fazer:**
1. Editar `/opt/pnab/.env` na VPS:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM="Portal PNAB Irecê <noreply@culturaeturismo.irece.ba.gov.br>"
   NOTIFICATION_EMAIL_ENABLED=true
   ```
2. Remover linhas `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
3. Reiniciar `pnab-app-1` e `pnab-worker-1`.
4. Validar disparando o fluxo "Esqueci minha senha" pra um email externo.
5. Trocar a API key full-access por uma com escopo Sending only e habilitar MFA na conta Resend.

---

## Email de boas-vindas no cadastro

**Contexto:** hoje `src/app/api/auth/register/route.ts` não dispara nenhum email — proponente é criado e fica sem receber confirmação de cadastro.

**O que fazer:**
1. Criar template `boas_vindas` em `src/lib/mail/templates/boas-vindas.tsx`.
2. Registrar no `templateRegistry` (`src/lib/mail/templates/index.ts`) + adicionar ao tipo `EmailTemplate`.
3. Enfileirar via `enqueueEmail` no final do handler de register (não bloquear a resposta).

---

## Email "guiado" com instruções visuais

**Contexto:** vários estados intermediários (proponente com inscrição em rascunho, edital quase fechando, doc faltando) hoje só são visíveis se a pessoa loga no portal. Pra reduzir abandono, dá pra mandar emails com print/seta apontando onde clicar no portal.

**Casos iniciais a cobrir:**
- Lembrete: "você tem inscrição em rascunho no edital X" → screenshot da tela de inscrições com seta no botão "Continuar".
- Lembrete pré-fechamento: "edital X fecha em 48h e sua inscrição está incompleta".
- Doc faltando na habilitação: "sua inscrição precisa do anexo Y" → screenshot do upload.

**Detalhes técnicos:**
1. Hospedar as imagens em bucket público (Supabase `manuais` ou novo `email-assets`) e referenciar por URL absoluta (`https://...`), nunca embed.
2. Texto alternativo (`alt`) descritivo — vários clientes bloqueiam imagens por padrão.
3. Manter tudo legível mesmo sem imagem (instrução textual ao lado).
4. Centralizar a montagem dos prints — talvez um helper `src/lib/mail/templates/_shared/screenshot.tsx` com `<Img>` do react-email + caption.
