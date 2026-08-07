import type { TourStep } from '@/lib/tour/use-tour'

export const PASSOS_PERFIL: TourStep[] = [
  {
    elemento: '#tour-perfil-resumo',
    titulo: 'Seu resumo',
    descricao: 'Foto, tipo de proponente e principais dados de contato, sempre visíveis aqui em cima.',
  },
  {
    elemento: '#tour-perfil-foto',
    titulo: 'Foto de perfil',
    descricao: 'Toque no lápis pra enviar ou trocar sua foto. JPEG, PNG ou WEBP.',
  },
  {
    elemento: '#tour-perfil-dados',
    titulo: 'Dados pessoais',
    descricao: 'Nome, e-mail e telefone usados no contato e nos documentos gerados.',
  },
  {
    elemento: '#tour-perfil-endereco',
    titulo: 'Endereço',
    descricao: 'Digite o CEP e o resto preenche sozinho — só confira e complete o número.',
  },
  {
    elemento: '#tour-perfil-salvar',
    titulo: 'Salvar alterações',
    descricao: 'Depois de editar dados pessoais ou endereço, não esqueça de salvar aqui.',
  },
  {
    elemento: '#tour-perfil-senha',
    titulo: 'Alterar senha',
    descricao: 'Troque sua senha de acesso sempre que quiser, informando a senha atual.',
  },
  {
    elemento: '#tour-perfil-alterar-senha-btn',
    titulo: 'Confirmar nova senha',
    descricao: 'Depois de preencher os três campos, toque aqui pra confirmar a troca.',
  },
  {
    elemento: '#tour-hamburguer',
    titulo: 'Seu menu',
    descricao: 'Toque aqui pra abrir o menu — dashboard, inscrições e notificações ficam ali.',
    soMobile: true,
  },
]
