-- Migration manual: SlideDestaque.formato / SlideDestaque.peca + peça do Memorial
-- Data: 2026-10-09
-- Motivo: a abertura da home passou a aceitar, além da arte fechada (imagem),
-- uma peça editorial montada em texto real que ocupa a faixa inteira. A peça
-- do Memorial de Irecê, que estava escrita no código da home, vira o primeiro
-- registro desse formato e passa a ser editada pela Comunicação no admin.
--
-- Os slides existentes ficam como ARTE pelo default — nenhum dado é alterado.
-- O INSERT usa id fixo e ON CONFLICT DO NOTHING: rodar de novo não duplica a
-- peça nem desfaz edições feitas depois pelo admin.
--
-- Textos da peça: documento de visão do Memorial (citação de Adélia Prado,
-- lema, exposições em cartaz e regras de visita). Nenhum fato fora dele.
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Rollback:
--   DELETE FROM "SlideDestaque" WHERE "id" = 'slide-peca-memorial-irece';
--   ALTER TABLE "SlideDestaque" DROP COLUMN IF EXISTS "peca";
--   ALTER TABLE "SlideDestaque" DROP COLUMN IF EXISTS "formato";
--   DROP TYPE IF EXISTS "SlideFormato";

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SlideFormato') THEN
    CREATE TYPE "SlideFormato" AS ENUM ('ARTE', 'PECA');
  END IF;
END $$;

ALTER TABLE "SlideDestaque"
  ADD COLUMN IF NOT EXISTS "formato" "SlideFormato" NOT NULL DEFAULT 'ARTE',
  ADD COLUMN IF NOT EXISTS "peca" JSONB;

INSERT INTO "SlideDestaque" (
  "id", "formato", "titulo", "descricao", "imagemUrl", "peca",
  "ctaLabel", "ctaUrl", "ordem", "ativo", "createdAt", "updatedAt"
) VALUES (
  'slide-peca-memorial-irece',
  'PECA',
  'Memorial de Irecê — agende a visita do seu grupo',
  'Uma história contada, vivida e preservada.',
  '/images/cidade/panoramica-irece.jpg',
  jsonb_build_object(
    'chamada', 'Tudo que a memória amou',
    'chamadaDestaque', 'já ficou eterno.',
    'autoria', 'Adélia Prado',
    'apoioDestaque', 'Memorial de Irecê.',
    'ctaSecundario', jsonb_build_object('label', 'Conhecer o Memorial', 'url', '/memorial'),
    'destaque', jsonb_build_object(
      'url', '/images/memorial/fachada-memorial.jpg',
      'alt', 'Fachada do Memorial de Irecê iluminada ao entardecer, com as bandeiras da Bahia, do Brasil e de Irecê',
      'legenda', 'O Memorial, hoje'
    ),
    'linhas', jsonb_build_array(
      'Em cartaz: São João e Re-Tratos do Tempo.',
      'Grupos de até 20 pessoas.',
      'Agendamento com 48 horas de antecedência.'
    ),
    'varal', jsonb_build_object(
      'rotulo', 'Re-Tratos do Tempo: 28 fotografias entre 1950 e 1980',
      'quantidade', 28,
      'anoInicial', 1950,
      'anoFinal', 1980
    )
  ),
  'Agendar visita',
  '/memorial/agendar',
  0,
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

COMMIT;
