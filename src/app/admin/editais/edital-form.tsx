'use client'

import { useState, useRef, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button, Card, Select } from '@/components/ui'
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

const CATEGORIAS_OPCOES = [
  'Artes Visuais', 'Música', 'Teatro', 'Dança',
  'Literatura', 'Circo', 'Audiovisual', 'Artesanato',
  'Cultura Popular', 'Patrimônio Cultural', 'Cultura Digital',
  'Gastronomia', 'Moda', 'Hip Hop', 'Culturas Indígenas',
  'Culturas Afro-Brasileiras',
]

const TEMPLATE_REGRAS = `QUEM PODE PARTICIPAR
• Pessoas físicas, coletivos, MEIs e pessoas jurídicas sem fins lucrativos.
• Domiciliados no município de Irecê/BA.
• CPF ou CNPJ regularizados.

DOCUMENTOS OBRIGATÓRIOS
• Documento de identificação oficial com foto.
• CPF ou CNPJ (cartão ou comprovante).
• Comprovante de residência no município (emitido nos últimos 90 dias).
• Portfólio ou currículo cultural (quando aplicável).

VEDAÇÕES
• Não podem participar servidores públicos municipais de Irecê.
• É vedada a submissão de mais de uma proposta por proponente.
• Projetos em execução com outro financiamento público não serão aceitos.

CRITÉRIOS ELIMINATÓRIOS
• Documentação incompleta ou inidônea.
• Proposta em desacordo com o objeto deste edital.`

const TEMPLATE_ACOES = `COTAS
• 30% das vagas reservadas para proponentes negros(as) e pardos(as).
• 10% das vagas reservadas para pessoas com deficiência (PcD).
• 10% das vagas reservadas para mulheres em situação de vulnerabilidade.

BÔNUS DE PONTUAÇÃO
• +5 pontos: propostas de comunidades quilombolas.
• +5 pontos: propostas de comunidades indígenas.
• +3 pontos: proponentes residentes em zonas rurais de Irecê.
• +2 pontos: proponentes LGBTQIAPN+.

CRITÉRIO DE DESEMPATE
Em caso de pontuação igual, a proposta de proponente pertencente a grupo prioritário será classificada em posição superior, respeitando a ordem: PcD → negros(as)/pardos(as) → mulheres → LGBTQIAPN+.`

const statusOptions = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'PUBLICADO', label: 'Publicado' },
  { value: 'INSCRICOES_ABERTAS', label: 'Inscricoes Abertas' },
  { value: 'INSCRICOES_ENCERRADAS', label: 'Inscricoes Encerradas' },
  { value: 'HABILITACAO', label: 'Habilitacao' },
  { value: 'AVALIACAO', label: 'Avaliacao' },
  { value: 'RESULTADO_PRELIMINAR', label: 'Resultado Preliminar' },
  { value: 'RECURSO', label: 'Recurso' },
  { value: 'RESULTADO_FINAL', label: 'Resultado Final' },
  { value: 'ENCERRADO', label: 'Encerrado' },
]

