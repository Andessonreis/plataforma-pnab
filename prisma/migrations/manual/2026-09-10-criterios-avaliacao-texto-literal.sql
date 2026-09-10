-- Migration manual: Edital.criteriosAvaliacao — texto literal dos editais
-- Data: 2026-09-10
-- Motivo: os pesos e notas máximas de cada critério já batiam com os
-- editais oficiais (Premiação para Mestres e Mestras — Chamamento nº
-- 03/2026, e Festival de Arte e Cultura de Irecê — Chamamento nº 02/2026),
-- mas o texto de apoio ("descricao") que o avaliador lê ao lado de cada
-- critério estava parafraseado/resumido em vez de literal ao edital — em
-- alguns casos (ex.: critério B do Festival) chegava a omitir uma frase
-- inteira de orientação avaliativa ("Também deverá ser considerada... a
-- coerência e conformidade dos valores e quantidades dos itens").
--
-- Conferido contra os PDFs oficiais publicados no Diário Oficial de Irecê
-- (edital original de cada um + todas as retificações publicadas até esta
-- data — nenhuma retificação alterou critério de avaliação, só cronograma,
-- número do edital e quadro de vagas/valores). Nomes dos critérios
-- (campo "criterio") não mudam, então avaliações já salvas continuam
-- válidas sem migração de dados.
--
-- Idempotente: substitui o array inteiro pelo mesmo conteúdo fixo, pode
-- rodar mais de uma vez sem efeito colateral.
-- Rollback: não há um "antes" único a restaurar (o texto anterior era uma
-- paráfrase, não uma versão anterior intencional) — se precisar reverter,
-- restaurar a partir de backup do banco.

BEGIN;

UPDATE "Edital"
SET "criteriosAvaliacao" = '[
  {"modo":"slider","peso":1,"notaMax":10,"criterio":"A) Singularidade da Trajetória Artística","descricao":"Consistência e singularidade da atuação da Mestra ou Mestre; excelência no desenvolvimento de sua atividade junto à comunidade."},
  {"modo":"slider","peso":1,"notaMax":10,"criterio":"B) Impacto da Trajetória na Coletividade e na Cidade de Irecê","descricao":"Contribuição para o desenvolvimento, transmissão, difusão ou preservação de saberes e fazeres culturais; influência da trajetória na formação de redes, grupos ou coletivos culturais, bem como no fortalecimento de outras trajetórias culturais."},
  {"modo":"slider","peso":1,"notaMax":10,"criterio":"C) Reconhecimento Público da Contribuição da Trajetória","descricao":"Reconhecimento da trajetória por instituições públicas, organizações da sociedade civil e comunidade; relevância e longevidade da atuação cultural no território."}
]'::jsonb
WHERE slug = 'premiacao-mestres-mestras-irece-2026';

UPDATE "Edital"
SET "criteriosAvaliacao" = '[
  {"modo":"slider","peso":30,"bloco":"Bloco 1 — Critérios Obrigatórios","notaMax":30,"criterio":"A) Qualidade do Projeto","descricao":"Coerência do objeto, objetivos, justificativa e metas do projeto. A análise deverá considerar, para fins de avaliação e valoração, se o conteúdo do projeto apresenta, como um todo, coerência, observando o objeto, a justificativa e as metas, sendo possível visualizar de forma evidente os resultados que serão obtidos."},
  {"modo":"slider","peso":20,"bloco":"Bloco 1 — Critérios Obrigatórios","notaMax":20,"criterio":"B) Coerência da planilha orçamentária e do cronograma de execução","descricao":"Coerência da planilha orçamentária e do cronograma de execução nas metas, resultados e desdobramentos do projeto proposto. A análise deverá avaliar e valorar a viabilidade técnica do projeto sob o ponto de vista dos gastos previstos na planilha orçamentária, sua execução e a adequação ao objeto, metas e objetivos previstos. Também deverá ser considerada, para fins de avaliação, a coerência e conformidade dos valores e quantidades dos itens relacionados na planilha orçamentária do projeto."},
  {"modo":"slider","peso":20,"bloco":"Bloco 1 — Critérios Obrigatórios","notaMax":20,"criterio":"C) Análise curricular do proponente e da ficha técnica","descricao":"Análise curricular do proponente e da Ficha Técnica e compatibilidade da Ficha Técnica com as atividades desenvolvidas. A análise deverá considerar a carreira dos profissionais que compõem o corpo técnico e artístico, verificando a coerência ou não em relação às atribuições que serão executadas por eles no projeto (para esta avaliação serão considerados os currículos dos membros da ficha técnica)."},
  {"modo":"slider","peso":20,"bloco":"Bloco 1 — Critérios Obrigatórios","notaMax":20,"criterio":"D) Relevância da ação proposta para o cenário cultural de Irecê","descricao":"Relevância da ação proposta para o cenário cultural do município de Irecê. Aspectos de integração comunitária na ação proposta pelo projeto. A análise deverá considerar, para fins de avaliação e valoração, se a ação contribui para aspectos de integração comunitária, enriquecimento e valorização da cultura de Irecê."},
  {"modo":"slider","peso":10,"bloco":"Bloco 1 — Critérios Obrigatórios","notaMax":10,"criterio":"E) Coerência do Plano de Divulgação","descricao":"Coerência do Plano de Divulgação no Cronograma, Objetivos e Metas do projeto proposto. A análise deverá avaliar e valorar a viabilidade técnica e comunicacional com o público alvo do projeto, mediante as estratégias, mídias e materiais apresentados, bem como a capacidade de executá-los."},
  {"modo":"discreto","peso":5,"bloco":"Bloco 2 — Bonificação","notaMax":5,"criterio":"Bonificação — Gênero feminino ou LGBTQIA+","descricao":"Agentes culturais do gênero feminino ou LGBTQIA+. Máx. 2 itens de bônus contam pra pontuação final (ver Anexo VI) — checar manualmente.","naoAtende":0,"plenamente":5},
  {"modo":"discreto","peso":5,"bloco":"Bloco 2 — Bonificação","notaMax":5,"criterio":"Bonificação — Agente cultural negro(a) ou indígena","descricao":"Agentes culturais negros e indígenas. Máx. 2 itens de bônus contam pra pontuação final (ver Anexo VI) — checar manualmente.","naoAtende":0,"plenamente":5},
  {"modo":"discreto","peso":5,"bloco":"Bloco 2 — Bonificação","notaMax":5,"criterio":"Bonificação — Pessoa com deficiência","descricao":"Agentes culturais com deficiência. Máx. 2 itens de bônus contam pra pontuação final (ver Anexo VI) — checar manualmente.","naoAtende":0,"plenamente":5}
]'::jsonb
WHERE slug = 'festival-arte-cultura-irece-centenario-2026';

COMMIT;
