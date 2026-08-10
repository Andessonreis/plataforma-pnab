/**
 * Seed pontual — Notícia do 9º Festival Internacional de Teatro da Caatinga
 *
 * Fonte: public/images/Noticias_projetos_apoiados/9º FIT Caatinga release geral.docx
 * USO: npx tsx prisma/seed-noticia-fit-caatinga.ts
 */

import { PrismaClient, type Prisma } from '@prisma/client'
import type { GaleriaItem } from '../src/lib/utils/noticia-galeria'

const prisma = new PrismaClient()

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue
}

const SLUG = '9-festival-internacional-teatro-da-caatinga-2026'

const GALERIA: GaleriaItem[] = [
  { url: '/images/noticias/fit-caatinga-2026/dia-06-mada-gugu.jpg', legenda: 'Madá Gugú', data: '2026-08-06' },
  { url: '/images/noticias/fit-caatinga-2026/dia-06-edson-machado.jpg', legenda: 'Edson Machado — Dance a tua natureza Afro', data: '2026-08-06' },
  { url: '/images/noticias/fit-caatinga-2026/dia-07-boca-a-boca.jpg', legenda: 'Boca a Boca', data: '2026-08-07' },
  { url: '/images/noticias/fit-caatinga-2026/dia-08-vou-te-contar.jpg', legenda: 'Vou Te Contar', data: '2026-08-08' },
  { url: '/images/noticias/fit-caatinga-2026/dia-09-akoko.jpg', legenda: 'Akoko Lati Wa Ni', data: '2026-08-09' },
]

const CORPO = `Entre os dias 6 e 15 de agosto, o 9º Festival Internacional de Teatro da Caatinga (FITC) transforma as cidades de Irecê, Ibititá e João Dourado em um grande circuito cultural, reunindo espetáculos, intercâmbios, ações formativas e encontros entre artistas brasileiros e internacionais.

Consolidado como um dos principais eventos artístico-culturais do interior da Bahia, o festival reafirma sua missão de democratizar o acesso às artes e fortalecer a produção cultural fora dos grandes centros urbanos. Criado em 2012 como um festival regional, o FITC rapidamente ampliou seu alcance, tornando-se nacional e, a partir de 2015, internacional. Hoje, é reconhecido como uma das principais vitrines das artes cênicas no semiárido brasileiro.

Declarado Patrimônio Cultural Imaterial de Irecê pela Lei Municipal nº 1.313/2023, o festival é produzido pela Associação Centro Internacional Avatar de Artes (CIACEN), entidade de utilidade pública municipal, com apoio da Política Nacional Aldir Blanc (PNAB), por meio da Secretaria de Cultura do Estado da Bahia, da Fundação Cultural do Estado da Bahia (Funceb) e do Ministério da Cultura.

## Um festival sobre o próprio território

Mais do que uma programação artística, o Festival Internacional de Teatro da Caatinga propõe uma reflexão sobre o território onde acontece. Inserido no único bioma exclusivamente brasileiro, o evento apresenta a Caatinga como um espaço de diversidade, potência criativa e resistência, rompendo estereótipos sobre o sertão e valorizando sua riqueza ambiental, histórica e cultural.

Ao longo de dez dias, grupos da Bahia, de diversas regiões do Brasil e de outros países compartilham experiências, linguagens e processos criativos em uma programação que promove o diálogo entre diferentes culturas sem perder de vista as identidades locais. A literatura de cordel, o cancioneiro popular, o xaxado e as narrativas sertanejas convivem com as mais diversas estéticas contemporâneas do teatro mundial, criando um ambiente fértil de troca artística.

Outro diferencial do festival é a ocupação dos espaços públicos e naturais do território. Em diversas apresentações, a própria paisagem da Caatinga deixa de ser apenas cenário para integrar a dramaturgia, fazendo do pôr do sol, das formações rochosas e da vegetação do semiárido elementos cênicos que ampliam a experiência do público.

Além do impacto cultural, o festival movimenta a economia criativa regional: fortalece o turismo cultural, impulsiona o comércio local, gera oportunidades de trabalho para artistas, técnicos e produtores e amplia a circulação de bens e serviços nos municípios participantes.

## Direção artística

À frente da direção artística está o dramaturgo e diretor Paulo Atto, fundador da Cia Teatral Avatar e idealizador do festival. Com trajetória iniciada em 1984, Atto dirigiu mais de 30 espetáculos apresentados no Brasil, Europa, Estados Unidos e América Latina. Desde 2009 desenvolve suas atividades em Irecê, onde implantou o Núcleo Caatinga, consolidando uma intensa atuação voltada para a formação artística e o intercâmbio cultural. Também integra redes internacionais de artes cênicas, como a Rede Cena Iberoamericana (REI) e a Rede Ibero-americana de Animação Sociocultural (RIA), além de ser membro da Sociedade Geral de Autores e Editores da Espanha (SGAE).

## Programação de espetáculos no Teatro Ataídes Ribeiro

Confira acima quais espetáculos sobem ao palco em cada dia do festival — o card do dia atual fica em destaque enquanto o FITC estiver em cartaz.

Este projeto foi contemplado nos Editais da Política Nacional Aldir Blanc de Fomento à Cultura na Bahia, realizados com recursos do Governo Federal repassados pelo Ministério da Cultura, e executados pelo Governo do Estado da Bahia, por meio da Secretaria de Cultura do Estado.

## Serviço

**9º Festival Internacional de Teatro da Caatinga**
Quando: 6 a 15 de agosto de 2026
Onde: Irecê, Ibititá e João Dourado (BA)
Realização: Associação Centro Internacional Avatar de Artes (CIACEN)
Apoio: Política Nacional Aldir Blanc (PNAB), Secretaria de Cultura do Estado da Bahia, Fundação Cultural do Estado da Bahia (Funceb) e Ministério da Cultura.`

async function main() {
  const noticia = await prisma.noticia.upsert({
    where: { slug: SLUG },
    update: {
      titulo: '9º Festival Internacional de Teatro da Caatinga reúne artistas do Brasil e do mundo no semiárido baiano',
      corpo: CORPO,
      tags: ['PNAB', 'Festival', 'Teatro', 'FIT Caatinga'],
      imagemUrl: '/images/noticias/fit-caatinga-2026/capa.jpg',
      galeria: toJson(GALERIA),
      publicado: true,
    },
    create: {
      slug: SLUG,
      titulo: '9º Festival Internacional de Teatro da Caatinga reúne artistas do Brasil e do mundo no semiárido baiano',
      corpo: CORPO,
      tags: ['PNAB', 'Festival', 'Teatro', 'FIT Caatinga'],
      imagemUrl: '/images/noticias/fit-caatinga-2026/capa.jpg',
      galeria: toJson(GALERIA),
      publicado: true,
      publicadoEm: new Date('2026-08-06'),
    },
  })

  console.log(`✔ Notícia "${noticia.titulo}" (slug: ${noticia.slug})`)
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
