-- CreateTable: Categoria
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateEnum: TipoDocumentoEscopo
CREATE TYPE "TipoDocumentoEscopo" AS ENUM ('EDITAL', 'INSCRICAO');

-- CreateTable: TipoDocumento
CREATE TABLE "TipoDocumento" (
    "id" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "escopo" "TipoDocumentoEscopo" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FormTemplate
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "camposFormulario" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "TipoDocumento_valor_escopo_key" ON "TipoDocumento"("valor", "escopo");

-- CreateIndex
CREATE UNIQUE INDEX "FormTemplate_nome_key" ON "FormTemplate"("nome");
