'use client'

import { useState, useRef, useEffect, useCallback, useMemo, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button, Card, Textarea, Select } from '@/components/ui'
import type { EditalStatus } from '@prisma/client'
import { EditalArquivos, type EditalArquivosHandle } from './edital-arquivos'
import type { CronogramaItem, CronogramaFormItem } from '@/types/cronograma'
import { cronogramaToFormItems, formItemsToCronograma, validateCronogramaOrder } from '@/lib/utils/cronograma'
import { CHAR_LIMIT_DEFAULTS } from '@/lib/campo-limits'
import type { CriterioAvaliacao } from '@/lib/avaliacao-criterios'
import type { CampoFormulario } from '@/types/campo-formulario'
import type { TipoProponente } from '@prisma/client'
import { CronogramaEditor } from './cronograma-editor'
import type { TipoAnexo } from '@/lib/constants/attachment-types'

const TIPO_PROPONENTE_OPTIONS: { value: TipoProponente; label: string }[] = [
  { value: 'PF', label: 'Pessoa Física' },
  { value: 'MEI', label: 'MEI' },
  { value: 'PJ', label: 'Pessoa Jurídica' },
  { value: 'COLETIVO', label: 'Coletivo' },
]

interface RegraDesempate {
  descricao: string
  tipo: 'bloco' | 'criterio'
  ref: string
  direcao: 'desc' | 'asc'
}

interface MembroEquipe {
  id: string
  nome: string
  email: string
}

interface EditalFormProps {
  initialData?: {
    id: string
    titulo: string
    resumo: string
    ano: number
    valorTotal: string
    categorias: string[]
    acoesAfirmativas: string
    regrasElegibilidade: string
    cronograma: CronogramaItem[]
    camposFormulario: CampoFormulario[]
    status: EditalStatus
    vagasContemplados: number | null
    vagasSuplentes: number | null
    criteriosAvaliacao?: CriterioAvaliacao[]
    tiposAnexo?: TipoAnexo[] | null
    notaMinima?: number | null
    desempate?: RegraDesempate[] | null
    initialAvaliadores?: MembroEquipe[]
    initialHabilitadores?: MembroEquipe[]
  }
}

export const CATEGORIAS_OPCOES = [
  'Artes Visuais',
  'Música',
  'Teatro',
  'Dança',
  'Literatura',
  'Circo',
  'Audiovisual',
  'Artesanato',
  'Cultura Popular',
  'Patrimônio Cultural',
  'Cultura Digital',
  'Gastronomia',
  'Moda',
  'Hip Hop',
  'Culturas Indígenas',
  'Culturas Afro-Brasileiras',
]

const TEMPLATE_REGRAS = [
  '• Ser pessoa física ou jurídica residente ou com sede no município de Irecê/BA',
  '• Possuir CPF ou CNPJ ativo e regular',
  '• Não estar inscrito em cadastros de inadimplentes (CADIN, SPC, Serasa)',
  '• Estar em dia com obrigações tributárias municipais, estaduais e federais',
  '• Não ter recebido recursos de editais anteriores da PNAB em situação irregular',
  '• Ter capacidade técnica comprovada para execução da ação cultural proposta',
  '• A proposta deve ser inédita e não ter sido contemplada em outro edital vigente',
].join('\n')

const TEMPLATE_ACOES = [
  '• Reserva de vagas para pessoas negras (mínimo 20% das vagas)',
  '• Reserva de vagas para pessoas com deficiência (mínimo 5% das vagas)',
  '• Prioridade para proponentes de comunidades tradicionais (quilombolas, indígenas)',
  '• Pontuação adicional para propostas que contemplem mulheres em situação de vulnerabilidade',
  '• Pontuação adicional para propostas realizadas em periferias e territórios de baixa renda',
  '• Incentivo a propostas que promovam a cultura afro-brasileira e indígena',
].join('\n')

const STATUS_OPTIONS = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'PUBLICADO', label: 'Publicado' },
  { value: 'INSCRICOES_ABERTAS', label: 'Inscrições Abertas' },
  { value: 'INSCRICOES_ENCERRADAS', label: 'Inscrições Encerradas' },
  { value: 'HABILITACAO', label: 'Habilitação' },
  { value: 'AVALIACAO', label: 'Avaliação' },
  { value: 'RESULTADO_PRELIMINAR', label: 'Resultado Preliminar' },
  { value: 'RECURSO', label: 'Recurso' },
  { value: 'RESULTADO_FINAL', label: 'Resultado Final' },
  { value: 'ENCERRADO', label: 'Encerrado' },
]

const currentYear = new Date().getFullYear()
const ANO_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const y = currentYear - 1 + i
  return { value: String(y), label: String(y) }
})

