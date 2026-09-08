'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Input } from '@/components/ui'
import { toast } from '@/hooks/use-toast'

interface TipoDisponivel {
  tipo: string
  label: string
}

interface Props {
  inscricaoId: string
  /** Tipos previstos no edital — a equipe pode usar um deles ou digitar outro. */
  tiposDisponiveis: TipoDisponivel[]
}

const TIPO_OUTRO = '__outro__'

/**
 * Junta documento ao processo em nome do proponente.
 *
 * Inscrição enviada não aceita mais anexo do próprio agente cultural. Quando
 * uma retificação passa a exigir documento novo, ele manda por e-mail e a
 * equipe junta por aqui — com registro de quem juntou e da origem.
 */
export function JuntarDocumento({ inscricaoId, tiposDisponiveis }: Props) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [tipoSelecionado, setTipoSelecionado] = useState(
    tiposDisponiveis[0]?.tipo ?? TIPO_OUTRO,
  )

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const dados = new FormData(form)

    const arquivo = dados.get('file') as File | null
    if (!arquivo || arquivo.size === 0) {
      toast({ variant: 'destructive', title: 'Selecione o arquivo do documento.' })
      return
    }

    // Tipo digitado à mão quando o documento não estava previsto no edital.
    if (dados.get('tipo') === TIPO_OUTRO) {
      const tipoLivre = (dados.get('tipoLivre') as string)?.trim()
      if (!tipoLivre) {
        toast({ variant: 'destructive', title: 'Informe o tipo do documento.' })
        return
      }
      dados.set('tipo', tipoLivre.toUpperCase().replace(/\s+/g, '_'))
    }
    dados.delete('tipoLivre')

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
      form.reset()
      setAberto(false)
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
      <h3 className="text-sm font-semibold text-slate-900 mb-1">
        Juntar documento ao processo
      </h3>
      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
        Use quando o agente cultural enviar documento por fora do sistema (e-mail,
        presencialmente) porque a inscrição já não aceita mais anexo. Fica registrado
        que foi a equipe quem juntou, com a justificativa informada.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="tipo" className="block text-xs font-medium text-slate-700 mb-1">
            Tipo do documento
          </label>
          <select
            id="tipo"
            name="tipo"
            value={tipoSelecionado}
            onChange={(e) => setTipoSelecionado(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[40px]"
          >
            {tiposDisponiveis.map((t) => (
              <option key={t.tipo} value={t.tipo}>{t.label}</option>
            ))}
            <option value={TIPO_OUTRO}>Outro (não previsto no edital)</option>
          </select>
        </div>

        {tipoSelecionado === TIPO_OUTRO && (
          <Input
            name="tipoLivre"
            label="Identificador do tipo"
            placeholder="Ex.: DECLARACAO_RESIDENCIA"
          />
        )}

        <Input
          name="titulo"
          label="Título exibido"
          placeholder="Ex.: Declaração de Residência — Anexo da Retificação nº 02"
          required
        />

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
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}
