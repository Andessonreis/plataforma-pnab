import { FolhaDeRosto as Faixa } from '@/components/ui/folha-de-rosto'

interface FolhaDeRostoProps {
  valorTotal: string
  totalProjetos: number
  concluidos: number
  emExecucao: number
}

const FOTOS = [
  '/images/cidade/panoramica-irece.jpg', // a cidade ao entardecer
  '/images/galeria/foto-04.png', // fogueira do São João
  '/images/galeria/foto-02.png', // pórtico Minha Feliz Cidade
]

/** Uma medida da prestação de contas, na linha de balanço da abertura. */
function Medida({ rotulo, valor, destaque = false }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className={destaque ? '' : 'border-l border-papel-100/20 pl-10'}>
      <dt
        className={`text-xs font-bold uppercase tracking-[0.16em] ${
          destaque ? 'text-accent-300' : 'text-papel-200/80'
        }`}
      >
        {rotulo}
      </dt>
      <dd
        className={`font-rye leading-none ${
          destaque ? 'text-4xl text-accent-300 sm:text-5xl' : 'text-2xl text-papel-50'
        }`}
      >
        {valor}
      </dd>
    </div>
  )
}

/**
 * Abertura da prestação de contas.
 *
 * Numa página de transparência o número é a manchete: quanto foi investido na
 * cultura da cidade. Ele vem em corpo de display e o resto desce como linha de
 * balanço, separado por fios.
 *
 * Antes eram quatro cartões de estatística lado a lado, cada um com ícone
 * dentro de um quadrado colorido. Os quadros diziam à pessoa que os quatro
 * números têm o mesmo peso, e não têm: o valor investido é a resposta que ela
 * veio buscar; o resto é detalhamento dele.
 */
export function FolhaDeRosto({
  valorTotal,
  totalProjetos,
  concluidos,
  emExecucao,
}: FolhaDeRostoProps) {
  return (
    <Faixa
      fotos={FOTOS}
      trilha="Projetos apoiados"
      chamada="Transparência"
      titulo="Onde o recurso chegou"
      apoio="Projetos culturais contemplados pela Política Nacional Aldir Blanc em Irecê, com o valor aprovado de cada um e a contrapartida oferecida à cidade."
    >
      {totalProjetos > 0 && (
        <dl className="mt-10 flex flex-wrap items-end gap-x-10 gap-y-6 border-t border-papel-100/20 pt-6">
          <Medida rotulo="Investido na cultura" valor={valorTotal} destaque />
          <Medida rotulo="Projetos" valor={String(totalProjetos)} />
          <Medida rotulo="Concluídos" valor={String(concluidos)} />
          <Medida rotulo="Em execução" valor={String(emExecucao)} />
        </dl>
      )}
    </Faixa>
  )
}
