-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PROPONENTE', 'ATENDIMENTO', 'HABILITADOR', 'AVALIADOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "TipoProponente" AS ENUM ('PF', 'MEI', 'PJ', 'COLETIVO');

-- CreateEnum
CREATE TYPE "EditalStatus" AS ENUM ('RASCUNHO', 'PUBLICADO', 'INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS', 'HABILITACAO', 'AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO', 'RESULTADO_FINAL', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "InscricaoStatus" AS ENUM ('RASCUNHO', 'ENVIADA', 'HABILITADA', 'INABILITADA', 'EM_AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO_ABERTO', 'RESULTADO_FINAL', 'CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE');

-- CreateEnum
CREATE TYPE "AtendimentoStatus" AS ENUM ('ABERTO', 'EM_ATENDIMENTO', 'FECHADO');

-- CreateEnum
CREATE TYPE "FuncaoEdital" AS ENUM ('AVALIADOR', 'HABILITADOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PROPONENTE',
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT,
    "tipoProponente" "TipoProponente",
    "telefone" TEXT,
    "cep" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" CHAR(2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "details" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "inicioEm" TIMESTAMP(3) NOT NULL,
    "fimEm" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Edital" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "status" "EditalStatus" NOT NULL DEFAULT 'RASCUNHO',
    "resumo" TEXT,
    "valorTotal" DECIMAL(12,2),
    "categorias" TEXT[],
    "acoesAfirmativas" TEXT,
    "regrasElegibilidade" TEXT,
    "cronograma" JSONB NOT NULL DEFAULT '[]',
    "camposFormulario" JSONB NOT NULL DEFAULT '[]',
    "criteriosAvaliacao" JSONB NOT NULL DEFAULT '[]',
    "tiposAnexo" JSONB,
    "notaMinima" DECIMAL(5,2),
    "desempate" JSONB,
    "formulaAvaliacao" TEXT,
    "conteudoAcessivel" TEXT,
    "vagasContemplados" INTEGER,
    "vagasSuplentes" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Edital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArquivoEdital" (
    "id" TEXT NOT NULL,
    "editalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "acessivel" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArquivoEdital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscricao" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "editalId" TEXT NOT NULL,
    "proponenteId" TEXT NOT NULL,
    "status" "InscricaoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "categoria" TEXT,
    "campos" JSONB NOT NULL DEFAULT '{}',
    "orcamento" JSONB,
    "notaFinal" DECIMAL(5,2),
    "posicao" INTEGER,
    "motivoInabilitacao" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inscricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnexoInscricao" (
    "id" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "valido" BOOLEAN,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnexoInscricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "avaliadorId" TEXT NOT NULL,
    "notas" JSONB NOT NULL DEFAULT '[]',
    "parecer" TEXT,
    "notaTotal" DECIMAL(5,2) NOT NULL,
    "finalizada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recurso" (
    "id" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "fase" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "urlAnexos" TEXT[],
    "decisao" TEXT,
    "justificativa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "Recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjetoApoiado" (
    "id" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "valorAprovado" DECIMAL(12,2) NOT NULL,
    "statusExecucao" TEXT NOT NULL DEFAULT 'EM_EXECUCAO',
    "contrapartida" TEXT,
    "mediaUrls" TEXT[],
    "relatorios" JSONB,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjetoApoiado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Noticia" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "tags" TEXT[],
    "imagemUrl" TEXT,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "publicadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Noticia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manual" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "versao" TEXT,
    "publicado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Manual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL,
    "editalId" TEXT,
    "pergunta" TEXT NOT NULL,
    "resposta" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "publicado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsPage" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlideDestaque" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "imagemUrl" TEXT,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "inicioEm" TIMESTAMP(3),
    "fimEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlideDestaque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditalMembro" (
    "id" TEXT NOT NULL,
    "editalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "funcao" "FuncaoEdital" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditalMembro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttachmentType" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "tag" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttachmentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationTemplate" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "criterios" JSONB NOT NULL DEFAULT '[]',
    "formula" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atendimento" (
    "id" TEXT NOT NULL,
    "protocolo" TEXT NOT NULL,
    "editalId" TEXT,
    "autorId" TEXT,
    "nomeContato" TEXT NOT NULL,
    "emailContato" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "status" "AtendimentoStatus" NOT NULL DEFAULT 'ABERTO',
    "historico" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpfCnpj_key" ON "User"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Edital_slug_key" ON "Edital"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Inscricao_numero_key" ON "Inscricao"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_inscricaoId_avaliadorId_key" ON "Avaliacao"("inscricaoId", "avaliadorId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjetoApoiado_inscricaoId_key" ON "ProjetoApoiado"("inscricaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Noticia_slug_key" ON "Noticia"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CmsPage_slug_key" ON "CmsPage"("slug");

-- CreateIndex
CREATE INDEX "EditalMembro_editalId_idx" ON "EditalMembro"("editalId");

-- CreateIndex
CREATE INDEX "EditalMembro_userId_idx" ON "EditalMembro"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EditalMembro_editalId_userId_funcao_key" ON "EditalMembro"("editalId", "userId", "funcao");

-- CreateIndex
CREATE UNIQUE INDEX "AttachmentType_tipo_key" ON "AttachmentType"("tipo");

-- CreateIndex
CREATE INDEX "AttachmentType_tag_idx" ON "AttachmentType"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "Category_nome_key" ON "Category"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_ativa_idx" ON "Category"("ativa");

-- CreateIndex
CREATE INDEX "Category_ordem_idx" ON "Category"("ordem");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationTemplate_nome_key" ON "EvaluationTemplate"("nome");

-- CreateIndex
CREATE INDEX "EvaluationTemplate_ativo_idx" ON "EvaluationTemplate"("ativo");

-- CreateIndex
CREATE INDEX "EvaluationTemplate_ordem_idx" ON "EvaluationTemplate"("ordem");

-- CreateIndex
CREATE UNIQUE INDEX "Atendimento_protocolo_key" ON "Atendimento"("protocolo");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArquivoEdital" ADD CONSTRAINT "ArquivoEdital_editalId_fkey" FOREIGN KEY ("editalId") REFERENCES "Edital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscricao" ADD CONSTRAINT "Inscricao_editalId_fkey" FOREIGN KEY ("editalId") REFERENCES "Edital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscricao" ADD CONSTRAINT "Inscricao_proponenteId_fkey" FOREIGN KEY ("proponenteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnexoInscricao" ADD CONSTRAINT "AnexoInscricao_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "Inscricao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "Inscricao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_avaliadorId_fkey" FOREIGN KEY ("avaliadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recurso" ADD CONSTRAINT "Recurso_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "Inscricao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetoApoiado" ADD CONSTRAINT "ProjetoApoiado_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "Inscricao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaqItem" ADD CONSTRAINT "FaqItem_editalId_fkey" FOREIGN KEY ("editalId") REFERENCES "Edital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditalMembro" ADD CONSTRAINT "EditalMembro_editalId_fkey" FOREIGN KEY ("editalId") REFERENCES "Edital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditalMembro" ADD CONSTRAINT "EditalMembro_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
