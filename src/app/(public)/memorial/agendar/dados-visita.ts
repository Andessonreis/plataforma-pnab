import { solicitarVisitaSchema } from '@/lib/schemas/memorial-agendamento'
import { errosPorCampo } from '@/lib/forms'
import { ehVisitaEscolar, PREFERENCIAS_CONTATO } from '@/lib/memorial/agendamento/status'
import type { MemorialTurno } from '@prisma/client'

/** Tudo que o fluxo guarda entre uma etapa e outra, como o formulário enxerga (texto). */
export interface DadosVisita {
  data: string
  turno: MemorialTurno | ''
  horaInicio: string
  horaFim: string
  tipoVisitante: string
  instituicao: string
  quantidade: string
  /** Faixa escolhida na lista (id) ou "personalizada"; só a tela usa, a API recebe as idades. */
  faixaEtaria: string
  idadeMinima: string
  idadeMaxima: string
  turma: string
  endereco: string
  cidade: string
  responsavelNome: string
  responsavelCargo: string
  responsavelEmail: string
  responsavelTelefone: string
  preferenciaContato: string
  observacoes: string
  necessidades: string
}

export type CampoVisita = keyof DadosVisita
export type ErrosVisita = Partial<Record<CampoVisita, string>>

export const DADOS_VAZIOS: DadosVisita = {
  data: '',
  turno: '',
  horaInicio: '',
  horaFim: '',
  tipoVisitante: '',
  instituicao: '',
  quantidade: '',
  faixaEtaria: '',
  idadeMinima: '',
  idadeMaxima: '',
  turma: '',
  endereco: '',
  cidade: '',
  responsavelNome: '',
  responsavelCargo: '',
  responsavelEmail: '',
  responsavelTelefone: '',
  preferenciaContato: PREFERENCIAS_CONTATO[0],
  observacoes: '',
  necessidades: '',
}

/** Ordem e rótulos dos campos da etapa do grupo, usados também no resumo de erros. */
export const CAMPOS_GRUPO: { nome: CampoVisita; label: string }[] = [
  { nome: 'tipoVisitante', label: 'Tipo de visitante' },
  { nome: 'instituicao', label: 'Instituição ou grupo' },
  { nome: 'quantidade', label: 'Quantidade de pessoas' },
  { nome: 'faixaEtaria', label: 'Faixa etária' },
  { nome: 'idadeMinima', label: 'Idade inicial' },
  { nome: 'idadeMaxima', label: 'Idade final' },
  { nome: 'turma', label: 'Ano ou turma' },
  { nome: 'endereco', label: 'Endereço' },
  { nome: 'cidade', label: 'Cidade' },
  { nome: 'responsavelNome', label: 'Nome do responsável' },
  { nome: 'responsavelCargo', label: 'Cargo ou função' },
  { nome: 'responsavelEmail', label: 'E-mail' },
  { nome: 'responsavelTelefone', label: 'Telefone ou WhatsApp' },
  { nome: 'preferenciaContato', label: 'Como prefere ser avisado' },
  { nome: 'observacoes', label: 'Observações' },
  { nome: 'necessidades', label: 'Necessidades específicas' },
]

const NOMES_GRUPO = new Set<string>(CAMPOS_GRUPO.map((c) => c.nome))

/** Corpo do POST: só o que tem valor, já no formato do schema. Ano/turma só vai para escolas. */
export function montarPedido(dados: DadosVisita, regulamentoVersao: number, perguntasExtras?: Record<string, unknown>) {
  // A faixa escolhida na lista é só da tela: a API recebe as duas idades.
  const preenchidos = Object.fromEntries(
    Object.entries(dados).filter(([campo, v]) => campo !== 'faixaEtaria' && campo !== 'turma' && v.trim() !== ''),
  )
  return {
    ...preenchidos,
    ...(ehVisitaEscolar(dados.tipoVisitante) && dados.turma.trim() ? { turma: dados.turma } : {}),
    regulamentoVersao,
    aceite: true,
    perguntasExtras,
  }
}

/**
 * Valida a etapa do grupo com o mesmo schema da API (inclusive o teto de pessoas da
 * configuração) e devolve só os erros desta etapa. Sem faixa escolhida, o aviso fica no
 * grupo de opções, e não nas idades, que ainda nem aparecem.
 */
export function validarGrupo(dados: DadosVisita, maxPessoas: number): ErrosVisita {
  const lido = solicitarVisitaSchema(maxPessoas).safeParse(montarPedido(dados, 1))
  const todos: ErrosVisita = lido.success ? {} : errosPorCampo(lido.error)
  const erros = Object.fromEntries(Object.entries(todos).filter(([campo]) => NOMES_GRUPO.has(campo))) as ErrosVisita
  if (!dados.faixaEtaria) {
    delete erros.idadeMinima
    delete erros.idadeMaxima
    erros.faixaEtaria = 'Escolha a faixa etária do grupo.'
  }
  return erros
}
