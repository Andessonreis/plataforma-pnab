'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { questionarioSchema } from '@/lib/schemas/questionario'
import type { Recado } from '@/app/admin/memorial/_componentes/use-envio'
import { AbasBotao } from '@/app/admin/memorial/_ui/config-abas'
import { RodapeSalvar } from '@/app/admin/memorial/_ui/config-barra-salvar'
import { ConstrutorCampos } from './construtor-campos'
import { DadosGerais } from './dados-gerais'
import { PreVisualizacao } from './pre-visualizacao'
import { QUESTIONARIO_VAZIO, type ValoresQuestionario } from './valores'

interface Props {
  questionarioId?: string
  valoresIniciais?: ValoresQuestionario
  /** Respostas já recebidas, para avisar que mudar perguntas cria uma versão nova. */
  respostas?: number
}

/**
 * Editor do questionário. No computador, perguntas à esquerda e a prévia viva à
 * direita; no celular, as duas coisas em abas.
 */
export function QuestionarioForm({ questionarioId, valoresIniciais, respostas = 0 }: Props) {
  const router = useRouter()
  const [valores, setValores] = useState<ValoresQuestionario>(valoresIniciais ?? QUESTIONARIO_VAZIO)
  const [slugAutomatico, setSlugAutomatico] = useState(!questionarioId)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [recado, setRecado] = useState<Recado>(null)
  const [aba, setAba] = useState('perguntas')
  const [salvando, setSalvando] = useState(false)

  const alterar = (patch: Partial<ValoresQuestionario>) => setValores((v) => ({ ...v, ...patch }))

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const validacao = questionarioSchema.safeParse(valores)
    if (!validacao.success) {
      const novos: Record<string, string> = {}
      for (const issue of validacao.error.issues) novos[issue.path.join('.')] ??= issue.message
      setErros(novos)
      setAba('perguntas')
      setRecado({ tom: 'erro', texto: `Confira o que está em vermelho: ${Object.values(novos)[0]}` })
      return
    }

    setErros({})
    setSalvando(true)
    try {
      const res = await fetch(questionarioId ? `/api/v1/questionarios/${questionarioId}` : '/api/v1/questionarios', {
        method: questionarioId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validacao.data),
      })
      const corpo = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (corpo.fieldErrors) setErros(corpo.fieldErrors)
        setRecado({ tom: 'erro', texto: corpo.message ?? 'Não foi possível salvar. Tente de novo.' })
        return
      }
      setRecado({ tom: 'sucesso', texto: 'Salvo' })
      if (questionarioId) router.refresh()
      else router.push(`/admin/memorial/questionarios/${corpo.data.id}`)
    } catch {
      setRecado({ tom: 'erro', texto: 'Sem conexão. Confira a internet e tente de novo.' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <AbasBotao
        rotulo="O que ver"
        className="mb-4 lg:hidden"
        ativa={aba}
        onChange={setAba}
        abas={[
          { chave: 'perguntas', rotulo: 'Perguntas', contagem: valores.campos.length },
          { chave: 'previa', rotulo: 'Como fica' },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
        {/* A prévia tem o próprio <form>; por isso ela fica fora deste. */}
        <form onSubmit={salvar} noValidate className={`space-y-4 ${aba === 'previa' ? 'hidden lg:block' : ''}`}>
          <ConstrutorCampos campos={valores.campos} erros={erros} respostas={respostas} onChange={(campos) => alterar({ campos })} />
          <DadosGerais valores={valores} erros={erros} slugAutomatico={slugAutomatico} onChange={alterar} onSlugManual={() => setSlugAutomatico(false)} />
          <RodapeSalvar valores={valores} recado={recado} enviando={salvando} rotulo={questionarioId ? 'Salvar alterações' : 'Criar questionário'} />
        </form>
        <div className={`lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto ${aba === 'perguntas' ? 'hidden lg:block' : ''}`}>
          <PreVisualizacao titulo={valores.titulo} descricao={valores.descricao} campos={valores.campos} />
        </div>
      </div>
    </div>
  )
}