/** Formata dígitos digitados como moeda BRL: 150000 → "1.500,00" */
function formatarMoeda(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function EditalForm({ initialData }: EditalFormProps) {
  const router = useRouter()
  const isEdit = !!initialData
  const arquivosRef = useRef<EditalArquivosHandle>(null)

  const [titulo, setTitulo] = useState(initialData?.titulo ?? '')
  const [resumo, setResumo] = useState(initialData?.resumo ?? '')
  const [ano, setAno] = useState(String(initialData?.ano ?? currentYear))
  const [valorTotal, setValorTotal] = useState(() => {
    if (!initialData?.valorTotal) return ''
    // Converte "1500.00" (do banco) para "1.500,00" (exibição)
    const num = parseFloat(String(initialData.valorTotal).replace(',', '.'))
    return isNaN(num) ? '' : num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  })
  const [categorias, setCategorias] = useState<string[]>(initialData?.categorias ?? [])
  const [novaCategoria, setNovaCategoria] = useState('')
  const [regrasElegibilidade, setRegrasElegibilidade] = useState(initialData?.regrasElegibilidade ?? '')
  const [acoesAfirmativas, setAcoesAfirmativas] = useState(initialData?.acoesAfirmativas ?? '')
  const [status, setStatus] = useState<EditalStatus>(initialData?.status ?? 'RASCUNHO')

  // Cronograma: estado unificado com IDs efêmeros para drag & drop
  const [cronogramaItems, setCronogramaItems] = useState<CronogramaFormItem[]>(() => {
    if (initialData?.cronograma && initialData.cronograma.length > 0) {
      return cronogramaToFormItems(initialData.cronograma)
    }
    return []
  })

  // Validação de ordem cronológica em tempo real
  const cronogramaWarnings = useMemo(
    () => validateCronogramaOrder(cronogramaItems),
    [cronogramaItems],
  )

  const [vagasContemplados, setVagasContemplados] = useState(
    initialData?.vagasContemplados != null ? String(initialData.vagasContemplados) : ''
  )
  const [vagasSuplentes, setVagasSuplentes] = useState(
    initialData?.vagasSuplentes != null ? String(initialData.vagasSuplentes) : ''
  )
  const [camposFormulario, setCamposFormulario] = useState<CampoFormulario[]>(
    initialData?.camposFormulario ?? []
  )
  const [criteriosAvaliacao, setCriteriosAvaliacao] = useState<CriterioAvaliacao[]>(
    initialData?.criteriosAvaliacao ?? []
  )
  const [tiposAnexo, setTiposAnexo] = useState<TipoAnexo[]>(
    initialData?.tiposAnexo ?? []
  )
  const [notaMinima, setNotaMinima] = useState(
    initialData?.notaMinima != null ? String(initialData.notaMinima) : ''
  )
  const [desempate, setDesempate] = useState<RegraDesempate[]>(
    initialData?.desempate ?? []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<number, boolean>>({})

  // Tipos de anexo disponíveis (da API)
  const [tiposAnexoDisponiveis, setTiposAnexoDisponiveis] = useState<{ id: string; tipo: string; label: string; obrigatorio: boolean; tag: string }[]>([])

  // Equipe do edital
  const [avaliadoresSelecionados, setAvaliadoresSelecionados] = useState<MembroEquipe[]>(
    initialData?.initialAvaliadores ?? []
  )
  const [habilitadoresSelecionados, setHabilitadoresSelecionados] = useState<MembroEquipe[]>(
    initialData?.initialHabilitadores ?? []
  )
  const [allAvaliadores, setAllAvaliadores] = useState<MembroEquipe[]>([])
  const [allHabilitadores, setAllHabilitadores] = useState<MembroEquipe[]>([])
  const [loadingEquipe, setLoadingEquipe] = useState(true)
  const [selectedAvaliadorId, setSelectedAvaliadorId] = useState('')
  const [selectedHabilitadorId, setSelectedHabilitadorId] = useState('')

  useEffect(() => {
    async function fetchElegíveis() {
      try {
        const [resAval, resHab] = await Promise.all([
          fetch('/api/admin/avaliadores'),
          fetch('/api/admin/habilitadores'),
        ])
        if (resAval.ok) {
          const json = await resAval.json()
          setAllAvaliadores(json.data.map((a: MembroEquipe) => ({
            id: a.id, nome: a.nome, email: a.email,
          })))
        }
        if (resHab.ok) {
          const json = await resHab.json()
          setAllHabilitadores(json.data.map((h: MembroEquipe) => ({
            id: h.id, nome: h.nome, email: h.email,
          })))
        }
      } catch {
        // silencioso — seção de equipe fica vazia
      } finally {
        setLoadingEquipe(false)
      }
    }
    fetchElegíveis()
  }, [])

  // Carregar tipos de anexo disponíveis
  useEffect(() => {
    async function fetchTiposAnexo() {
      try {
        const res = await fetch('/api/admin/configuracoes/tipos-anexo')
        if (res.ok) {
          const json = await res.json()
          setTiposAnexoDisponiveis(json.data)
        }
      } catch {
        // silencioso
      }
    }
    fetchTiposAnexo()
  }, [])

  function addTipoIndividual(tipoId: string) {
    const found = tiposAnexoDisponiveis.find(t => t.id === tipoId)
    if (!found) return
    // Evitar duplicar
    if (tiposAnexo.some(t => t.tipo === found.tipo)) return
    setTiposAnexo(prev => [...prev, { tipo: found.tipo, label: found.label, obrigatorio: found.obrigatorio }])
  }

  const toggleSection = useCallback((n: number) => {
    setCollapsedSections(prev => ({ ...prev, [n]: !prev[n] }))
  }, [])

  function SectionHeader({ number, title, actions, children }: {
    number: number
    title: string
    actions?: ReactNode
    children?: ReactNode
  }) {
    const collapsed = !!collapsedSections[number]
    return (
      <>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => toggleSection(number)}
            className="flex items-center gap-2 group text-left"
          >
            <svg
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
            <h2 className="text-base sm:text-lg font-semibold text-slate-800 group-hover:text-brand-700 transition-colors">
              {number}. {title}
            </h2>
          </button>
          {!collapsed && actions}
        </div>
        {!collapsed && children}
      </>
    )
  }

  function toggleCategoria(cat: string) {
    setCategorias(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  function addCategoriaPersonalizada() {
    const trimmed = novaCategoria.trim()
    if (!trimmed) return
    if (categorias.includes(trimmed)) {
      setNovaCategoria('')
      return
    }
    setCategorias(prev => [...prev, trimmed])
    setNovaCategoria('')
  }

  function addCampoFormulario() {
    setCamposFormulario(prev => [
      ...prev,
      { nome: '', label: '', tipo: 'texto', obrigatorio: false, placeholder: '', opcoes: [], hint: '', tiposProponente: [] },
    ])
  }

  function removeCampoFormulario(index: number) {
    setCamposFormulario(prev => prev.filter((_, i) => i !== index))
  }

  function updateCampoFormulario(index: number, field: keyof CampoFormulario, value: unknown) {
    setCamposFormulario(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  function addCriterio() {
    setCriteriosAvaliacao(prev => [
      ...prev,
      { criterio: '', peso: 0, notaMax: 0, descricao: '', bloco: '' },
    ])
  }

  function duplicarUltimoCriterio() {
    setCriteriosAvaliacao(prev => {
      const last = prev[prev.length - 1]
      return [
        ...prev,
        { criterio: '', peso: 0, notaMax: 0, descricao: '', bloco: last?.bloco ?? '' },
      ]
    })
  }

  function removeCriterio(index: number) {
    setCriteriosAvaliacao(prev => prev.filter((_, i) => i !== index))
  }

  function updateCriterio(index: number, field: keyof CriterioAvaliacao, value: unknown) {
    setCriteriosAvaliacao(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Bloqueia submit se há erros de cronograma
    if (cronogramaWarnings.length > 0) {
      setError('Corrija as datas fora de ordem no cronograma antes de salvar.')
      setLoading(false)
      return
    }

    // Remove IDs efêmeros e filtra items sem conteúdo
    const cronogramaFiltrado: CronogramaItem[] = formItemsToCronograma(
      cronogramaItems.filter((item) => {
        if (item.tipo === 'fase') return true // Fases fixas sempre incluídas (podem ter data vazia)
        return item.label?.trim() // Custom items precisam de label
      }),
    )

    // Converte valorTotal para número (aceita vírgula como separador decimal)
    const valorTotalNum = valorTotal.trim()
      ? parseFloat(valorTotal.replace(/\./g, '').replace(',', '.'))
      : null

    // Gerar nome automático a partir do label se não preenchido
    const camposFiltrados = camposFormulario
      .filter(c => c.label.trim() !== '')
      .map(c => ({
        ...c,
        nome: c.nome.trim() || c.label.trim().toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      }))

    const body = {
      titulo,
      resumo,
      ano: Number(ano),
      valorTotal: valorTotalNum,
      categorias,
      regrasElegibilidade,
      acoesAfirmativas,
      status,
      cronograma: cronogramaFiltrado,
      camposFormulario: camposFiltrados,
      vagasContemplados: vagasContemplados.trim() ? Number(vagasContemplados) : null,
      vagasSuplentes: vagasSuplentes.trim() ? Number(vagasSuplentes) : null,
      criteriosAvaliacao: criteriosAvaliacao.length > 0 ? criteriosAvaliacao : null,
      tiposAnexo: tiposAnexo.length > 0 ? tiposAnexo : null,
      notaMinima: notaMinima.trim() ? Number(notaMinima) : null,
      desempate: desempate.length > 0 ? desempate : null,
    }

    try {
      const url = isEdit
        ? `/api/admin/editais?id=${initialData!.id}`
        : '/api/admin/editais'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...body, id: initialData!.id } : body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? `Erro ${res.status}`)
      }

      const data = await res.json()
      const editalId: string = data.id ?? initialData?.id ?? ''

      // Salvar equipe do edital
      const initialAvalIds = new Set((initialData?.initialAvaliadores ?? []).map(a => a.id))
      const initialHabIds = new Set((initialData?.initialHabilitadores ?? []).map(h => h.id))
      const currentAvalIds = new Set(avaliadoresSelecionados.map(a => a.id))
      const currentHabIds = new Set(habilitadoresSelecionados.map(h => h.id))

      // Remover membros que estavam e foram retirados (só na edição)
      if (isEdit) {
        const avalRemovidos = [...initialAvalIds].filter(id => !currentAvalIds.has(id))
        const habRemovidos = [...initialHabIds].filter(id => !currentHabIds.has(id))
        for (const userId of avalRemovidos) {
          await fetch(`/api/admin/editais/${editalId}/equipe`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, funcao: 'AVALIADOR' }),
          })
        }
        for (const userId of habRemovidos) {
          await fetch(`/api/admin/editais/${editalId}/equipe`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, funcao: 'HABILITADOR' }),
          })
        }
      }

      // Adicionar novos membros
      const avalNovos = avaliadoresSelecionados.filter(a => !initialAvalIds.has(a.id))
      const habNovos = habilitadoresSelecionados.filter(h => !initialHabIds.has(h.id))
      if (avalNovos.length > 0) {
        await fetch(`/api/admin/editais/${editalId}/equipe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: avalNovos.map(a => a.id), funcao: 'AVALIADOR' }),
        })
      }
      if (habNovos.length > 0) {
        await fetch(`/api/admin/editais/${editalId}/equipe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: habNovos.map(h => h.id), funcao: 'HABILITADOR' }),
        })
      }

      if (arquivosRef.current?.hasPending()) {
        await arquivosRef.current.uploadPending(editalId)
      }

      router.push('/admin/editais')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-8">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Secao 1 - Informacoes Basicas */}
      <Card padding="sm" className="sm:p-6">
        <SectionHeader number={1} title="Informações Básicas" />
        {!collapsedSections[1] && <div className="grid gap-4 sm:gap-5 mt-4 sm:mt-5">
          <Input
            label="Título do Edital"
            required
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ex.: Edital de Fomento à Cultura Popular 2025"
          />
          <Textarea
            label="Resumo / Descrição"
            required
            rows={4}
            value={resumo}
            onChange={e => setResumo(e.target.value)}
            placeholder="Descreva brevemente o objeto e objetivos deste edital"
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <Select
              label="Ano"
              required
              value={ano}
              options={ANO_OPTIONS}
              onChange={e => setAno(e.target.value)}
            />
            <Input
              label="Valor Total (R$)"
              required
              type="text"
              inputMode="numeric"
              value={valorTotal}
              onChange={e => setValorTotal(formatarMoeda(e.target.value))}
              placeholder="0,00"
            />
          </div>
          <Select
            label="Status"
            required
            value={status}
            options={STATUS_OPTIONS}
            onChange={e => setStatus(e.target.value as EditalStatus)}
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <Input
              label="Vagas Contemplados"
              type="number"
              min={1}
              value={vagasContemplados}
              onChange={e => setVagasContemplados(e.target.value)}
              placeholder="Ilimitado"
            />
            <Input
              label="Vagas Suplentes"
              type="number"
              min={0}
              value={vagasSuplentes}
              onChange={e => setVagasSuplentes(e.target.value)}
              placeholder="Ilimitado"
            />
          </div>
        </div>}
      </Card>

      {/* Secao 2 - Categorias */}
      <Card padding="sm" className="sm:p-6">
        <SectionHeader number={2} title="Categorias Culturais">
          <p className="text-sm text-slate-500 mt-2">
            Selecione todas as categorias contempladas por este edital.
          </p>
        </SectionHeader>
        {!collapsedSections[2] && <>
          <div className="flex flex-wrap gap-2 mt-4">
            {CATEGORIAS_OPCOES.map(cat => {
              const selected = categorias.includes(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategoria(cat)}
                  aria-pressed={selected}
                  className={[
                    'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2',
                    selected
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400',
                  ].join(' ')}
                >
                  {cat}
                </button>
              )
            })}
          </div>

          {/* Tags personalizadas (não predefinidas) */}
          {categorias.filter(c => !CATEGORIAS_OPCOES.includes(c)).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {categorias.filter(c => !CATEGORIAS_OPCOES.includes(c)).map(cat => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 rounded-full border border-brand-600 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700"
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => setCategorias(prev => prev.filter(c => c !== cat))}
                    className="ml-0.5 text-brand-400 hover:text-red-500"
                    aria-label={`Remover ${cat}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input para adicionar categoria livre */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={novaCategoria}
              onChange={e => setNovaCategoria(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategoriaPersonalizada() } }}
              placeholder="Adicionar outra categoria..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={addCategoriaPersonalizada}
              className="rounded-lg border border-brand-600 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
            >
              Adicionar
            </button>
          </div>

          {categorias.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              {categorias.length} categoria(s) selecionada(s)
            </p>
          )}
        </>}
      </Card>

      {/* Secao 3 - Regras e Acoes */}
      <Card padding="sm" className="sm:p-6">
        <SectionHeader number={3} title="Regras e Ações Afirmativas" />
        {!collapsedSections[3] && <div className="space-y-5 sm:space-y-6 mt-4 sm:mt-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="regras-elegibilidade" className="block text-sm font-medium text-slate-700">
                Regras de Elegibilidade
              </label>
              <button
                type="button"
                onClick={() => setRegrasElegibilidade(TEMPLATE_REGRAS)}
                className="text-xs text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline"
              >
                Usar modelo padrão
              </button>
            </div>
            <textarea
              id="regras-elegibilidade"
              rows={5}
              value={regrasElegibilidade}
              onChange={e => setRegrasElegibilidade(e.target.value)}
              placeholder="Liste os requisitos para participação neste edital (um por linha)"
              className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors resize-y focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-500 focus:ring-brand-200"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="acoes-afirmativas" className="block text-sm font-medium text-slate-700">
                Ações Afirmativas
              </label>
              <button
                type="button"
                onClick={() => setAcoesAfirmativas(TEMPLATE_ACOES)}
                className="text-xs text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline"
              >
                Usar modelo padrão
              </button>
            </div>
            <textarea
              id="acoes-afirmativas"
              rows={5}
              value={acoesAfirmativas}
              onChange={e => setAcoesAfirmativas(e.target.value)}
              placeholder="Liste as ações afirmativas previstas neste edital (uma por linha)"
              className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors resize-y focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-500 focus:ring-brand-200"
            />
          </div>
        </div>}
      </Card>

      {/* Secao 4 - Campos do Formulário de Inscrição */}
      <Card padding="sm" className="sm:p-6">
        <SectionHeader
          number={4}
          title="Campos do Formulário de Inscrição"
          actions={
            <Button type="button" variant="outline" size="sm" onClick={addCampoFormulario}>
              + Adicionar campo
            </Button>
          }
        >
          <p className="text-sm text-slate-500 mt-2">
            Configure os campos que o proponente deverá preencher ao se inscrever.
          </p>
        </SectionHeader>

        {!collapsedSections[4] && (camposFormulario.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Nenhum campo configurado. O formulário de inscrição ficará vazio.
          </p>
        ) : (
          <div className="space-y-4">
            {camposFormulario.map((campo, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-slate-400">Campo {idx + 1}</span>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeCampoFormulario(idx)}
                    aria-label={`Remover campo ${idx + 1}`}
                  >
                    Remover
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Label (exibido ao proponente)"
                    required
                    value={campo.label}
                    onChange={e => updateCampoFormulario(idx, 'label', e.target.value)}
                    placeholder="Ex.: Nome do Projeto"
                  />
                  <Select
                    label="Tipo do campo"
                    required
                    value={campo.tipo}
                    options={[
                      { value: 'texto', label: 'Texto curto' },
                      { value: 'textarea', label: 'Texto longo' },
                      { value: 'numero', label: 'Número' },
                      { value: 'data', label: 'Data' },
                      { value: 'select', label: 'Seleção (dropdown)' },
                      { value: 'multiselect', label: 'Seleção múltipla' },
                      { value: 'arquivo', label: 'Arquivo' },
                    ]}
                    onChange={e => {
                      updateCampoFormulario(idx, 'tipo', e.target.value)
                      // Limpar limites customizados ao trocar tipo
                      updateCampoFormulario(idx, 'minLength', null)
                      updateCampoFormulario(idx, 'maxLength', null)
                    }}
                  />
                </div>

                {campo.tipo === 'arquivo' && (
                  <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                    Campos do tipo <strong>arquivo</strong> aparecem na etapa de <strong>Anexos</strong> da inscrição, não em &quot;Dados do Projeto&quot;. Para campos de preenchimento, use outro tipo.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Placeholder"
                    value={campo.placeholder}
                    onChange={e => updateCampoFormulario(idx, 'placeholder', e.target.value)}
                    placeholder="Texto de exemplo no campo"
                  />
                  <Input
                    label="Dica (hint)"
                    value={campo.hint}
                    onChange={e => updateCampoFormulario(idx, 'hint', e.target.value)}
                    placeholder="Texto de ajuda abaixo do campo"
                  />
                </div>

                {(campo.tipo === 'select' || campo.tipo === 'multiselect') && (
                  <Input
                    label="Opções (separadas por vírgula)"
                    value={(campo.opcoes ?? []).join(', ')}
                    onChange={e => updateCampoFormulario(idx, 'opcoes', e.target.value.split(',').map(o => o.trim()).filter(Boolean))}
                    placeholder="Opção 1, Opção 2, Opção 3"
                  />
                )}

                {(['texto', 'textarea', 'numero'] as const).includes(campo.tipo as 'texto' | 'textarea' | 'numero') && (() => {
                  const defaults = CHAR_LIMIT_DEFAULTS[campo.tipo]
                  return (
                    <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-3 space-y-2">
                      <p className="text-xs font-medium text-slate-600">
                        Limite de caracteres
                        <span className="ml-1 font-normal text-slate-400">— deixe vazio para usar o padrão</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Mínimo"
                          type="number"
                          min={0}
                          value={campo.minLength != null ? String(campo.minLength) : ''}
                          onChange={e => {
                            const v = e.target.value.trim()
                            updateCampoFormulario(idx, 'minLength', v === '' ? null : Number(v))
                          }}
                          placeholder={`Padrão: ${defaults?.minLength ?? 0}`}
                        />
                        <Input
                          label="Máximo"
                          type="number"
                          min={1}
                          value={campo.maxLength != null ? String(campo.maxLength) : ''}
                          onChange={e => {
                            const v = e.target.value.trim()
                            updateCampoFormulario(idx, 'maxLength', v === '' ? null : Number(v))
                          }}
                          placeholder={`Padrão: ${defaults?.maxLength ?? 200}`}
                        />
                      </div>
                    </div>
                  )
                })()}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={campo.obrigatorio}
                    onChange={e => updateCampoFormulario(idx, 'obrigatorio', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-700">Campo obrigatório</span>
                </label>

                {/* Visibilidade por tipo de proponente */}
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1.5">
                    Visível para tipos de proponente
                    <span className="ml-1 font-normal text-slate-400">— vazio = todos</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TIPO_PROPONENTE_OPTIONS.map(opt => {
                      const selected = campo.tiposProponente ?? []
                      const isActive = selected.includes(opt.value)
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const current = campo.tiposProponente ?? []
                            const next = isActive
                              ? current.filter(t => t !== opt.value)
                              : [...current, opt.value]
                            updateCampoFormulario(idx, 'tiposProponente', next)
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            isActive
                              ? 'bg-brand-600 text-white border-brand-600'
                              : 'bg-white text-slate-600 border-slate-300 hover:border-brand-400 hover:text-brand-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </Card>

      {/* Secao 5 - Critérios de Avaliação */}
      <Card padding="sm" className="sm:p-6">
        <SectionHeader
          number={5}
          title="Critérios de Avaliação"
          actions={
            <div className="flex items-center gap-2">
              {criteriosAvaliacao.length === 0 ? (
                <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Usando critérios padrão PNAB (5)
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-medium text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full">
                  {criteriosAvaliacao.length} critérios customizados
                </span>
              )}
              {criteriosAvaliacao.length > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={duplicarUltimoCriterio}>
                  + Duplicar último
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={addCriterio}>
                + Adicionar critério
              </Button>
            </div>
          }
        >
          <p className="text-sm text-slate-500 mt-2">
            Configure critérios específicos para este edital. Se vazio, serão usados os 5 critérios padrão PNAB.
          </p>
        </SectionHeader>

        {!collapsedSections[5] && <>{criteriosAvaliacao.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4 mt-4">
            Nenhum critério customizado. O edital usará os critérios padrão PNAB.
          </p>
        ) : (
          <>
            <div className="space-y-4">
              {criteriosAvaliacao.map((crit, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-slate-400">Critério {idx + 1}</span>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeCriterio(idx)}
                      aria-label={`Remover critério ${idx + 1}`}
                    >
                      Remover
                    </Button>
                  </div>

                  <Input
                    label="Bloco / Grupo"
                    value={crit.bloco ?? ''}
                    onChange={e => updateCriterio(idx, 'bloco', e.target.value)}
                    placeholder="Ex: Bloco 1 — Atuação da entidade"
                  />

                  <Input
                    label="Nome do Critério"
                    required
                    value={crit.criterio}
                    onChange={e => updateCriterio(idx, 'criterio', e.target.value)}
                    placeholder="Nome do critério"
                  />

                  <Input
                    label="Descrição / Orientação"
                    value={crit.descricao ?? ''}
                    onChange={e => updateCriterio(idx, 'descricao', e.target.value)}
                    placeholder="Descrição ou orientação para o avaliador"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Nota Máxima"
                      type="number"
                      required
                      min={0}
                      step={0.5}
                      value={crit.notaMax || ''}
                      onChange={e => updateCriterio(idx, 'notaMax', e.target.value ? Number(e.target.value) : 0)}
                      placeholder="Nota máxima"
                    />
                    <Input
                      label="Peso"
                      type="number"
                      required
                      min={0}
                      step={0.5}
                      value={crit.peso || ''}
                      onChange={e => updateCriterio(idx, 'peso', e.target.value ? Number(e.target.value) : 0)}
                      placeholder="Peso"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo */}
            <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between text-sm">
              <div className="flex gap-6">
                <span className="text-slate-600">
                  Total de pesos: <strong className="text-slate-800">{criteriosAvaliacao.reduce((s, c) => s + c.peso, 0)}</strong>
                </span>
                <span className="text-slate-600">
                  Nota máxima possível: <strong className="text-slate-800">{criteriosAvaliacao.reduce((s, c) => s + c.notaMax, 0)}</strong>
                </span>
              </div>
              <span className="text-slate-500">{criteriosAvaliacao.length} critério(s)</span>
            </div>
          </>
        )}

        {/* Nota Mínima */}
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Nota Mínima para Classificação</h3>
          <p className="text-xs text-slate-500 mb-3">
            Inscrições com nota abaixo deste valor serão automaticamente não contempladas. A nota é na escala 0-10 (normalizada). Deixe em branco para sem corte.
          </p>
          <Input
            label="Nota mínima (escala 0-10)"
            type="number"
            step="0.01"
            min={0}
            max={10}
            value={notaMinima}
            onChange={e => setNotaMinima(e.target.value)}
            placeholder="Ex: 3.0 (equivale a 60/200)"
          />
        </div>

        {/* Regras de Desempate */}
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-700">Regras de Desempate</h3>
              {desempate.length === 0 ? (
                <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Sem regras de desempate
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-medium text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full">
                  {desempate.length} regra(s) configurada(s)
                </span>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setDesempate(prev => [
              ...prev,
              { descricao: '', tipo: 'bloco', ref: '', direcao: 'desc' },
            ])}>
              + Adicionar regra
            </Button>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Defina critérios de desempate em ordem de prioridade. O primeiro item é o critério mais importante.
          </p>

          {desempate.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-3">
              Nenhuma regra de desempate. Em caso de empate, a ordem será aleatória.
            </p>
          ) : (
            <div className="space-y-3">
              {desempate.map((regra, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-slate-400">{idx + 1}º critério de desempate</span>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setDesempate(prev => prev.filter((_, i) => i !== idx))}
                      aria-label={`Remover regra de desempate ${idx + 1}`}
                    >
                      Remover
                    </Button>
                  </div>
                  <Input
                    label="Descrição"
                    value={regra.descricao}
                    onChange={e => setDesempate(prev => prev.map((r, i) => i === idx ? { ...r, descricao: e.target.value } : r))}
                    placeholder="Ex: Maior nota no Bloco 1"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Select
                      label="Tipo"
                      value={regra.tipo}
                      options={[
                        { value: 'bloco', label: 'Bloco' },
                        { value: 'criterio', label: 'Critério' },
                      ]}
                      onChange={e => setDesempate(prev => prev.map((r, i) => i === idx ? { ...r, tipo: e.target.value as 'bloco' | 'criterio' } : r))}
                    />
                    <Input
                      label="Referência"
                      value={regra.ref}
                      onChange={e => setDesempate(prev => prev.map((r, i) => i === idx ? { ...r, ref: e.target.value } : r))}
                      placeholder="Ex: Bloco 1"
                    />
                    <Select
                      label="Direção"
                      value={regra.direcao}
                      options={[
                        { value: 'desc', label: 'Maior nota vence' },
                        { value: 'asc', label: 'Menor nota vence' },
                      ]}
                      onChange={e => setDesempate(prev => prev.map((r, i) => i === idx ? { ...r, direcao: e.target.value as 'desc' | 'asc' } : r))}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div></>}
      </Card>

      {/* Secao 6 — Tipos de Anexo */}
      <Card padding="sm" className="sm:p-6">
        <SectionHeader
          number={6}
          title="Tipos de Anexo"
          actions={
            <div className="flex items-center gap-2">
              {tiposAnexo.length > 0 && (
                <>
                  <span className="inline-flex items-center text-xs font-medium text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full">
                    {tiposAnexo.length} tipo{tiposAnexo.length !== 1 ? 's' : ''} selecionado{tiposAnexo.length !== 1 ? 's' : ''}
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={() => setTiposAnexo([])}>
                    Limpar todos
                  </Button>
                </>
              )}
            </div>
          }
        >
          <p className="text-sm text-slate-500 mt-2">
            Selecione os tipos de documento que o proponente deverá enviar neste edital.{' '}
            <a href="/admin/configuracoes/tipos-anexo" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 underline">
              Gerenciar tipos
            </a>
          </p>
        </SectionHeader>

        {!collapsedSections[6] && <>
          {/* Adicionar tipo individual */}
          {tiposAnexoDisponiveis.length > 0 && (
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Adicionar tipo</label>
              <select
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                value=""
                onChange={(e) => {
                  if (e.target.value) addTipoIndividual(e.target.value)
                }}
              >
                <option value="">Selecionar tipo...</option>
                {tiposAnexoDisponiveis
                  .filter(t => !tiposAnexo.some(ta => ta.tipo === t.tipo))
                  .map(t => (
                    <option key={t.id} value={t.id}>
                      {t.label} ({t.tag}){t.obrigatorio ? ' *' : ''}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {tiposAnexo.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Nenhum tipo selecionado. Use o dropdown acima para adicionar os tipos de anexo deste edital.
            </p>
          ) : (
            <div className="space-y-3">
              {tiposAnexo.map((ta, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-slate-400">Tipo {idx + 1}</span>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setTiposAnexo(prev => prev.filter((_, i) => i !== idx))}
                      aria-label={`Remover tipo de anexo ${idx + 1}`}
                    >
                      Remover
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-900">{ta.label}</span>
                    <span className="text-xs font-mono text-slate-400">{ta.tipo}</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ta.obrigatorio}
                      onChange={e => setTiposAnexo(prev => prev.map((t, i) => i === idx ? { ...t, obrigatorio: e.target.checked } : t))}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-slate-700">Obrigatório</span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </>}
      </Card>

      {/* Secao 7 - Arquivos */}
      <Card padding="sm" className="sm:p-6">
        <SectionHeader number={7} title="Documentos e Arquivos" />
        {!collapsedSections[7] && <div className="mt-4 sm:mt-5">
          <EditalArquivos
            ref={arquivosRef}
            editalId={initialData?.id}
          />
        </div>}
      </Card>

      {/* Secao 8 - Cronograma */}
      <Card padding="sm" className="sm:p-6">
        <SectionHeader number={8} title="Cronograma" />

        {!collapsedSections[8] && <div className="mt-4 sm:mt-5">
          <CronogramaEditor
            items={cronogramaItems}
            onChange={setCronogramaItems}
            warnings={cronogramaWarnings}
          />
        </div>}
      </Card>

      {/* Secao 9 — Equipe do Edital */}
      <Card padding="sm" className="sm:p-6">
        <SectionHeader number={9} title="Equipe do Edital">
          <p className="text-sm text-slate-500 mt-2">
            Defina quais habilitadores e avaliadores trabalham neste edital. Se nenhum for atribuído, todos com o respectivo cargo terão acesso.
          </p>
        </SectionHeader>

        {!collapsedSections[9] && (
          <div className="space-y-6 mt-4">
            {/* Habilitadores */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">Habilitadores</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {habilitadoresSelecionados.length > 0
                    ? `${habilitadoresSelecionados.length} habilitador${habilitadoresSelecionados.length > 1 ? 'es' : ''}`
                    : 'Nenhum (todos acessam)'}
                </span>
              </div>

              {habilitadoresSelecionados.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {habilitadoresSelecionados.map(m => (
                    <div key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{m.nome}</p>
                        <p className="text-xs text-slate-500 truncate">{m.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHabilitadoresSelecionados(prev => prev.filter(h => h.id !== m.id))}
                        className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                        aria-label={`Remover ${m.nome}`}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-2">Adicionar Habilitador</p>
                {loadingEquipe ? (
                  <p className="text-sm text-slate-400">Carregando...</p>
                ) : (() => {
                  const habIds = new Set(habilitadoresSelecionados.map(h => h.id))
                  const disponíveis = allHabilitadores.filter(h => !habIds.has(h.id))
                  return disponíveis.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      {allHabilitadores.length === 0
                        ? 'Nenhum habilitador cadastrado'
                        : 'Todos os habilitadores já foram adicionados'}
                    </p>
                  ) : (
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label htmlFor="select-hab-form" className="sr-only">Selecionar habilitador</label>
                        <select
                          id="select-hab-form"
                          value={selectedHabilitadorId}
                          onChange={e => setSelectedHabilitadorId(e.target.value)}
                          className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
                        >
                          <option value="">Selecionar...</option>
                          {disponíveis.map(h => (
                            <option key={h.id} value={h.id}>{h.nome} ({h.email})</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const membro = allHabilitadores.find(h => h.id === selectedHabilitadorId)
                          if (membro) {
                            setHabilitadoresSelecionados(prev => [...prev, membro])
                            setSelectedHabilitadorId('')
                          }
                        }}
                        disabled={!selectedHabilitadorId}
                        className="shrink-0 inline-flex items-center justify-center rounded-lg bg-brand-600 text-white font-medium text-sm px-4 min-h-[44px] hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                      >
                        Adicionar
                      </button>
                    </div>
                  )
                })()}
              </div>
            </div>

            <div className="border-t border-slate-200" />

            {/* Avaliadores */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">Avaliadores</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {avaliadoresSelecionados.length > 0
                    ? `${avaliadoresSelecionados.length} avaliador${avaliadoresSelecionados.length > 1 ? 'es' : ''}`
                    : 'Nenhum (todos acessam)'}
                </span>
              </div>

              {avaliadoresSelecionados.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {avaliadoresSelecionados.map(m => (
                    <div key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{m.nome}</p>
                        <p className="text-xs text-slate-500 truncate">{m.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAvaliadoresSelecionados(prev => prev.filter(a => a.id !== m.id))}
                        className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                        aria-label={`Remover ${m.nome}`}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-2">Adicionar Avaliador</p>
                {loadingEquipe ? (
                  <p className="text-sm text-slate-400">Carregando...</p>
                ) : (() => {
                  const avalIds = new Set(avaliadoresSelecionados.map(a => a.id))
                  const disponíveis = allAvaliadores.filter(a => !avalIds.has(a.id))
                  return disponíveis.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      {allAvaliadores.length === 0
                        ? 'Nenhum avaliador cadastrado'
                        : 'Todos os avaliadores já foram adicionados'}
                    </p>
                  ) : (
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label htmlFor="select-aval-form" className="sr-only">Selecionar avaliador</label>
                        <select
                          id="select-aval-form"
                          value={selectedAvaliadorId}
                          onChange={e => setSelectedAvaliadorId(e.target.value)}
                          className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
                        >
                          <option value="">Selecionar...</option>
                          {disponíveis.map(a => (
                            <option key={a.id} value={a.id}>{a.nome} ({a.email})</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const membro = allAvaliadores.find(a => a.id === selectedAvaliadorId)
                          if (membro) {
                            setAvaliadoresSelecionados(prev => [...prev, membro])
                            setSelectedAvaliadorId('')
                          }
                        }}
                        disabled={!selectedAvaliadorId}
                        className="shrink-0 inline-flex items-center justify-center rounded-lg bg-brand-600 text-white font-medium text-sm px-4 min-h-[44px] hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                      >
                        Adicionar
                      </button>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Acoes do formulario */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/editais')}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading || cronogramaWarnings.length > 0}
          title={cronogramaWarnings.length > 0 ? 'Corrija as datas fora de ordem no cronograma' : undefined}
          className="w-full sm:w-auto"
        >
          {loading
            ? isEdit ? 'Salvando...' : 'Criando...'
            : isEdit ? 'Salvar alterações' : 'Criar edital'}
        </Button>
      </div>
    </form>
  )
}
