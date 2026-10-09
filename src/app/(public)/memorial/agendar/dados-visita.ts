import { solicitarVisitaSchema } from '@/lib/schemas/memorial-agendamento'
import { errosPorCampo } from '@/lib/forms'
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
  faixaEtaria: string
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
  turma: '',
  endereco: '',
  cidade: '',
  responsavelNome: '',
  responsavelCargo: '',
  responsavelEmail: '',
  responsavelTelefone: '',
  preferenciaContato: '',
  observacoes: '',
  necessidades: '',
}

/** Ordem e rótulos dos campos da etapa do grupo, usados também no resumo de erros. */
export const CAMPOS_GRUPO: { nome: CampoVisita; label: string }[] = [
  { nome: 'tipoVisitante', label: 'Tipo de visitante' },
  { nome: 'instituicao', label: 'Instituição ou grupo' },
  { nome: 'quantidade', label: 'Quantidade de pessoas' },
  { nome: 'faixaEtaria', label: 'Faixa etária' },
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

const schemaGrupo = solicitarVisitaSchema.pick({
  tipoVisitante: true,
  instituicao: true,
  quantidade: true,
  faixaEtaria: true,
  turma: true,
  endereco: true,
  cidade: true,
  responsavelNome: true,
  responsavelCargo: true,
  responsavelEmail: true,
  responsavelTelefone: true,
  preferenciaContato: true,
  observacoes: true,
  necessidades: true,
})

/** Mesmo schema que a API aplica, mais o teto de pessoas que vem da configuração. */
export function validarGrupo(dados: DadosVisita, maxPessoas: number): ErrosVisita {
  const lido = schemaGrupo.safeParse(dados)
  const erros: ErrosVisita = lido.success ? {} : errosPorCampo(lido.error)
  if (!erros.quantidade && Number(dados.quantidade) > maxPessoas) {
    erros.quantidade = `Cada agendamento atende até ${maxPessoas} pessoas.`
  }
  return erros
}

/** Corpo do POST: só o que tem valor, já no formato do schema. */
export function montarPedido(
  dados: DadosVisita,
  regulamentoVersao: number,
  perguntasExtras?: Record<string, unknown>,
) {
  const preenchidos = Object.fromEntries(Object.entries(dados).filter(([, v]) => v.trim() !== ''))
  return { ...preenchidos, quantidade: Number(dados.quantidade), regulamentoVersao, aceite: true, perguntasExtras }
}
