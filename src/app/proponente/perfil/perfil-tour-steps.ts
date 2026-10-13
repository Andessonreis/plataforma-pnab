import type { TourStep } from '@/lib/tour/use-tour'

export const PASSOS_PERFIL: TourStep[] = [
  {
    elemento: '#tour-perfil-resumo',
    titulo: 'Sua conta',
    descricao: 'Foto, tipo de proponente e documento. O CPF ou CNPJ é o seu login e não muda por aqui.',
  },
  {
    elemento: '#tour-perfil-foto',
    titulo: 'Foto de perfil',
    descricao: 'Envie, troque ou remova sua foto. Aceita JPG, PNG ou WEBP.',
  },
  {
    elemento: '#tour-perfil-identificacao',
    titulo: 'Identificação',
    descricao: 'Seu nome como aparece nas inscrições e nos documentos.',
  },
  {
    elemento: '#tour-perfil-contato',
    titulo: 'Contato',
    descricao: 'E-mail e telefone para onde chegam avisos e resultados.',
  },
  {
    elemento: '#tour-perfil-endereco',
    titulo: 'Endereço',
    descricao: 'Digite o CEP e o resto se completa. Só confira e informe o número.',
  },
  {
    elemento: '#tour-perfil-salvar',
    titulo: 'Salvar',
    descricao: 'Esta barra avisa quando há algo por salvar. Um toque grava identificação, contato e endereço juntos.',
  },
  {
    elemento: '#tour-perfil-senha',
    titulo: 'Senha de acesso',
    descricao: 'Troque sua senha quando quiser, confirmando a senha atual. É um envio separado dos dados.',
  },
]
