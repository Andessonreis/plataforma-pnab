import { Cartela, type CorCartela } from '@/components/ui/cartela'
import { CartaoDocumento } from './cartao-documento'
import { CartaoImagem } from './cartao-imagem'
import type { CategoriaDeManuais } from './consulta'

/** Rodízio da paleta institucional: seções vizinhas nunca repetem a cor. */
const CORES: CorCartela[] = ['terracota', 'turquesa', 'oliva', 'ameixa']

interface SecaoCategoriaProps {
  categoria: CategoriaDeManuais
  posicao: number
}

/** Documentos em lista de uma coluna no celular; imagens em grade, com pré-visualização. */
export function SecaoCategoria({ categoria, posicao }: SecaoCategoriaProps) {
  const documentos = categoria.manuais.filter((m) => m.tipo !== 'imagem')
  const imagens = categoria.manuais.filter((m) => m.tipo === 'imagem')
  const total = categoria.manuais.length

  return (
    <section aria-labelledby={categoria.id}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <Cartela id={categoria.id} cor={CORES[posicao % CORES.length]}>
          {categoria.nome}
        </Cartela>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-tinta-600">
          {total} {total === 1 ? 'arquivo' : 'arquivos'}
        </p>
      </div>

      {documentos.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {documentos.map((m) => (
            <CartaoDocumento key={m.id} manual={m} />
          ))}
        </div>
      )}

      {imagens.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {imagens.map((m) => (
            <CartaoImagem key={m.id} manual={m} />
          ))}
        </div>
      )}
    </section>
  )
}
