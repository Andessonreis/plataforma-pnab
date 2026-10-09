import { getConfig, salvarConfig, type ChaveConfig } from '@/lib/memorial/config'
import { validarValorConfig } from '@/lib/schemas/memorial-config'
import { type Autor, registrarAlteracao } from './memorial-conteudo.service'

/** Todas as configurações (painel). Cada chave já vem completada com o padrão. */
export async function lerConfiguracoes() {
  const [institucional, contato, visitacao] = await Promise.all([
    getConfig('institucional'),
    getConfig('contato'),
    getConfig('visitacao'),
  ])
  return { institucional, contato, visitacao }
}

/** O que o site público mostra: textos institucionais e canais de contato. */
export async function lerConfiguracoesPublicas() {
  const [institucional, contato] = await Promise.all([getConfig('institucional'), getConfig('contato')])
  return { institucional, contato }
}

/** Valida com o schema da chave, grava, versiona e audita. */
export async function atualizarConfiguracao(chave: ChaveConfig, valor: unknown, autor: Autor) {
  const validado = validarValorConfig(chave, valor)
  await salvarConfig(chave, validado, autor.userId)
  await registrarAlteracao({
    acao: 'MEMORIAL_CONFIG_ATUALIZADA',
    entidade: 'MemorialConfig',
    id: chave,
    rotulo: chave,
    autor,
    estado: validado,
  })
  return validado
}
