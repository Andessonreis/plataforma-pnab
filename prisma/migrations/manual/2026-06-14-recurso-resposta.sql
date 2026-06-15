-- Feature "recurso com resposta de avaliador" (veio do merge da main sem migration).
-- Aplicação manual, no mesmo padrão de 2026-05-11-notifications.sql.

-- AlterTable: decisão consolidada do recurso (CONSENSO | ADMIN)
ALTER TABLE "Recurso" ADD COLUMN IF NOT EXISTS "decididoPor" TEXT;

-- CreateTable: resposta individual de avaliador a um recurso
CREATE TABLE IF NOT EXISTS "RecursoResposta" (
    "id" TEXT NOT NULL,
    "recursoId" TEXT NOT NULL,
    "avaliadorId" TEXT NOT NULL,
    "decisao" TEXT NOT NULL,
    "justificativa" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecursoResposta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: um avaliador responde cada recurso no máximo uma vez
CREATE UNIQUE INDEX IF NOT EXISTS "RecursoResposta_recursoId_avaliadorId_key"
    ON "RecursoResposta"("recursoId", "avaliadorId");

-- AddForeignKey
ALTER TABLE "RecursoResposta"
    ADD CONSTRAINT "RecursoResposta_recursoId_fkey"
    FOREIGN KEY ("recursoId") REFERENCES "Recurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecursoResposta"
    ADD CONSTRAINT "RecursoResposta_avaliadorId_fkey"
    FOREIGN KEY ("avaliadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
