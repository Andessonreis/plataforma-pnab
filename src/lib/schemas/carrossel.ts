import { z } from 'zod'

/** Limites do tempo de troca: abaixo de 3 s não dá para ler; acima de 30 s ninguém espera. */
export const INTERVALO_CARROSSEL = { min: 3, max: 30 } as const

export const carrosselSchema = z.object({
  intervaloSegundos: z.coerce
    .number({ invalid_type_error: 'Informe um número de segundos' })
    .int('Use um número inteiro de segundos')
    .min(INTERVALO_CARROSSEL.min, `Mínimo de ${INTERVALO_CARROSSEL.min} segundos`)
    .max(INTERVALO_CARROSSEL.max, `Máximo de ${INTERVALO_CARROSSEL.max} segundos`),
  automatico: z.boolean().default(true),
})

export type ConfigCarrossel = z.infer<typeof carrosselSchema>

/** Vale enquanto ninguém salvou uma configuração no painel. */
export const CARROSSEL_PADRAO: ConfigCarrossel = { intervaloSegundos: 5, automatico: true }
