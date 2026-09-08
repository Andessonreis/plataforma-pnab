'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Input } from '@/components/ui'
import { toast } from '@/hooks/use-toast'

export interface TipoDocumentoOpcao {
  /** Identificador interno (ex.: DECLARACAO_RESIDENCIA) — nunca digitado à mão. */
  tipo: string
  label: string
  /** Grupo do catálogo (ex.: "Mestres e Mestras"); ausente nos tipos do edital. */
  grupo?: string
}

interface Props {
  inscricaoId: string
  /** Só os documentos previstos neste edital. */
  tipos: TipoDocumentoOpcao[]
  /** Contexto exibido no formulário — evita anexar na inscrição errada. */
  editalTitulo: string
  inscricaoNumero: string
  /** Só SUPER_ADMIN cadastra tipo novo no catálogo. */
  podeCriarTipo: boolean
}

/**
 * Junta documento ao processo em nome do proponente.
 *
 * Inscrição enviada não aceita mais anexo do próprio agente cultural. Quando
 * uma retificação passa a exigir documento novo, ele manda por e-mail e a
 * equipe junta por aqui — com registro de quem juntou e da origem.
 *
 * O tipo sai sempre de uma lista: identificador digitado à mão vira erro de
 * ortografia e documento que não casa com o que o edital espera. Tipo que
 * ainda não existe é cadastrado no catálogo (o identificador é gerado a
 * partir do nome), o que também o disponibiliza para os próximos editais.
 */
export function JuntarDocumento({ inscricaoId, tipos, editalTitulo, inscricaoNumero, podeCriarTipo }: Props) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [criandoTipo, setCriandoTipo] = useState(false)
  const [salvandoTipo, setSalvandoTipo] = useState(false)
  const [tipoSelecionado, setTipoSelecionado] = useState(tipos[0]?.tipo ?? '')
  const [novoTipoLabel, setNovoTipoLabel] = useState('')
  const [tiposLocais, setTiposLocais] = useState(tipos)
  const [ultimaNota, setUltimaNota] = useState('')

  const rotuloDoTipo = (tipo: string) =>
    tiposLocais.find((t) => t.tipo === tipo)?.label ?? ''


  async function criarTipo() {
    const label = novoTipoLabel.trim()
    if (label.length < 3) {
      toast({ variant: 'destructive', title: 'Informe o nome do documento.' })
      return
    }

    setSalvandoTipo(true)
    try {
      const res = await fetch('/api/admin/configuracoes/tipos-anexo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, tag: editalTitulo, obrigatorio: false }),
      })
      const json = await res.json()

      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Não foi possível cadastrar o tipo',
          description: json.message ?? 'Tente novamente.',
        })
        return
      }

      const criado: TipoDocumentoOpcao = {
        tipo: json.data.tipo,
        label: json.data.label,
        grupo: json.data.tag,
      }
      setTiposLocais((atual) => [criado, ...atual])
      setTipoSelecionado(criado.tipo)
      setNovoTipoLabel('')
      setCriandoTipo(false)
      toast({ title: `Tipo "${criado.label}" cadastrado.` })
    } catch {
      toast({ variant: 'destructive', title: 'Erro de conexão ao cadastrar o tipo.' })
    } finally {
      setSalvandoTipo(false)
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const dados = new FormData(form)

    const arquivo = dados.get('file') as File | null
    if (!arquivo || arquivo.size === 0) {
      toast({ variant: 'destructive', title: 'Selecione o arquivo do documento.' })
      return
    }
    if (!tipoSelecionado) {
      toast({ variant: 'destructive', title: 'Escolha o tipo do documento.' })
      return
    }
    dados.set('tipo', tipoSelecionado)
    // Título é sempre o nome do documento escolhido — campo separado só
    // duplicava a informação e dava margem a divergência entre os dois.
    dados.set('titulo', rotuloDoTipo(tipoSelecionado))

    setEnviando(true)
    try {
      const res = await fetch(`/api/admin/inscricoes/${inscricaoId}/anexos`, {
        method: 'POST',
        body: dados,
      })
      const json = await res.json()

      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Não foi possível juntar o documento',
          description: json.message ?? 'Tente novamente.',
        })
        return
      }

      toast({ title: 'Documento juntado ao processo.' })

      // Formulário segue aberto: normalmente é mais de um documento na mesma
      // leva (identidade + comprovante), com a mesma justificativa de origem.
      setUltimaNota((dados.get('origemNota') as string) ?? '')
      form.reset()
      router.refresh()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Verifique sua internet e tente novamente.',
      })
    } finally {
      setEnviando(false)
    }
  }

  if (!aberto) {
    return (
      <Button variant="ghost" onClick={() => setAberto(true)} className="w-full">
        Juntar documento recebido por fora
      </Button>
    )
  }

  return (
    <Card padding="sm" className="border-brand-200 bg-brand-50/40">
      <h3 className="text-sm font-semibold text-slate-900">
        Juntar documento ao processo
      </h3>
      <p className="text-xs font-medium text-brand-800 mb-2">
        {inscricaoNumero} · {editalTitulo}
      </p>
      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
        Para documento que o agente cultural mandou por fora do sistema (e-mail,
        presencialmente), já que a inscrição enviada não aceita mais anexo. Fica
        registrado que foi a equipe quem juntou. Dá pra juntar vários seguidos.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="tipo" className="block text-xs font-medium text-slate-700 mb-1">
            Documento previsto neste edital
          </label>
          <select
            id="tipo"
            value={tipoSelecionado}
            onChange={(e) => setTipoSelecionado(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[40px]"
          >
            {tiposLocais.map((t) => (
              <option key={t.tipo} value={t.tipo}>{t.label}</option>
            ))}
          </select>

          {podeCriarTipo && !criandoTipo && (
            <button
              type="button"
              onClick={() => setCriandoTipo(true)}
              className="mt-1.5 text-xs font-medium text-brand-700 hover:text-brand-800 underline underline-offset-2"
            >
              O documento não está na lista? Cadastrar novo tipo
            </button>
          )}
        </div>

        {criandoTipo && (
          <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
            <p className="text-xs text-slate-600">
              Cadastra no grupo <strong>{editalTitulo}</strong>. O identificador interno é
              gerado a partir do nome — não precisa digitar código.
            </p>
            <Input
              label="Nome do documento"
              placeholder="Ex.: Declaração de Residência"
              value={novoTipoLabel}
              onChange={(e) => setNovoTipoLabel(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={criarTipo} loading={salvandoTipo}>
                Cadastrar tipo
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setCriandoTipo(false)} disabled={salvandoTipo}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="origemNota" className="block text-xs font-medium text-slate-700 mb-1">
            Origem do documento
          </label>
          <textarea
            id="origemNota"
            name="origemNota"
            rows={2}
            required
            minLength={10}
            defaultValue={ultimaNota}
            placeholder="Ex.: recebido por e-mail em 08/09/2026, conforme Retificação nº 02 publicada no DO 2924"
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Fica visível junto do documento e no log de auditoria.
          </p>
        </div>

        <div>
          <label htmlFor="file" className="block text-xs font-medium text-slate-700 mb-1">
            Arquivo (PDF, PNG ou JPG)
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            required
            className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="submit" loading={enviando}>Juntar ao processo</Button>
          <Button type="button" variant="ghost" onClick={() => setAberto(false)} disabled={enviando}>
            Fechar
          </Button>
        </div>
      </form>
    </Card>
  )
}