export function EditalForm({ initialData }: EditalFormProps) {
  const router = useRouter()
  const isEdit = !!initialData
  const arquivosRef = useRef<EditalArquivosHandle>(null)

  const [titulo, setTitulo] = useState(initialData?.titulo ?? '')
  const [resumo, setResumo] = useState(initialData?.resumo ?? '')
  const [ano, setAno] = useState(initialData?.ano ?? new Date().getFullYear())
  const [valorTotal, setValorTotal] = useState(initialData?.valorTotal ?? '')
  const [categorias, setCategorias] = useState<string[]>(initialData?.categorias ?? [])
  const [acoesAfirmativas, setAcoesAfirmativas] = useState(initialData?.acoesAfirmativas ?? '')
  const [regrasElegibilidade, setRegrasElegibilidade] = useState(initialData?.regrasElegibilidade ?? '')
  const [status, setStatus] = useState<string>(initialData?.status ?? 'RASCUNHO')
  const [cronograma, setCronograma] = useState<CronogramaItem[]>(initialData?.cronograma ?? [])

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function addCronogramaItem() {
    setCronograma([...cronograma, { label: '', dataHora: '', destaque: false }])
  }

  function updateCronogramaItem(index: number, field: keyof CronogramaItem, value: string | boolean) {
    const updated = [...cronograma]
    updated[index] = { ...updated[index], [field]: value }
    setCronograma(updated)
  }

  function removeCronogramaItem(index: number) {
    setCronograma(cronograma.filter((_, i) => i !== index))
  }

  function toggleCategoria(cat: string) {
    setCategorias((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setErrors({})

    const body = {
      titulo,
      resumo,
      ano,
      valorTotal: valorTotal ? parseFloat(valorTotal) : null,
      categorias,
      acoesAfirmativas: acoesAfirmativas || null,
      regrasElegibilidade: regrasElegibilidade || null,
      status,
      cronograma,
    }

    try {
      const url = isEdit
        ? `/api/admin/editais?id=${initialData.id}`
        : '/api/admin/editais'

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors)
        } else {
          setMessage({ type: 'error', text: data.message || 'Erro ao salvar edital.' })
        }
        return
      }

      // Envia arquivos pendentes após criar o edital
      if (!isEdit && arquivosRef.current?.hasPending()) {
        const uploadErrors = await arquivosRef.current.uploadPending(data.id)
        if (uploadErrors > 0) {
          setMessage({ type: 'error', text: `Edital criado, mas ${uploadErrors} arquivo(s) falharam no envio.` })
        }
      }

      if (!isEdit) {
        router.push('/admin/editais')
      } else {
        setMessage({ type: 'success', text: 'Edital atualizado com sucesso.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexao. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-brand-50 text-brand-800 border border-brand-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Informacoes basicas */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Informacoes Basicas</h2>
        <div className="space-y-4">
          <Input
            label="Titulo do Edital"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            error={errors.titulo}
            required
            placeholder="Ex: Edital de Fomento a Cultura 2026"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Ano"
              type="number"
              value={String(ano)}
              onChange={(e) => setAno(Number(e.target.value))}
              error={errors.ano}
              required
              min={2020}
              max={2099}
            />
            <Input
              label="Valor Total (R$)"
              type="number"
              step="0.01"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
              error={errors.valorTotal}
              placeholder="150000.00"
            />
          </div>

          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={statusOptions}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Resumo</label>
            {errors.resumo && <p className="text-xs text-red-600 mb-1">{errors.resumo}</p>}
            <textarea
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              placeholder="Breve descricao do edital..."
              rows={3}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <p className="block text-sm font-medium text-slate-700 mb-2">Categorias</p>
            {errors.categorias && (
              <p className="text-xs text-red-600 mb-2">{errors.categorias}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS_OPCOES.map((cat) => {
                const selected = categorias.includes(cat)
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategoria(cat)}
                    className={[
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors',
                      selected
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-brand-400 hover:text-brand-700',
                    ].join(' ')}
                    aria-pressed={selected}
                  >
                    {selected && (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {cat}
                  </button>
                )
              })}
            </div>
            {categorias.length > 0 && (
              <p className="text-xs text-slate-500 mt-2">{categorias.length} categoria(s) selecionada(s)</p>
            )}
          </div>
        </div>
      </Card>

      {/* Regras */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Regras e Elegibilidade</h2>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Regras de Elegibilidade</label>
              <button
                type="button"
                onClick={() => setRegrasElegibilidade((v) => v ? v : TEMPLATE_REGRAS)}
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Usar template
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">Use marcadores (•) e seções em MAIÚSCULAS para estruturar o texto. Aparece formatado na página pública.</p>
            <textarea
              value={regrasElegibilidade}
              onChange={(e) => setRegrasElegibilidade(e.target.value)}
              placeholder="Clique em 'Usar template' para começar com uma estrutura pronta..."
              rows={10}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Ações Afirmativas</label>
              <button
                type="button"
                onClick={() => setAcoesAfirmativas((v) => v ? v : TEMPLATE_ACOES)}
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Usar template
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">Descreva cotas, bônus de pontuação e critérios de desempate. Será exibido com destaque visual na página pública.</p>
            <textarea
              value={acoesAfirmativas}
              onChange={(e) => setAcoesAfirmativas(e.target.value)}
              placeholder="Clique em 'Usar template' para começar com uma estrutura pronta..."
              rows={10}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
            />
          </div>
        </div>
      </Card>

      {/* Cronograma */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Cronograma</h2>
          <Button type="button" variant="outline" size="sm" onClick={addCronogramaItem}>
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Marco
          </Button>
        </div>

        {cronograma.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Nenhum marco adicionado. Clique em &quot;Adicionar Marco&quot; para comecar.
          </p>
        ) : (
          <div className="space-y-3">
            {cronograma.map((item, index) => (
              <div
                key={index}
                className={[
                  'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                  item.destaque
                    ? 'bg-brand-50 border-brand-200'
                    : 'bg-slate-50 border-transparent',
                ].join(' ')}
              >
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Descricao"
                    value={item.label}
                    onChange={(e) => updateCronogramaItem(index, 'label', e.target.value)}
                    placeholder="Ex: Inicio das inscricoes"
                  />
                  <Input
                    label="Data e Hora"
                    type="datetime-local"
                    value={item.dataHora}
                    onChange={(e) => updateCronogramaItem(index, 'dataHora', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 pt-7">
                  <label
                    className={[
                      'flex items-center gap-1.5 text-xs cursor-pointer font-medium select-none',
                      item.destaque ? 'text-brand-700' : 'text-slate-600',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={item.destaque}
                      onChange={(e) => updateCronogramaItem(index, 'destaque', e.target.checked)}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {item.destaque ? '★ Destaque' : 'Destaque'}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeCronogramaItem(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded min-h-[36px] min-w-[36px] inline-flex items-center justify-center"
                    aria-label="Remover marco"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Documentos e Anexos */}
      <EditalArquivos ref={arquivosRef} editalId={isEdit ? initialData.id : undefined} />

      {/* Botoes */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/editais')}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Salvar Alteracoes' : 'Criar Edital'}
        </Button>
      </div>
    </form>
  )
}
