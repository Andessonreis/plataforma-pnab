-- Migração de dados: Festival de Arte e Cultura — bonificação sai da nota do
-- parecerista e passa a ser somada uma vez sobre a média.
-- Data: 2026-09-18
-- Depende de: 2026-09-18-bonus-pos-media.sql (colunas itensBonus / bonusItens)
--
-- Contexto
-- --------
-- O Anexo VI do edital (DO nº 2896, 28/07/2026) define:
--   * critérios obrigatórios A–E somando 100 pontos;
--   * bonificação de 5 pontos por item, "contemplada em até dois itens" (+10);
--   * aptos a partir de 40 pontos.
--
-- No portal isso foi cadastrado como "Bloco 2 — Bonificação" dentro dos
-- critérios, com a fórmula (B1/10)+(B2/10). Dois efeitos:
--   1. a pontuação aparecia dividida por 10 (10,1 na tela = 101 pontos), o que
--      não bate com a escala publicada no Diário;
--   2. pior, o bônus entrava na nota de cada parecerista e portanto era
--      diluído pela média: em 32 das 111 propostas habilitadas os três
--      divergiram na marcação, e quem tinha direito a 10 pontos ficou com
--      1,67 / 3,33 / 6,67. Uniformizar muda a contemplação de 4 propostas e a
--      posição de outras 14.
--
-- A bonificação não é juízo de mérito — é fato documental, conferido na
-- autodeclaração — então sai da mão do parecerista e passa a ser registrada
-- pela comissão em Inscricao.bonusItens (tela /admin/editais/[id]/bonus/definir).
--
-- O que este script faz
-- ---------------------
--  0. guarda as avaliações originais no log de auditoria (uma entrada por
--     avaliação, com as notas e a nota total de antes);
--  1. cadastra os itens de bonificação do edital, corrige a fórmula para a
--     escala do Diário (B1, 0–100) e a nota mínima para 40, e libera o painel
--     de bonificação para a Secretaria (ADMIN), não só para o super admin;
--  2. remove os critérios de bonificação dos critérios do edital;
--  3. recalcula notaTotal de cada avaliação como a soma bruta do Bloco 1;
--  4. pré-marca a bonificação pelo que o proponente declarou na inscrição,
--     apenas como sugestão — a comissão confirma na tela antes de consolidar;
--  5. registra a operação no log de auditoria.
--
-- Pré-requisito operacional: o resultado preliminar NÃO pode ter sido
-- consolidado (notaFinal/posicao nulos em todas as inscrições do edital). O
-- script aborta se já tiver sido.
--
-- Idempotente: rodar de novo não altera nada (os critérios de bonificação já
-- não existem, e a pré-marcação só toca em bonusItens ainda vazio).
-- Rollback: restaurar notas/notaTotal a partir das entradas
-- AVALIACAO_BONUS_MIGRADO do AuditLog e devolver
-- criteriosAvaliacao/formulaAvaliacao/notaMinima aos valores antigos.
--
-- Nota: o backup vai para o AuditLog de propósito, e não para uma tabela
-- auxiliar — o deploy roda `prisma db push`, que derruba qualquer tabela fora
-- do schema.prisma.

BEGIN;

-- Trava: nada disso pode acontecer depois do resultado publicado.
DO $$
DECLARE consolidadas INT;
BEGIN
  SELECT COUNT(*) INTO consolidadas
  FROM "Inscricao" i
  JOIN "Edital" e ON e.id = i."editalId"
  WHERE e.slug = 'festival-arte-cultura-irece-centenario-2026'
    AND (i."notaFinal" IS NOT NULL OR i.posicao IS NOT NULL);

  IF consolidadas > 0 THEN
    RAISE EXCEPTION 'Resultado já consolidado (% inscrições com nota/posição) — migração abortada', consolidadas;
  END IF;
END $$;

-- 0. Backup das avaliações como estavam — inclui o que cada parecerista marcou
--    de bonificação, única pista documental dessa leitura deles.
INSERT INTO "AuditLog" (id, "userId", action, entity, "entityId", details)
SELECT
  gen_random_uuid()::TEXT,
  a."avaliadorId",
  'AVALIACAO_BONUS_MIGRADO',
  'Avaliacao',
  a.id,
  jsonb_build_object(
    'inscricaoId', a."inscricaoId",
    'inscricaoNumero', i.numero,
    'notasAnteriores', a.notas,
    'notaTotalAnterior', a."notaTotal",
    'finalizada', a.finalizada
  )
FROM "Avaliacao" a
JOIN "Inscricao" i ON i.id = a."inscricaoId"
JOIN "Edital" e ON e.id = i."editalId"
WHERE e.slug = 'festival-arte-cultura-irece-centenario-2026'
  AND NOT EXISTS (
    SELECT 1 FROM "AuditLog" l
    WHERE l.action = 'AVALIACAO_BONUS_MIGRADO' AND l."entityId" = a.id
  );

