import type { TourStep } from '@/lib/tour/use-tour'
import type { Step } from './types'

interface GerarPassosOpts {
  currentStep: number
  totalSteps: number
  temCotas: boolean
}

const labelDaEtapa: Record<Step['kind'], string> = {
  categoria: 'Categoria',
  dados: 'Dados do Projeto',
  video: 'Vídeo',
  etapa_custom: 'etapa personalizada',
  anexos: 'Anexos',
  revisao: 'Revisão',
}

/** Passos específicos de cada tipo de etapa — a explicação de verdade do que
 * tem na tela, não um texto genérico de "preencha os campos". */
function passosDaEtapa(step: Step, temCotas: boolean): TourStep[] {
  switch (step.kind) {
    case 'categoria':
      return [
        {
          elemento: '#tour-nova-categoria-select',
          titulo: 'Categoria do projeto',
          descricao: 'Escolha a categoria em que seu projeto se enquadra neste edital — isso pode mudar quais campos aparecem nas próximas etapas.',
        },
        ...(temCotas
          ? [{
              elemento: '#tour-nova-categoria-cotas',
              titulo: 'Cotas (opcional)',
              descricao: 'Marque aqui se quiser concorrer também às cotas, além da ampla concorrência. Se marcar, é preciso enviar a autodeclaração correspondente na etapa de Anexos.',
            }]
          : []),
      ]

    case 'dados':
      return [{
        elemento: '#tour-nova-conteudo',
        titulo: 'Dados do Projeto',
        descricao: 'Preencha os campos que este edital pede sobre o seu projeto. Os marcados com * são obrigatórios — alguns têm contador de caracteres pra acompanhar o limite.',
      }]

    case 'video':
      return [
        {
          elemento: '#tour-nova-video-manual',
          titulo: 'Opção 1 — Preencher manualmente',
          descricao: 'Você segue o formulário normal, uma etapa de cada vez. Na etapa de Anexos, ainda dá pra anexar um vídeo complementar se quiser — mas é opcional.',
        },
        {
          elemento: '#tour-nova-video-video',
          titulo: 'Opção 2 — Enviar por vídeo',
          descricao: 'Em vez de preencher os campos das próximas etapas, você grava um único vídeo respondendo tudo o que elas pedem. As etapas seguintes ficam dispensadas — escolha só uma das duas opções.',
        },
        {
          elemento: '#tour-nova-conteudo',
          titulo: 'Depois de escolher o vídeo',
          descricao: 'Ao marcar "Enviar por vídeo", aparece aqui embaixo onde enviar o arquivo gravado ou colar um link do YouTube/Google Drive.',
        },
      ]

    case 'etapa_custom':
      return [{
        elemento: '#tour-nova-conteudo',
        titulo: step.etapa.titulo,
        descricao: 'Etapa própria deste edital — preencha os campos que ele pede aqui, do mesmo jeito que nas outras etapas.',
      }]

    case 'anexos':
      return [
        {
          elemento: '#tour-nova-anexos-checklist',
          titulo: 'Documentos obrigatórios',
          descricao: 'A lista mostra o que este edital exige e marca o que já foi enviado. Itens sem "Obrigatório" são opcionais.',
        },
        {
          elemento: '#tour-nova-conteudo',
          titulo: 'Enviar arquivos',
          descricao: 'PDF, PNG ou JPEG, até 10MB cada. Dá pra enviar mais de um arquivo por item, um de cada vez.',
        },
      ]

    case 'revisao':
      return [{
        elemento: '#tour-nova-conteudo',
        titulo: 'Revisão final',
        descricao: 'Confira com calma tudo que você preencheu nas etapas anteriores. Depois de enviar, a inscrição não pode mais ser alterada.',
      }]
  }
}

/**
 * Monta o tour da etapa atual do wizard — refeito a cada troca de etapa, por
 * isso "Fazer tutorial" sempre explica o que está de fato na tela, não uma
 * introdução genérica. Funciona pra qualquer edital: os passos variam pelo
 * TIPO de etapa (categoria/dados/vídeo/anexos/revisão/etapa customizada), que
 * é sempre o mesmo vocabulário estrutural do wizard, nunca por nome de campo.
 */
export function montarPassosNovaInscricao(step: Step, opts: GerarPassosOpts): TourStep[] {
  const { currentStep, totalSteps, temCotas } = opts

  const passos: TourStep[] = [
    {
      elemento: '#tour-nova-progresso',
      titulo: 'Seu progresso',
      descricao: `Você está na etapa "${labelDaEtapa[step.kind]}" (${currentStep + 1} de ${totalSteps}). Etapas já preenchidas ficam clicáveis, pra voltar e revisar quando quiser.`,
    },
    ...passosDaEtapa(step, temCotas),
  ]

  if (step.kind === 'categoria' || step.kind === 'dados' || step.kind === 'etapa_custom') {
    passos.push({
      elemento: '#tour-nova-salvar-rascunho',
      titulo: 'Salvar rascunho',
      descricao: 'Não precisa terminar tudo de uma vez. Salve como rascunho e continue de onde parou depois.',
    })
  }

  passos.push({
    elemento: '#tour-nova-navegacao',
    titulo: step.kind === 'revisao' ? 'Enviar inscrição' : 'Avançar',
    descricao: step.kind === 'revisao'
      ? 'Quando tiver certeza que está tudo certo, envie por aqui — não dá pra editar depois.'
      : 'Quando terminar esta etapa, toque em "Próximo" pra seguir pra próxima.',
  })

  passos.push({
    elemento: '#tour-hamburguer',
    titulo: 'Seu menu',
    descricao: 'Toque aqui pra abrir o menu — dashboard, inscrições, notificações e perfil ficam ali.',
    soMobile: true,
  })

  return passos
}
