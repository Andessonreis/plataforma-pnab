'use client'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Aviso, Button } from '@/components/ui'
import { construirSchemaDeRespostas, errosPorCampo, type RespostasFormulario } from '@/lib/forms'
import type { CampoFormulario } from '@/types/campo-formulario'
import { CampoComErro } from './campo-com-erro'
import { ResumoErros } from './resumo-erros'

/**
 * O que o `onSubmit` pode devolver: nada quando deu certo, ou os erros que o
 * servidor apontou. `fieldErrors` aceita as chaves no formato da API
 * (`equipe.0.nome`), que são agrupadas pelo campo de primeiro nível.
 */
export type ResultadoEnvio = void | { mensagem?: string; fieldErrors?: Record<string, string> }

interface FormularioDinamicoProps {
  campos: CampoFormulario[]
  onSubmit: (dados: RespostasFormulario) => Promise<ResultadoEnvio>
  valoresIniciais?: RespostasFormulario
  rotuloEnviar?: string
  /** Conteúdo extra entre os campos e o botão (aviso de privacidade, por exemplo). */
  rodape?: ReactNode
  className?: string
}

function agruparErrosDoServidor(fieldErrors: Record<string, string>) {
  const erros: Record<string, string> = {}
  for (const [chave, mensagem] of Object.entries(fieldErrors)) {
    const campo = chave.split('.')[0]
    if (campo && !erros[campo]) erros[campo] = mensagem
  }
  return erros
}

/**
 * Formulário montado a partir de `CampoFormulario[]`. A validação no navegador
 * usa o mesmo schema que o servidor aplica (`construirSchemaDeRespostas`), e o
 * `onSubmit` recebe os dados já normalizados por ele.
 *
 * Todos os erros aparecem de uma vez, no resumo do fim e junto de cada campo;
 * o erro de um campo some assim que ele é editado.
 */
export function FormularioDinamico({
  campos,
  onSubmit,
  valoresIniciais,
  rotuloEnviar = 'Enviar respostas',
  rodape,
  className,
}: FormularioDinamicoProps) {
  const schema = useMemo(() => construirSchemaDeRespostas(campos), [campos])
  const [valores, setValores] = useState<RespostasFormulario>(valoresIniciais ?? {})
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [tentativa, setTentativa] = useState(0)

  function alterar(nome: string, valor: unknown) {
    setValores((prev) => ({ ...prev, [nome]: valor }))
    setErros((prev) => {
      if (!prev[nome]) return prev
      const resto = { ...prev }
      delete resto[nome]
      return resto
    })
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErroGeral('')
    const resultado = schema.safeParse(valores)
    if (!resultado.success) {
      setErros(errosPorCampo(resultado.error))
      setTentativa((t) => t + 1)
      return
    }

    setEnviando(true)
    try {
      const retorno = await onSubmit(resultado.data)
      if (retorno?.fieldErrors) {
        setErros(agruparErrosDoServidor(retorno.fieldErrors))
        setTentativa((t) => t + 1)
      }
      if (retorno?.mensagem) setErroGeral(retorno.mensagem)
    } catch {
      setErroGeral('Não foi possível enviar. Confira sua conexão e tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className={className}>
      <div className="space-y-6">
        {campos.map((campo, i) => (
          <CampoComErro
            key={`${campo.nome}-${i}`}
            campo={campo}
            valor={valores[campo.nome]}
            erro={erros[campo.nome]}
            onChange={(v) => alterar(campo.nome, v)}
          />
        ))}
      </div>

      <div className="mt-8 space-y-5">
        <ResumoErros campos={campos} erros={erros} tentativa={tentativa} />
        {erroGeral && <Aviso tom="erro">{erroGeral}</Aviso>}
        {rodape}
        <Button type="submit" loading={enviando} size="lg" className="w-full">
          {rotuloEnviar}
        </Button>
      </div>
    </form>
  )
}
