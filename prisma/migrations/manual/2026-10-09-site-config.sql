-- Migration manual: tabela SiteConfig (configurações do site público)
-- Data: 2026-10-09
-- Motivo: o tempo da troca automática do carrossel da home passou a ser
-- definido pela Comunicação no painel, e não fixo no código. Não havia tabela
-- de configuração do site (MemorialConfig é só do Memorial), então entra uma
-- chave-valor mínima no mesmo formato dela. Sem linha gravada, o código usa o
-- padrão (troca a cada 5 segundos), então não é preciso inserir nada.
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Rollback:
--   DROP TABLE IF EXISTS "SiteConfig";

BEGIN;

CREATE TABLE IF NOT EXISTS "SiteConfig" (
  "chave"         TEXT         NOT NULL,
  "valor"         JSONB        NOT NULL,
  "atualizadoEm"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoPor" TEXT,
  CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("chave")
);

COMMIT;
