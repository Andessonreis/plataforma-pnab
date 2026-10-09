import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getConfig } from '@/lib/memorial/config'
import { obterRegulamentoVigente } from '@/lib/services/memorial-regulamento.service'
import { buscarPerguntasExtras } from '@/lib/memorial/agendamento/perguntas-extras'
import { diaEmIrece } from '@/lib/memorial/agendamento/datas'
import { consultarDisponibilidade } from '@/lib/services/memorial-agendamento.service'
import { DADOS_VAZIOS } from './dados-visita'
import { FluxoAgendamento } from './fluxo-agendamento'
import { AgendamentoFechado } from './agendamento-fechado'
import type { DestinoFinal } from './protocolo-visita'

/** Pré-preenche o responsável com os dados da conta logada; sem conta, o formulário vem em branco. */
async function dadosDaConta(userId: string | undefined) {
  if (!userId) return DADOS_VAZIOS
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nome: true, email: true, telefone: true, cidade: true },
  })
  if (!user) return DADOS_VAZIOS
  return {
    ...DADOS_VAZIOS,
    responsavelNome: user.nome,
    responsavelEmail: user.email,
    responsavelTelefone: user.telefone ?? '',
    cidade: user.cidade ?? '',
  }
}

/**
 * Corpo do pedido de visita: carrega as regras do Memorial e mostra o fluxo em
 * etapas, ou o aviso de "em preparação" enquanto não há regulamento. É usado
 * pela página pública e pela do painel do proponente, que só trocam a moldura.
 */
export async function FormularioAgendamento({ destinoFinal }: { destinoFinal?: DestinoFinal }) {
  const session = await auth()
  const mes = diaEmIrece(new Date()).slice(0, 7)
  // A agenda do mês corrente vem junto com a página: a etapa de horário abre já pronta,
  // sem uma segunda ida ao servidor depois do clique.
  const [visitacao, contato, regulamento, perguntas, iniciais, agenda] = await Promise.all([
    getConfig('visitacao'),
    getConfig('contato'),
    obterRegulamentoVigente(),
    buscarPerguntasExtras(),
    dadosDaConta(session?.user?.id),
    consultarDisponibilidade({ mes }),
  ])

  if (!regulamento) return <AgendamentoFechado contato={contato} />

  return (
    <FluxoAgendamento
      regras={{
        antecedenciaHoras: visitacao.antecedenciaHoras,
        maxPessoasPorGrupo: visitacao.maxPessoasPorGrupo,
        maxGruposPorDia: visitacao.maxGruposPorDia,
        umTurnoPorDia: visitacao.umTurnoPorDia,
        textoRegistroFotografico: visitacao.textoRegistroFotografico,
        mercadoArteUrl: visitacao.mercadoArteUrl,
      }}
      regulamento={{ versao: regulamento.versao, texto: regulamento.texto }}
      perguntas={perguntas ? { titulo: perguntas.titulo, descricao: perguntas.descricao, campos: perguntas.campos } : null}
      iniciais={iniciais}
      contatoEmail={contato.email}
      destinoFinal={destinoFinal}
      agendaInicial={{ mes, dias: agenda.dias }}
    />
  )
}