-- 1 e 2. Edital: itens de bonificação, escala do Diário e critérios sem o Bloco 2.
UPDATE "Edital" e
SET
  "itensBonus" = jsonb_build_object(
    'maxItens', 2,
    'itens', jsonb_build_array(
      jsonb_build_object('key', 'genero_lgbtqia', 'label', 'Gênero feminino ou LGBTQIA+', 'pontos', 5),
      jsonb_build_object('key', 'etnico_racial', 'label', 'Agente cultural negro(a) ou indígena', 'pontos', 5),
      jsonb_build_object('key', 'pcd', 'label', 'Pessoa com deficiência', 'pontos', 5)
    )
  ),
  "formulaAvaliacao" = 'B1',
  "notaMinima" = 40,
  -- Quem confere a bonificação é a Secretaria (ADMIN), não só o super admin.
  "bonusVisivelParaAdmin" = TRUE,
  "criteriosAvaliacao" = (
    SELECT COALESCE(jsonb_agg(c ORDER BY ord), '[]'::jsonb)
    FROM jsonb_array_elements(e."criteriosAvaliacao") WITH ORDINALITY t(c, ord)
    WHERE c->>'criterio' NOT LIKE 'Bonifica%'
  )
WHERE e.slug = 'festival-arte-cultura-irece-centenario-2026';

-- 3. Avaliações: descarta as notas de bonificação e recalcula a pontuação bruta.
--    Com um único bloco restante, a fórmula 'B1' é exatamente esta soma.
UPDATE "Avaliacao" a
SET notas = sub.notas_limpas, "notaTotal" = sub.soma
FROM (
  SELECT
    a2.id,
    COALESCE(
      jsonb_agg(x ORDER BY ord) FILTER (WHERE x->>'criterio' NOT LIKE 'Bonifica%'),
      '[]'::jsonb
    ) AS notas_limpas,
    ROUND(
      COALESCE(SUM((x->>'nota')::numeric) FILTER (WHERE x->>'criterio' NOT LIKE 'Bonifica%'), 0),
      2
    ) AS soma
  FROM "Avaliacao" a2
  JOIN "Inscricao" i2 ON i2.id = a2."inscricaoId"
  JOIN "Edital" e2 ON e2.id = i2."editalId"
  CROSS JOIN LATERAL jsonb_array_elements(a2.notas) WITH ORDINALITY t(x, ord)
  WHERE e2.slug = 'festival-arte-cultura-irece-centenario-2026'
  GROUP BY a2.id
) sub
WHERE a.id = sub.id;

-- 4. Pré-marcação a partir do que o proponente declarou na própria inscrição.
--    Sugestão para a comissão revisar, nunca decisão final:
--      * cota "negros"        -> item étnico-racial;
--      * pessoa_lgbtqia = Sim -> item de gênero/LGBTQIA+.
--    Ficam de fora de propósito:
--      * a cota "indigena_pcd", que junta duas condições que o Anexo VI separa
--        em itens distintos (não dá pra saber pela inscrição qual das duas é);
--      * gênero feminino, que a inscrição não pergunta — depende do documento.
--    Só toca em quem ainda está sem marcação, pra não desfazer revisão manual.
UPDATE "Inscricao" i
SET "bonusItens" = sugerido.itens
FROM (
  SELECT
    i2.id,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN 'negros' = ANY(i2."cotasOptIn") THEN 'etnico_racial' END,
      CASE WHEN i2.campos->>'pessoa_lgbtqia' = 'Sim' THEN 'genero_lgbtqia' END
    ], NULL) AS itens
  FROM "Inscricao" i2
  JOIN "Edital" e2 ON e2.id = i2."editalId"
  WHERE e2.slug = 'festival-arte-cultura-irece-centenario-2026'
    AND i2."bonusItens" = '{}'
) sugerido
WHERE i.id = sugerido.id
  AND CARDINALITY(sugerido.itens) > 0;

-- 5. Registro da operação.
INSERT INTO "AuditLog" (id, action, entity, "entityId", details)
SELECT
  gen_random_uuid()::TEXT,
  'BONUS_MIGRADO_PARA_POS_MEDIA',
  'Edital',
  e.id,
  jsonb_build_object(
    'motivo', 'Bonificação do Anexo VI saiu dos critérios do parecerista e passou a ser somada uma vez sobre a média',
    'formulaAnterior', '(B1/10)+(B2/10)',
    'formulaNova', 'B1',
    'notaMinimaAnterior', 4.00,
    'notaMinimaNova', 40,
    'backup', 'AuditLog / AVALIACAO_BONUS_MIGRADO',
    'avaliacoesNoBackup', (
      SELECT COUNT(*) FROM "AuditLog" l
      WHERE l.action = 'AVALIACAO_BONUS_MIGRADO'
    ),
    'inscricoesPreMarcadas', (
      SELECT COUNT(*) FROM "Inscricao" i3
      WHERE i3."editalId" = e.id AND CARDINALITY(i3."bonusItens") > 0
    )
  )
FROM "Edital" e
WHERE e.slug = 'festival-arte-cultura-irece-centenario-2026'
  AND NOT EXISTS (
    SELECT 1 FROM "AuditLog" l
    WHERE l.action = 'BONUS_MIGRADO_PARA_POS_MEDIA' AND l."entityId" = e.id
  );

COMMIT;
