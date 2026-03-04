'use client'

import { useState, useRef, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button, Card, Textarea, Select } from '@/components/ui'
import type { EditalStatus } from '@prisma/client'
import { EditalArquivos, type EditalArquivosHandle } from './edital-arquivos'

interface CronogramaItem {
  label: string
  dataHora: string
  destaque: boolean
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
    status: EditalStatus
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
  const [regrasElegibilidade, setRegrasElegibilidade] = useState(initialData?.regrasElegibilidade ?? '')
  const [acoesAfirmativas, setAcoesAfirmativas] = useState(initialData?.acoesAfirmativas ?? '')
  const [status, setStatus] = useState<EditalStatus>(initialData?.status ?? 'RASCUNHO')
  const [cronograma, setCronograma] = useState<CronogramaItem[]>(
    initialData?.cronograma ?? [{ label: '', dataHora: '', destaque: false }]
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleCategoria(cat: string) {
    setCategorias(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  function addCronogramaItem() {
    setCronograma(prev => [...prev, { label: '', dataHora: '', destaque: false }])
  }

  function removeCronogramaItem(index: number) {
    setCronograma(prev => prev.filter((_, i) => i !== index))
  }

  function updateCronogramaItem(index: number, field: keyof CronogramaItem, value: string | boolean) {
    setCronograma(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const cronogramaFiltrado = cronograma.filter(item => item.label.trim() !== '')

    // Converte valorTotal para número (aceita vírgula como separador decimal)
    const valorTotalNum = valorTotal.trim()
      ? parseFloat(valorTotal.replace(/\./g, '').replace(',', '.'))
      : null

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
        <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-4 sm:mb-5">
          1. Informações Básicas
        </h2>
        <div className="grid gap-4 sm:gap-5">
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
        </div>
      </Card>

      {/* Secao 2 - Categorias */}
      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">
          2. Categorias Culturais
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Selecione todas as categorias contempladas por este edital.
        </p>
        <div className="flex flex-wrap gap-2">
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
        {categorias.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            {categorias.length} categoria(s) selecionada(s)
          </p>
        )}
      </Card>

      {/* Secao 3 - Regras e Acoes */}
      <Card padding="sm" className="sm:p-6 space-y-5 sm:space-y-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800">
          3. Regras e Ações Afirmativas
        </h2>

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
              Usar template
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
              Usar template
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
      </Card>

      {/* Secao 4 - Arquivos */}
      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-4 sm:mb-5">
          4. Documentos e Arquivos
        </h2>
        <EditalArquivos
          ref={arquivosRef}
          editalId={initialData?.id}
        />
      </Card>

      {/* Secao 5 - Cronograma */}
      <Card padding="sm" className="sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800">
            5. Cronograma
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCronogramaItem}
          >
            + Adicionar etapa
          </Button>
        </div>

        {cronograma.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Nenhuma etapa adicionada ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {cronograma.map((item, idx) => (
              <div
                key={idx}
                className={[
                  'rounded-lg border p-3 transition-colors',
                  item.destaque
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-slate-200 bg-white',
                ].join(' ')}
              >
                <Input
                  label="Etapa"
                  value={item.label}
                  onChange={e => updateCronogramaItem(idx, 'label', e.target.value)}
                  placeholder="Ex.: Inscrições abertas"
                />

                <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1">
                    <Input
                      label="Data / Hora"
                      type="datetime-local"
                      value={item.dataHora}
                      onChange={e => updateCronogramaItem(idx, 'dataHora', e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-3 pb-0.5">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.destaque}
                      onClick={() => updateCronogramaItem(idx, 'destaque', !item.destaque)}
                      className={[
                        'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                        item.destaque
                          ? 'border-blue-300 bg-blue-100 text-blue-700'
                          : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'inline-flex h-4 w-7 rounded-full border transition-colors',
                          item.destaque ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-slate-200',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'my-auto block h-3 w-3 rounded-full bg-white shadow transition-transform',
                            item.destaque ? 'translate-x-3.5' : 'translate-x-0.5',
                          ].join(' ')}
                        />
                      </span>
                      Destaque
                    </button>

                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeCronogramaItem(idx)}
                      aria-label={`Remover etapa ${idx + 1}`}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
          disabled={loading}
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
