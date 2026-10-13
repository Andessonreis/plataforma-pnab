import type { contarConteudo } from '@/lib/services/memorial-painel.service'
import type { Tarefa } from './visao-tarefas'

type Contagens = Awaited<ReturnType<typeof contarConteudo>>

const GRUPOS = [
  { chave: 'exposicoes', um: 'exposição', varios: 'exposições', href: '/admin/memorial/exposicoes' },
  { chave: 'acervo', um: 'item do acervo', varios: 'itens do acervo', href: '/admin/memorial/acervo' },
  { chave: 'pessoas', um: 'pessoa', varios: 'pessoas', href: '/admin/memorial/pessoas' },
  { chave: 'eventos', um: 'evento', varios: 'eventos', href: '/admin/memorial/pessoas?aba=eventos' },
] as const

const comFiltro = (href: string, status: string) => `${href}${href.includes('?') ? '&' : '?'}status=${status}`

/**
 * Conteúdo parado esperando a equipe, em frases curtas com o link que resolve.
 * Revisão vem antes de publicação, porque só se publica o que já foi revisado.
 */
export function tarefasDeConteudo(c: Contagens): Tarefa[] {
  const tarefas: Tarefa[] = []
  for (const etapa of ['EM_REVISAO', 'APROVADO'] as const) {
    for (const g of GRUPOS) {
      const n = c[g.chave][etapa] ?? 0
      if (n === 0) continue
      const nome = n === 1 ? g.um : g.varios
      tarefas.push(
        etapa === 'EM_REVISAO'
          ? { texto: `${n} ${nome} esperando revisão`, href: comFiltro(g.href, etapa), acao: 'Revisar' }
          : { texto: `${n} ${nome} esperando publicação`, href: comFiltro(g.href, etapa), acao: 'Publicar' },
      )
    }
  }
  if (c.fotosSemAutorizacao > 0) {
    const n = c.fotosSemAutorizacao
    tarefas.push({
      texto: n === 1 ? '1 foto sem autorização de uso registrada' : `${n} fotos sem autorização de uso registrada`,
      href: '/admin/memorial/acervo?tipo=FOTOGRAFIA',
      acao: 'Conferir',
    })
  }
  return tarefas
}

/** Frase do topo: o que espera a equipe e o que acontece hoje. */
export function resumoDoDia(pendentes: number, visitasHoje: number, pessoasHoje: number): string {
  const pedidos =
    pendentes === 0 ? 'Nenhum pedido esperando resposta.' : pendentes === 1 ? '1 pedido espera resposta.' : `${pendentes} pedidos esperam resposta.`
  const hoje =
    visitasHoje === 0
      ? 'Nenhuma visita marcada para hoje.'
      : `${visitasHoje === 1 ? '1 grupo vem' : `${visitasHoje} grupos vêm`} hoje, ${pessoasHoje} pessoas.`
  return `${pedidos} ${hoje}`
}
