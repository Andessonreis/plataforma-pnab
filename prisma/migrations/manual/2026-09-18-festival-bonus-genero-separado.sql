-- Migração de dados: Festival — item de bonificação "gênero feminino ou
-- LGBTQIA+" passa a ser dois itens independentes.
-- Data: 2026-09-18
-- Depende de: 2026-09-18-festival-bonus-fora-da-media.sql
--
-- Decisão da coordenação da Secretaria: um agente cultural que seja mulher E
-- LGBTQIA+ acumula os dois pontos extras (10), em vez de receber 5 por um
-- único item. O Anexo VI publicado (DO nº 2896) traz o item A como
-- "Agentes culturais do gênero feminino ou LGBTQIA+" — 5 pontos —, então a
-- leitura que soma os dois precisa estar fundamentada em ata da comissão.
-- Registrado aqui porque muda pontuação de processo seletivo público.
--
-- O teto de dois itens do edital continua valendo: mulher + LGBTQIA+ = 10, e
-- quem também for negro(a), indígena ou PCD segue limitado a 10.
--
-- Remapeamento do que já estava marcado: a chave antiga `genero_lgbtqia` foi
-- pré-marcada exclusivamente a partir da resposta "Sim" da pergunta
-- "Pessoa LGBTQIA+?" do formulário de inscrição, então vira `lgbtqia`. O item
-- de gênero feminino fica sem pré-marcação: o formulário nunca perguntou
-- gênero, e deduzir isso de nome não é admissível — a comissão marca na tela
-- conferindo o documento.
--
-- Idempotente. Rollback: voltar `itensBonus` para os três itens anteriores e
-- remapear `lgbtqia` de volta para `genero_lgbtqia`.

BEGIN;

UPDATE "Edital"
SET "itensBonus" = jsonb_build_object(
  'maxItens', 2,
  'itens', jsonb_build_array(
    jsonb_build_object('key', 'genero_feminino', 'label', 'Agente cultural do gênero feminino', 'pontos', 5),
    jsonb_build_object('key', 'lgbtqia', 'label', 'Agente cultural LGBTQIA+', 'pontos', 5),
    jsonb_build_object('key', 'etnico_racial', 'label', 'Agente cultural negro(a) ou indígena', 'pontos', 5),
    jsonb_build_object('key', 'pcd', 'label', 'Pessoa com deficiência', 'pontos', 5)
  )
)
WHERE slug = 'festival-arte-cultura-irece-centenario-2026';

UPDATE "Inscricao" i
SET "bonusItens" = array_replace(i."bonusItens", 'genero_lgbtqia', 'lgbtqia')
FROM "Edital" e
WHERE e.id = i."editalId"
  AND e.slug = 'festival-arte-cultura-irece-centenario-2026'
  AND 'genero_lgbtqia' = ANY(i."bonusItens");

COMMIT;
