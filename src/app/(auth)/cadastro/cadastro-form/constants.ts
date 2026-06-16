import type { TipoProponente } from './types'

export const tipoLabels: Record<TipoProponente, string> = {
  PF: 'Pessoa Física',
  PJ: 'Pessoa Jurídica',
  MEI: 'MEI',
  COLETIVO: 'Coletivo Cultural',
}

export const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]
