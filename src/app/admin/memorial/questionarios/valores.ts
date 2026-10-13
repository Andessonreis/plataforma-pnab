import type { CampoFormulario } from '@/types/campo-formulario'

/** Estado do formulário de questionário, igual ao corpo que a API recebe. */
export interface ValoresQuestionario {
  slug: string
  titulo: string
  descricao: string
  finalidade: string
  exigeLogin: boolean
  mensagemSucesso: string
  campos: CampoFormulario[]
}

export const QUESTIONARIO_VAZIO: ValoresQuestionario = {
  slug: '',
  titulo: '',
  descricao: '',
  finalidade: '',
  exigeLogin: false,
  mensagemSucesso: '',
  campos: [],
}
