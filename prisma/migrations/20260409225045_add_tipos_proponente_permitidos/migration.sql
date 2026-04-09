-- AlterTable
ALTER TABLE "Edital" ADD COLUMN     "tiposProponentePermitidos" TEXT[] DEFAULT ARRAY[]::TEXT[];
