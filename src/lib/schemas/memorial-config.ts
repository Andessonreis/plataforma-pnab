import { z } from 'zod'
import { CONFIG_SCHEMAS, type ChaveConfig } from '@/lib/memorial/config'

const CHAVES = Object.keys(CONFIG_SCHEMAS) as [ChaveConfig, ...ChaveConfig[]]

export const chaveConfigSchema = z.enum(CHAVES)

/** Valida o valor enviado para uma chave com o schema dela (contrato em lib/memorial/config). */
export function validarValorConfig<K extends ChaveConfig>(chave: K, valor: unknown) {
  return CONFIG_SCHEMAS[chave].parse(valor) as z.infer<(typeof CONFIG_SCHEMAS)[K]>
}
