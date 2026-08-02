import type { SelectOption } from '@/components/ui'

// ─── Opções de <Select> compartilhadas pelos editores de campo/etapa ────────

export const TIPO_CAMPO_SIMPLES_OPTIONS: SelectOption[] = [
  { value: 'texto', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'numero', label: 'Número' },
  { value: 'moeda', label: 'Moeda (R$)' },
  { value: 'data', label: 'Data' },
  { value: 'select', label: 'Seleção única' },
  { value: 'multiselect', label: 'Seleção múltipla' },
]

export const TIPO_CAMPO_TODOS_OPTIONS: SelectOption[] = [
  ...TIPO_CAMPO_SIMPLES_OPTIONS,
  { value: 'info', label: '— Bloco informativo (texto)' },
  { value: 'tabela', label: '— Tabela (linhas adicionáveis)' },
  { value: 'grupo_repetivel', label: '— Grupo repetível (itens)' },
]

export const VARIANTE_INFO_OPTIONS: SelectOption[] = [
  { value: 'info', label: 'Informação (cinza)' },
  { value: 'atencao', label: 'Atenção (âmbar)' },
  { value: 'alerta', label: 'Alerta (vermelho)' },
]
