/**
 * Regulamento de visitação tirado do documento de visão do Memorial (regras de
 * agendamento, orientações aos responsáveis, regras gerais e registro fotográfico),
 * que reúne o que o formulário do Google trazia. Preenche o editor do painel e é a
 * versão semeada por prisma/migrations/manual/2026-10-09-memorial-regulamento-visitacao.sql;
 * vale como regulamento só depois de publicado como versão.
 *
 * Formato: blocos separados por linha em branco; a primeira linha de cada bloco é o
 * título e as linhas com "- " são os itens.
 */
export const REGULAMENTO_PADRAO = `Agendamento
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
- Durante as visitas poderão ser realizados registros fotográficos.`
