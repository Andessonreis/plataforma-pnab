import Image from 'next/image'
import { Carimbo } from '@/components/ui/carimbo'
import type { ProjetoRegistrado } from './consulta'

interface RegistroProjetoProps {
  projeto: ProjetoRegistrado
}

/**
 * Um projeto como lançamento de livro-caixa.
 *
 * A página tinha duas árvores para os mesmos dados: uma tabela para desktop e
 * cartões para celular, com cada campo escrito duas vezes. Qualquer correção
 * precisava ser feita nos dois lugares, e uma delas ia ficar para trás. Aqui é
 * uma estrutura só, que empilha no telefone.
 *
 * O valor fica num trilho à esquerda, em corpo grande e alinhado entre todos
 * os lançamentos: numa página de transparência, a coluna do dinheiro é o que
 * se percorre de cima a baixo. Na tabela anterior o valor era a quarta coluna,
 * e no cartão do celular ficava no rodapé.
 */
export function RegistroProjeto({ projeto }: RegistroProjetoProps) {
  return (
    <li className="grid gap-x-6 gap-y-3 px-4 py-6 sm:grid-cols-[10rem_1fr] sm:px-5">
      <p className="titulo text-xl leading-none text-brand-700 sm:text-right">{projeto.valor}</p>

      <div className="min-w-0 sm:border-l sm:border-tinta-900/10 sm:pl-6">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <h4 className="min-w-0 titulo text-lg leading-snug tracking-wide text-tinta-900">
            {projeto.nome}
          </h4>
          <Carimbo tom={projeto.situacao.tom}>{projeto.situacao.label}</Carimbo>
        </div>

        <p className="mt-1.5 text-sm text-tinta-600">
          {projeto.proponente}
          {projeto.categoria && (
            <>
              <span className="px-2 text-tinta-400" aria-hidden="true">
                ·
              </span>
              {projeto.categoria}
            </>
          )}
        </p>

        <p className="mt-0.5 text-xs tabular-nums text-tinta-500">
          Inscrição {projeto.numeroInscricao}
        </p>

        {projeto.contrapartida && (
          <p className="mt-3 border-l-2 border-accent-500 pl-3 text-sm leading-relaxed text-tinta-700">
            <span className="font-semibold text-tinta-800">Contrapartida: </span>
            {projeto.contrapartida}
          </p>
        )}

        {projeto.imagens.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {projeto.imagens.slice(0, 4).map((url) => (
              <li key={url} className="relative h-20 w-28 overflow-hidden rounded-sm">
                <Image
                  src={url}
                  alt={`Registro da execução do projeto ${projeto.nome}`}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}
