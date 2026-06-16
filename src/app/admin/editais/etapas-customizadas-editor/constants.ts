export const TIPO_CAMPO_SIMPLES_OPTIONS = [
  { value: 'texto', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'numero', label: 'Número' },
  { value: 'moeda', label: 'Moeda (R$)' },
  { value: 'data', label: 'Data' },
  { value: 'select', label: 'Seleção única' },
  { value: 'multiselect', label: 'Seleção múltipla' },
]

export const TIPO_CAMPO_TODOS_OPTIONS = [
  ...TIPO_CAMPO_SIMPLES_OPTIONS,
  { value: 'info', label: '— Bloco informativo (texto)' },
  { value: 'tabela', label: '— Tabela (linhas adicionáveis)' },
  { value: 'grupo_repetivel', label: '— Grupo repetível (itens)' },
]

export const VARIANTE_INFO_OPTIONS = [
  { value: 'info', label: 'Informação (cinza)' },
  { value: 'atencao', label: 'Atenção (âmbar)' },
  { value: 'alerta', label: 'Alerta (vermelho)' },
]

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || `campo_${Date.now().toString(36).slice(-4)}`
}
