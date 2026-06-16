'use client'

import { useState, useRef, useCallback, useMemo, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card } from '@client/components/ui'
import type { EditalStatus } from '@prisma/client'
import { EditalArquivos, type EditalArquivosHandle } from './edital-arquivos'
import type { CronogramaItem, CronogramaFormItem } from '@shared/types/cronograma'
import { cronogramaToFormItems, formItemsToCronograma, validateCronogramaOrder } from '@shared/utils/cronograma'
import type { CriterioAvaliacao } from '@shared/avaliacao-criterios'
import type { CampoFormulario } from '@shared/types/campo-formulario'
import type { EtapaCustomizada } from '@shared/types/etapa-customizada'
import { CronogramaEditor } from './cronograma-editor'
import { EtapasCustomizadasEditor } from './etapas-customizadas-editor'
import type { TipoAnexo } from '@/lib/constants/attachment-types'
import { currentYear, type MembroEquipe, type EditalFormProps } from './edital-form/constants'
import { valorTotalInicial } from './edital-form/moeda'
import { SectionHeader } from './edital-form/SectionHeader'
import { useEditalCatalogos } from './edital-form/useEditalCatalogos'
import { SecaoInformacoesBasicas } from './edital-form/sections/SecaoInformacoesBasicas'
import { SecaoCategorias } from './edital-form/sections/SecaoCategorias'
import { SecaoRegrasAcoes } from './edital-form/sections/SecaoRegrasAcoes'
import { SecaoCamposFormulario } from './edital-form/sections/SecaoCamposFormulario'
import { SecaoCriterios } from './edital-form/sections/SecaoCriterios'
import { SecaoTiposAnexo } from './edital-form/sections/SecaoTiposAnexo'
import { SecaoEquipe } from './edital-form/sections/SecaoEquipe'
import { editaisClient } from '@client/api/editais.client'

