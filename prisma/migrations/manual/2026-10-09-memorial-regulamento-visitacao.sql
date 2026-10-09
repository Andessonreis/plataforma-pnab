-- Migration manual: regulamento de visitação do Memorial (primeira versão)
-- Data: 2026-10-09
-- Motivo: o agendamento de visitas só abre com um regulamento publicado. O texto
-- abaixo é o do documento de visão do Memorial (regras de agendamento, orientações
-- aos responsáveis, regras gerais e registro fotográfico), igual a
-- REGULAMENTO_PADRAO em src/lib/memorial/agendamento/regulamento-padrao.ts.
--
-- Só insere quando ainda não existe nenhuma versão: se a equipe já publicou um
-- regulamento pelo painel (Memorial > Agendamentos > Regulamento), o texto dela
-- continua valendo e este script não faz nada. Depois de semeado, o texto segue
-- editável pelo painel, que publica versões novas sem alterar as antigas.
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Rollback (só se nenhum pedido aceitou esta versão):
--   DELETE FROM "MemorialRegulamento" WHERE "id" = 'memorial-regulamento-v1';

INSERT INTO "MemorialRegulamento" ("id", "versao", "texto", "vigenteDesde", "criadoPorId")
SELECT 'memorial-regulamento-v1', 1, $regulamento$Agendamento
- O pedido de visita deve ser feito com no mínimo 48 horas de antecedência.
- Cada agendamento representa um grupo de até 20 pessoas.
- O Memorial recebe no máximo dois grupos por dia.
- A visita só está confirmada depois que a equipe do Memorial analisar a disponibilidade e enviar a confirmação por e-mail e/ou WhatsApp.

Orientações aos responsáveis pelo grupo
- Não tocar ou manipular objetos sem autorização.
- O transporte do grupo é responsabilidade de quem agenda.
- Não entrar com malas.
- Não entrar com alimentos.
- Não entrar com bebidas.
- A segurança do grupo durante a visita é responsabilidade do responsável.

Regras gerais da visita
- Não gritar.
- Não falar alto.
- Não correr.
- Não praticar atos desrespeitosos.
- Não consumir alimentos ou bebidas.
- Não tocar nas peças, exceto na área interativa.
- Tirar as dúvidas com os mediadores.
- Assinar o livro de frequência.
- Evitar conversas paralelas durante a mediação.

Registro fotográfico
- Durante as visitas poderão ser realizados registros fotográficos.$regulamento$, NOW(), NULL
WHERE NOT EXISTS (SELECT 1 FROM "MemorialRegulamento");
