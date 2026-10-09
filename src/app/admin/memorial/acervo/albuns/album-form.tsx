'use client'

import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { Button, Input } from '@/components/ui'
import { RecadoEnvio } from '../../_componentes/recado-envio'
import { useCampos, useEnvio } from '../../_componentes/use-envio'

interface AlbumEditavel {
  id: string
  nome: string
  slug: string
  descricao: string | null
  ordem: number
}

/** Criação (sem `album`) ou edição de um álbum, na própria lista. */
export function AlbumForm({ album }: { album?: AlbumEditavel }) {
  const router = useRouter()
  const { enviando, erros, recado, enviar } = useEnvio()
  const inicial = { nome: album?.nome ?? '', slug: album?.slug ?? '', descricao: album?.descricao ?? '', ordem: album?.ordem ?? 0 }
  const { valores, definir, texto } = useCampos(inicial)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const url = album ? `/api/v1/memorial/albuns/${album.id}` : '/api/v1/memorial/albuns'
    const ok = await enviar(url, album ? 'PUT' : 'POST', valores, album ? 'Álbum atualizado.' : 'Álbum criado.')
    if (!ok) return
    if (!album) {
      definir('nome', '')
      definir('descricao', '')
    }
    router.refresh()
  }

  async function excluir() {
    if (!album || !window.confirm(`Excluir o álbum "${album.nome}"? As fotos continuam no acervo, só ficam sem álbum.`)) return
    if (await enviar(`/api/v1/memorial/albuns/${album.id}`, 'DELETE')) router.refresh()
  }

  return (
    <form onSubmit={salvar} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-[2fr_3fr_6rem]">
        <Input label="Nome" required error={erros.nome} {...texto('nome')} />
        <Input label="Descrição" error={erros.descricao} {...texto('descricao')} />
        <Input
          label="Ordem"
          type="number"
          min={0}
          value={valores.ordem}
          onChange={(e) => definir('ordem', Number(e.target.value) || 0)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" className="min-h-[44px]" loading={enviando}>
          {album ? 'Salvar' : 'Criar álbum'}
        </Button>
        {album && (
          <Button type="button" size="sm" variant="ghost" className="min-h-[44px] text-red-700" disabled={enviando} onClick={excluir}>
            Excluir
          </Button>
        )}
      </div>
      <RecadoEnvio recado={recado} />
    </form>
  )
}