export function EditalForm({ initialData }: EditalFormProps) {
  const router = useRouter()
  const isEdit = !!initialData
  const arquivosRef = useRef<EditalArquivosHandle>(null)

  const [titulo, setTitulo] = useState(initialData?.titulo ?? '')
  const [resumo, setResumo] = useState(initialData?.resumo ?? '')
  const [ano, setAno] = useState(String(initialData?.ano ?? currentYear))
  const [valorTotal, setValorTotal] = useState(() => valorTotalInicial(initialData?.valorTotal))
  const [categorias, setCategorias] = useState<string[]>(initialData?.categorias ?? [])
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
  const [etapasCustomizadas, setEtapasCustomizadas] = useState<EtapaCustomizada[]>(
    initialData?.etapasCustomizadas ?? []
  )
  const [criteriosAvaliacao, setCriteriosAvaliacao] = useState<CriterioAvaliacao[]>(
    initialData?.criteriosAvaliacao ?? []
  )
  const [formulaAvaliacao, setFormulaAvaliacao] = useState(
    initialData?.formulaAvaliacao ?? ''
  )
  const [tiposAnexo, setTiposAnexo] = useState<TipoAnexo[]>(
    initialData?.tiposAnexo ?? []
  )
  const [notaMinima, setNotaMinima] = useState(
    initialData?.notaMinima != null ? String(initialData.notaMinima) : ''
  )
  const [tiposProponentePermitidos, setTiposProponentePermitidos] = useState<string[]>(
    initialData?.tiposProponentePermitidos ?? []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<number, boolean>>({})

  // Equipe do edital
  const [avaliadoresSelecionados, setAvaliadoresSelecionados] = useState<MembroEquipe[]>(
    initialData?.initialAvaliadores ?? []
  )
  const [habilitadoresSelecionados, setHabilitadoresSelecionados] = useState<MembroEquipe[]>(
    initialData?.initialHabilitadores ?? []
  )
  // Refs para garantir acesso ao valor mais recente no submit (evita closure stale)
  const avaliadoresRef = useRef(avaliadoresSelecionados)
  avaliadoresRef.current = avaliadoresSelecionados
  const habilitadoresRef = useRef(habilitadoresSelecionados)
  habilitadoresRef.current = habilitadoresSelecionados

  const [selectedAvaliadorId, setSelectedAvaliadorId] = useState('')
  const [selectedHabilitadorId, setSelectedHabilitadorId] = useState('')

  const {
    allAvaliadores,
    allHabilitadores,
    loadingEquipe,
    tiposAnexoDisponiveis,
    templatesDisponiveis,
    categoriasDisponiveis,
    loadingCategorias,
  } = useEditalCatalogos()

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

  function toggleCategoria(cat: string) {
    setCategorias(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
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

    // Normalizar etapas customizadas — remover etapas sem título e campos sem rótulo/nome
    const etapasNormalizadas = etapasCustomizadas
      .filter((e) => e.titulo.trim() !== '')
      .map((e, i) => ({
        ...e,
        ordem: i,
        id: e.id.trim() || `etapa_${i + 1}`,
        campos: e.campos
          .filter((c) => c.label.trim() !== '')
          .map((c) => ({
            ...c,
            nome: c.nome.trim() || c.label.trim().toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
          })),
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
      etapasCustomizadas: etapasNormalizadas,
      vagasContemplados: vagasContemplados.trim() ? Number(vagasContemplados) : null,
      vagasSuplentes: vagasSuplentes.trim() ? Number(vagasSuplentes) : null,
      criteriosAvaliacao: criteriosAvaliacao.length > 0 ? criteriosAvaliacao : null,
      formulaAvaliacao: formulaAvaliacao.trim() || null,
      tiposAnexo: tiposAnexo.length > 0 ? tiposAnexo : null,
      notaMinima: notaMinima.trim() ? Number(notaMinima) : null,
      tiposProponentePermitidos,
      equipeAvaliadores: avaliadoresRef.current.map(a => a.id),
      equipeHabilitadores: habilitadoresRef.current.map(h => h.id),
    }

    try {
      const edital = isEdit
        ? await editaisClient.update(initialData!.id, body)
        : await editaisClient.create(body)

      const editalId: string = edital.id ?? initialData?.id ?? ''

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

      <SecaoInformacoesBasicas
        collapsed={!!collapsedSections[1]}
        onToggle={() => toggleSection(1)}
        titulo={titulo} setTitulo={setTitulo}
        resumo={resumo} setResumo={setResumo}
        ano={ano} setAno={setAno}
        valorTotal={valorTotal} setValorTotal={setValorTotal}
        status={status} setStatus={setStatus}
        vagasContemplados={vagasContemplados} setVagasContemplados={setVagasContemplados}
        vagasSuplentes={vagasSuplentes} setVagasSuplentes={setVagasSuplentes}
        tiposProponentePermitidos={tiposProponentePermitidos} setTiposProponentePermitidos={setTiposProponentePermitidos}
        editalId={initialData?.id}
      />

      <SecaoCategorias
        collapsed={!!collapsedSections[2]}
        onToggle={() => toggleSection(2)}
        loadingCategorias={loadingCategorias}
        categoriasDisponiveis={categoriasDisponiveis}
        categorias={categorias}
        setCategorias={setCategorias}
        toggleCategoria={toggleCategoria}
      />

      <SecaoRegrasAcoes
        collapsed={!!collapsedSections[3]}
        onToggle={() => toggleSection(3)}
        regrasElegibilidade={regrasElegibilidade}
        setRegrasElegibilidade={setRegrasElegibilidade}
        acoesAfirmativas={acoesAfirmativas}
        setAcoesAfirmativas={setAcoesAfirmativas}
      />

      <SecaoCamposFormulario
        collapsed={!!collapsedSections[4]}
        onToggle={() => toggleSection(4)}
        camposFormulario={camposFormulario}
        addCampoFormulario={addCampoFormulario}
        removeCampoFormulario={removeCampoFormulario}
        updateCampoFormulario={updateCampoFormulario}
      />

      <SecaoCriterios
        collapsed={!!collapsedSections[5]}
        onToggle={() => toggleSection(5)}
        templatesDisponiveis={templatesDisponiveis}
        criteriosAvaliacao={criteriosAvaliacao}
        setCriteriosAvaliacao={setCriteriosAvaliacao}
        formulaAvaliacao={formulaAvaliacao}
        setFormulaAvaliacao={setFormulaAvaliacao}
        notaMinima={notaMinima}
        setNotaMinima={setNotaMinima}
        addCriterio={addCriterio}
        duplicarUltimoCriterio={duplicarUltimoCriterio}
        removeCriterio={removeCriterio}
        updateCriterio={updateCriterio}
      />

      <SecaoTiposAnexo
        collapsed={!!collapsedSections[6]}
        onToggle={() => toggleSection(6)}
        tiposAnexoDisponiveis={tiposAnexoDisponiveis}
        tiposAnexo={tiposAnexo}
        setTiposAnexo={setTiposAnexo}
        addTipoIndividual={addTipoIndividual}
      />

      {/* Secao 7 - Documentos e Arquivos */}
      <Card padding="sm" className="sm:p-6">
        <SectionHeader number={7} title="Documentos e Arquivos" collapsed={!!collapsedSections[7]} onToggle={() => toggleSection(7)} />
        {!collapsedSections[7] && <div className="mt-4 sm:mt-5">
          <EditalArquivos
            ref={arquivosRef}
            editalId={initialData?.id}
          />
        </div>}
      </Card>

      {/* Secao 8 - Cronograma */}
      <Card padding="sm" className="sm:p-6">
        <SectionHeader number={8} title="Cronograma" collapsed={!!collapsedSections[8]} onToggle={() => toggleSection(8)} />

        {!collapsedSections[8] && <div className="mt-4 sm:mt-5">
          <CronogramaEditor
            items={cronogramaItems}
            onChange={setCronogramaItems}
            warnings={cronogramaWarnings}
          />
        </div>}
      </Card>

      <SecaoEquipe
        collapsed={!!collapsedSections[9]}
        onToggle={() => toggleSection(9)}
        loadingEquipe={loadingEquipe}
        allHabilitadores={allHabilitadores}
        habilitadoresSelecionados={habilitadoresSelecionados}
        setHabilitadoresSelecionados={setHabilitadoresSelecionados}
        selectedHabilitadorId={selectedHabilitadorId}
        setSelectedHabilitadorId={setSelectedHabilitadorId}
        allAvaliadores={allAvaliadores}
        avaliadoresSelecionados={avaliadoresSelecionados}
        setAvaliadoresSelecionados={setAvaliadoresSelecionados}
        selectedAvaliadorId={selectedAvaliadorId}
        setSelectedAvaliadorId={setSelectedAvaliadorId}
      />

      {/* Secao 10 — Etapas customizadas da inscrição */}
      <Card padding="sm" className="sm:p-6">
        <SectionHeader
          number={10}
          title="Etapas Customizadas da Inscrição"
          collapsed={!!collapsedSections[10]}
          onToggle={() => toggleSection(10)}
          actions={
            <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {etapasCustomizadas.length === 0
                ? 'Nenhuma etapa adicional'
                : `${etapasCustomizadas.length} etapa${etapasCustomizadas.length > 1 ? 's' : ''}`}
            </span>
          }
        >
          <p className="text-sm text-slate-500 mt-2">
            Adicione etapas extras ao formulário do proponente (ex.: Plano de Trabalho, Equipe, Cronograma Físico-Financeiro).
            Aparecem entre &ldquo;Dados&rdquo; e &ldquo;Anexos&rdquo; no wizard de inscrição.
          </p>
        </SectionHeader>

        {!collapsedSections[10] && (
          <div className="mt-4">
            <EtapasCustomizadasEditor
              value={etapasCustomizadas}
              onChange={setEtapasCustomizadas}
            />
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
