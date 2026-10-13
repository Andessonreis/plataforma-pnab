import { getConfig } from '@/lib/memorial/config'
import { imagemDoItem } from '@/lib/memorial/midia'
import * as acervo from '@/lib/services/memorial-acervo.service'
import * as eventos from '@/lib/services/memorial-evento.service'
import * as exposicoes from '@/lib/services/memorial-exposicao.service'
import * as pessoas from '@/lib/services/memorial-pessoa.service'
import type { FotoPublica } from './foto-com-credito'

/** Fotos institucionais do portal, usadas só enquanto o acervo não tiver fotos publicadas. */
const FOTOS_RESERVA = ['/images/cidade/panoramica-irece.jpg', '/images/galeria/foto-02.png', '/images/galeria/foto-05.png']

type ItemComImagem = Parameters<typeof imagemDoItem>[0] & Omit<FotoPublica, 'src'>

/** Item do acervo → foto pronta para exibir; sem arquivo, não há o que mostrar. */
export function paraFoto(item: ItemComImagem): FotoPublica | null {
  const src = imagemDoItem(item)
  if (!src) return null
  return {
    id: item.id,
    titulo: item.titulo,
    legenda: item.legenda,
    credito: item.credito,
    dataAproximada: item.dataAproximada,
    decada: item.decada,
    src,
  }
}

export function fotosPublicas(itens: ItemComImagem[]): FotoPublica[] {
  return itens.map(paraFoto).filter((f): f is FotoPublica => f !== null)
}

/**
 * Abertura das páginas internas: fotografias do próprio acervo no fundo (quando já
 * houver) e o nome do Memorial como está nas configurações.
 */
export async function abertura(): Promise<{ fotos: string[]; nome: string }> {
  const [{ itens }, { titulo }] = await Promise.all([
    acervo.listarPublicos({ page: 1, pageSize: 6, tipo: 'FOTOGRAFIA' }),
    getConfig('institucional'),
  ])
  const fotos = fotosPublicas(itens).map((f) => f.src)
  return { fotos: fotos.length >= 2 ? fotos : FOTOS_RESERVA, nome: titulo }
}

/** Tudo o que a página inicial do Memorial mostra, em uma ida ao banco. */
export async function dadosDaHome() {
  const [institucional, contato, visitacao, expos, retratos, fotos, linha] = await Promise.all([
    getConfig('institucional'),
    getConfig('contato'),
    getConfig('visitacao'),
    exposicoes.listarPublicas({ page: 1, pageSize: 4 }),
    pessoas.listarPublicas({ page: 1, pageSize: 4 }),
    acervo.listarPublicos({ page: 1, pageSize: 8, tipo: 'FOTOGRAFIA' }),
    eventos.linhaDoTempo({ page: 1, pageSize: 6 }),
  ])
  const galeria = fotosPublicas(fotos.itens)

  return {
    institucional,
    contato,
    visitacao,
    exposicoes: expos.itens,
    pessoas: retratos.itens,
    fotos: galeria,
    totalFotos: fotos.total,
    eventos: linha.itens,
    totalEventos: linha.total,
    // A capa é a da exposição em destaque; sem ela, a primeira foto publicada
    capa: expos.itens.find((e) => e.capaUrl)?.capaUrl ?? galeria[0]?.src ?? null,
    creditoCapa: expos.itens.find((e) => e.capaUrl) ? null : (galeria[0]?.credito ?? null),
  }
}
