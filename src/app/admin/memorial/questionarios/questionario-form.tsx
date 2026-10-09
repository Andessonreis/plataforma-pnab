'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { toast } from '@/hooks/use-toast'
import { questionarioSchema } from '@/lib/schemas/questionario'
import { DadosGerais, type ValoresQuestionario } from './dados-gerais'
import { ConstrutorCampos } from './construtor-campos'
import { PreVisualizacao } from './pre-visualizacao'

interface QuestionarioFormProps {
  questionarioId?: string
  valoresIniciais?: ValoresQuestionario
}

const VAZIO: ValoresQuestionario = {
  slug: '', titulo: '', descricao: '', finalidade: '',
  exigeLogin: false, mensagemSucesso: '', campos: [],
}

type Aba = 'editar' | 'previa'

export function QuestionarioForm({ questionarioId, valoresIniciais }: QuestionarioFormProps) {
  const router = useRouter()
  const [valores, setValores] = useState<ValoresQuestionario>(valoresIniciais ?? VAZIO)
  const [slugAutomatico, setSlugAutomatico] = useState(!questionarioId)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [aba, setAba] = useState<Aba>('editar')
  const [salvando, setSalvando] = useState(false)

  const alterar = (patch: Partial<ValoresQuestionario>) => setValores((v) => ({ ...v, ...patch }))

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const validacao = questionarioSchema.safeParse(valores)
    if (!validacao.success) {
      const novos: Record<string, string> = {}
      for (const issue of validacao.error.issues) novos[issue.path.join('.')] ??= issue.message
      setErros(novos)
      setAba('editar')
      toast({ variant: 'destructive', title: 'Confira os campos destacados', description: Object.values(novos)[0] })
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
        toast({ variant: 'destructive', title: 'Questionário não salvo', description: corpo.message })
        return
      }
      toast({ title: questionarioId ? 'Questionário salvo' : 'Questionário criado' })
      if (questionarioId) router.refresh()
      else router.push(`/admin/memorial/questionarios/${corpo.data.id}`)
    } catch {
      toast({ variant: 'destructive', title: 'Sem conexão', description: 'Confira sua internet e tente de novo.' })
    } finally {
      setSalvando(false)
    }
  }

  const abas: { id: Aba; rotulo: string }[] = [
    { id: 'editar', rotulo: 'Editar' },
    { id: 'previa', rotulo: 'Pré-visualizar' },
  ]

  return (
    <form onSubmit={salvar} noValidate className="space-y-4 pb-24 sm:space-y-6 sm:pb-0">
      <div role="group" aria-label="Modo de exibição" className="inline-flex rounded-lg bg-slate-100 p-1">
        {abas.map((a) => (
          <button
            key={a.id}
            type="button"
            aria-pressed={aba === a.id}
            onClick={() => setAba(a.id)}
            className={`min-h-[44px] rounded-md px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-brand-600 ${aba === a.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      {aba === 'editar' ? (
        <>
          <DadosGerais
            valores={valores}
            erros={erros}
            slugAutomatico={slugAutomatico}
            onChange={alterar}
            onSlugManual={() => setSlugAutomatico(false)}
          />
          <ConstrutorCampos campos={valores.campos} erros={erros} onChange={(campos) => alterar({ campos })} />
        </>
      ) : (
        <PreVisualizacao campos={valores.campos} />
      )}

      {/* No celular o botão fica preso ao rodapé: a lista de perguntas é longa e salvar não pode exigir rolar até o fim. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="submit" loading={salvando} className="w-full sm:w-auto">
          {questionarioId ? 'Salvar alterações' : 'Criar questionário'}
        </Button>
      </div>
    </form>
  )
}
