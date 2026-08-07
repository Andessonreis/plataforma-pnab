'use client'

import { useMemo, useState } from 'react'
import { CADERNO_GERAL, type CadernoDeDuvidas } from './consulta'
import { CadernoSecao } from './caderno-secao'
import { DuvidasBusca } from './duvidas-busca'
import { DuvidasFiltros, TODOS_CADERNOS } from './duvidas-filtros'
import { DuvidasGeral } from './duvidas-geral'

interface CadernoDuvidasProps {
  cadernos: CadernoDeDuvidas[]
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Orquestrador da página: mantém o estado de busca e de filtro por edital,
 * e compõe as duas camadas de conteúdo a partir deles.
 *
 * A busca cruza pergunta e resposta de todos os cadernos (geral e por
 * edital) - a comparação ignora acento, então quem digita "inscricao"
 * encontra "inscrição". O chip de edital só restringe a camada 2; a camada 1
 * (geral) fica sempre visível, exceto quando a busca não bate com nada nela.
 */
export function CadernoDuvidas({ cadernos }: CadernoDuvidasProps) {
  const [busca, setBusca] = useState('')
  const [cadernoAtivo, setCadernoAtivo] = useState(TODOS_CADERNOS)

  const cadernosPorEdital = useMemo(() => cadernos.filter((c) => c.editalSlug), [cadernos])

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim())
    if (!termo) return cadernos
    return cadernos
      .map((caderno) => ({
        ...caderno,
        duvidas: caderno.duvidas.filter(
          (d) =>
            normalizar(d.pergunta).includes(termo) || normalizar(d.resposta).includes(termo),
        ),
      }))
      .filter((caderno) => caderno.duvidas.length > 0)
  }, [cadernos, busca])

  const buscando = busca.trim().length > 0
  const encontradas = filtrados.reduce((soma, c) => soma + c.duvidas.length, 0)

  const geral = filtrados.find((c) => c.id === CADERNO_GERAL)
  const porEdital = filtrados.filter(
    (c) => c.editalSlug && (cadernoAtivo === TODOS_CADERNOS || c.id === cadernoAtivo),
  )

  return (
    <>
      <section
        id="faq-busca"
        aria-labelledby="faq-busca-heading"
        className="lg:sticky lg:top-24 lg:z-10 lg:bg-papel-50 lg:pb-6"
      >
        <h2 id="faq-busca-heading" className="sr-only">
          Buscar dúvidas
        </h2>
        <DuvidasBusca
          valor={busca}
          aoMudar={setBusca}
          buscando={buscando}
          encontradas={encontradas}
        />
        {cadernosPorEdital.length > 0 && (
          <DuvidasFiltros
            cadernos={cadernosPorEdital}
            ativo={cadernoAtivo}
            aoEscolher={setCadernoAtivo}
          />
        )}
      </section>

      {geral && <DuvidasGeral duvidas={geral.duvidas} abertoPorPadrao={buscando} />}

      {cadernosPorEdital.length > 0 && (
        <section id="faq-cadernos" aria-labelledby="faq-cadernos-heading" className="mt-12">
          <h2 id="faq-cadernos-heading" className="sr-only">
            Dúvidas por edital
          </h2>
          {porEdital.length > 0 ? (
            <div className="space-y-12">
              {porEdital.map((caderno) => (
                <CadernoSecao key={caderno.id} caderno={caderno} abertoPorPadrao={buscando} />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-tinta-600" role="status">
              Nenhuma dúvida corresponde à busca.
            </p>
          )}
        </section>
      )}
    </>
  )
}
