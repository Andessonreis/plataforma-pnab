import { getConfig } from '@/lib/memorial/config'
import { regrasDeVisita } from '@/lib/memorial/texto-visita'
import { diaEmIrece, diaParaDate, somarDias } from '@/lib/memorial/agendamento/datas'
import { listarPublicas } from '@/lib/services/memorial-exposicao.service'
import { consultarDisponibilidade } from '@/lib/services/memorial-agendamento.service'
import type { ConviteMemorial } from '@/components/home/convite-memorial/tipos'

/** Janela olhada para achar horários livres: curta, para a consulta continuar barata. */
const JANELA_DIAS = 21

/** "2026-10-15" → "qua., 15/10". O dia vem à meia-noite UTC, então o fuso é UTC. */
const rotuloDia = (dia: string) =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(
    diaParaDate(dia),
  )

/**
 * Tudo o que o convite do Memorial mostra na página inicial, em consultas
 * paralelas: textos e regras das configurações do Memorial (o que a equipe
 * salvou no painel), exposições publicadas e os primeiros horários livres
 * das próximas três semanas. Nada aqui é texto fixo do código.
 */
export async function buscarConviteMemorial(agora: Date): Promise<ConviteMemorial> {
  const hoje = diaEmIrece(agora)
  const [institucional, contato, visitacao, expos, agenda] = await Promise.all([
    getConfig('institucional'),
    getConfig('contato'),
    getConfig('visitacao'),
    listarPublicas({ page: 1, pageSize: 3 }),
    consultarDisponibilidade({ de: hoje, ate: somarDias(hoje, JANELA_DIAS) }, agora),
  ])

  const proximos = agenda.dias
    .flatMap((d) => d.horarios.filter((h) => h.motivo === null).map((h) => `${rotuloDia(d.data)} · ${h.inicio}`))
    .slice(0, 3)

  return {
    titulo: institucional.titulo,
    chamada: institucional.chamada,
    texto: institucional.texto,
    regras: regrasDeVisita(visitacao),
    exposicoes: expos.itens.map(({ slug, titulo, periodo, capaUrl }) => ({ slug, titulo, periodo, capaUrl })),
    proximos,
    contatos: [contato.endereco, contato.funcionamento, contato.telefone, contato.whatsapp && `WhatsApp ${contato.whatsapp}`, contato.email].filter(
      (c): c is string => Boolean(c),
    ),
  }
}
