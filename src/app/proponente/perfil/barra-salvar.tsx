'use client'

import { Aviso } from '@/components/ui/aviso'
import { BotaoCarregando } from '../_componentes/botao-carregando'
import { botaoOuro, botaoTinta } from '../estilos'

/** Sem nada por salvar, o botão vira só contorno: desativado cheio parecia um botão quebrado. */
const ocioso = botaoTinta.replace('bg-tinta-900 text-papel-50', 'border-2 border-tinta-900/25 text-tinta-700')

/** Parada no papel quando não há nada por salvar; em tinta com botão dourado quando há, para não passar batido. */
const SUPERFICIE = {
  ocioso: '-mx-4 px-4 sm:mx-0 sm:px-0 border-tinta-900 bg-papel-50',
  alterado: '-mx-4 px-4 sticky bottom-[calc(60px+env(safe-area-inset-bottom))] z-10 border-accent-500 bg-tinta-950 text-papel-50 lg:bottom-0',
}

interface BarraSalvarProps {
  alterado: boolean
  carregando: boolean
  mensagem: { type: 'success' | 'error'; text: string } | null
}

/**
 * Rodapé do formulário de dados: diz se há algo por salvar. Só gruda no pé
 * da tela depois da primeira alteração, para o botão ficar à mão enquanto a
 * pessoa rola; no celular para acima da barra de abas (60px + área segura).
 */
export function BarraSalvar({ alterado, carregando, mensagem }: BarraSalvarProps) {
  const estado = alterado
    ? 'Há alterações que ainda não foram salvas.'
    : mensagem?.type === 'success'
      ? 'Tudo salvo.'
      : 'Nenhuma alteração por salvar.'

  return (
    <div
      id="tour-perfil-salvar"
      className={`border-t-2 py-3 ${alterado ? SUPERFICIE.alterado : SUPERFICIE.ocioso}`}
    >
      {mensagem?.type === 'error' && (
        <div className="mb-3">
          <Aviso tom="erro">{mensagem.text}</Aviso>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p role="status" className={`text-sm ${alterado ? 'font-bold text-accent-300' : 'text-tinta-700'}`}>
          {estado}
        </p>
        <BotaoCarregando type="submit" carregando={carregando} disabled={!alterado} estilo={`${alterado || carregando ? botaoOuro : ocioso} w-full sm:w-auto`}>
          Salvar alterações
        </BotaoCarregando>
      </div>
    </div>
  )
}
