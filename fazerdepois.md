# Fazer Depois

## Reverter email do admin seedado em produção

**Contexto:** Em 2026-05-19 alteramos o email do user admin seedado (`admin@pnab.irece.ba.gov.br` — Administrador PNAB, id `cmmf98md30000s56r4bvelt1p`) para `andessonreis777.65@gmail.com` temporariamente, pra Andesson conseguir testar o botão "Enviar pra mim" do editor de templates (que dispara pra `session.user.email`).

`admin@pnab.irece.ba.gov.br` não existe como caixa real — é só placeholder do seed. Quando a Secretaria configurar uma caixa real (ex: `admin@culturaeturismo.irece.ba.gov.br` no Resend ou similar), reverter:

```sql
UPDATE "User"
SET email = 'admin@pnab.irece.ba.gov.br', "updatedAt" = NOW()
WHERE id = 'cmmf98md30000s56r4bvelt1p';
```

Também considerar atualizar `prisma/seed.ts:18` pra usar o email real da Secretaria em vez do placeholder, e revisar o impacto em ambientes de UAT/dev (que ainda usam o seed antigo).

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

## Editor de templates de e-mail no admin — fase 2 (WYSIWYG + extras)

**Contexto:** Fase 1 já entregue (commit do PR de templates editáveis). A tabela `EmailTemplateOverride`, a tela `/admin/email-templates` e o renderer com fallback estão ativos. Admin já edita assunto + body HTML via textarea, com preview em iframe, sanitização DOMPurify e aviso vermelho em transacionais sensíveis (`recuperacao_senha`).

**O que falta (próximos PRs incrementais):**
1. **Editor WYSIWYG** (Tiptap ou Lexical) substituindo o textarea HTML. Bullets/headings/links/imagens via toolbar; output ainda HTML pra preservar o pipeline atual.
2. **Histórico/versionamento** — cada save vira uma versão (tabela `EmailTemplateOverrideVersion` ou JSON em campo). UI mostra "Reverter para versão X".
3. **Modo "Enviar teste"** — botão "Enviar para meu e-mail" dispara o template renderizado pra `session.user.email` (sem precisar criar campanha/inscrição real).
4. **Validação de placeholders obrigatórios** — bloquear save quando algum `required: true` do `TEMPLATE_META` não aparecer no body. Hoje só falha em runtime (placeholder fica vazio).
5. **Trava extra em `recuperacao_senha`** — exigir presença literal de `{{resetUrl}}` no body antes de permitir `enabled=true`. Senão admin habilita override e ninguém consegue recuperar senha.
6. **Diff view** vs default — comparar override com o template do código pra ver o que mudou.

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
