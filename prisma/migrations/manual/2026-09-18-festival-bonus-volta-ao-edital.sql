-- Migração de dados: Festival — bonificação volta à tabela publicada no edital.
-- Data: 2026-09-18
-- Depende de: 2026-09-18-festival-bonus-genero-separado.sql (que está sendo revertida)
--
-- Decisão da Secretaria após consulta: seguir o Anexo VI como publicado no
-- DO nº 2896, com três itens e pontuação extra total de 15:
--
--   A  Agentes culturais do gênero feminino ou LGBTQIA+   5
--   B  Agentes culturais negros e indígenas               5
--   C  Agentes culturais com deficiência                  5
--
-- A separação de "gênero feminino" e "LGBTQIA+" em itens independentes criava
-- um quarto item fora da tabela publicada e elevava a soma da tabela para 20.
-- O teto de dois itens ("a pontuação bônus deverá ser contemplada em até dois
-- itens") sempre limitou o bônus concedido a 10 nas duas configurações, então
-- o que muda de fato é apenas quem acumulava os dois itens de identidade.
--
-- Impacto conferido antes de aplicar: uma única inscrição tinha os dois itens
-- marcados e passa de 10 para 5 pontos de bonificação. As demais mantêm a
-- pontuação, mudando só a chave registrada.
--
-- As marcações feitas pela comissão são preservadas: `genero_feminino` e
-- `lgbtqia` voltam a ser `genero_lgbtqia`, sem duplicar quem tinha os dois.
--
-- Idempotente. Rollback: reaplicar 2026-09-18-festival-bonus-genero-separado.sql,
-- lembrando que a distinção entre gênero e LGBTQIA+ não é recuperável depois
-- desta fusão — a comissão precisaria remarcar.

BEGIN;

UPDATE "Edital"
SET "itensBonus" = jsonb_build_object(
  'maxItens', 2,
  'itens', jsonb_build_array(
    jsonb_build_object('key', 'genero_lgbtqia', 'label', 'Agentes culturais do gênero feminino ou LGBTQIA+', 'pontos', 5),
    jsonb_build_object('key', 'etnico_racial', 'label', 'Agentes culturais negros e indígenas', 'pontos', 5),
    jsonb_build_object('key', 'pcd', 'label', 'Agentes culturais com deficiência', 'pontos', 5)
  )
)
WHERE slug = 'festival-arte-cultura-irece-centenario-2026';

UPDATE "Inscricao" i
SET "bonusItens" = sub.novos
FROM (
  SELECT
    i2.id,
    array_agg(DISTINCT CASE
      WHEN item IN ('genero_feminino', 'lgbtqia') THEN 'genero_lgbtqia'
      ELSE item
    END) AS novos
  FROM "Inscricao" i2
  JOIN "Edital" e2 ON e2.id = i2."editalId"
  CROSS JOIN LATERAL unnest(i2."bonusItens") AS item
  WHERE e2.slug = 'festival-arte-cultura-irece-centenario-2026'
  GROUP BY i2.id
) sub
WHERE i.id = sub.id
  AND i."bonusItens" <> sub.novos;

COMMIT;
