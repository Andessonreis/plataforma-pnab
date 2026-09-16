/**
 * Seed pontual — Convocação para a Assembleia de Composição do Conselho
 * Municipal de Cultura de Irecê (21/09/2026)
 *
 * Fonte: card de divulgação oficial da Secretaria de Cultura e Turismo,
 * enviado pela Malu em 16/09/2026.
 * USO: npx tsx prisma/seed-evento-assembleia-conselho-cultura.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const IMAGEM = '/images/noticias/assembleia-conselho-cultura-2026/card-convocacao.jpg'
const SLUG = 'assembleia-composicao-conselho-municipal-cultura-irece-2026'

const TITULO = 'Convocação para Assembleia de Composição do Conselho Municipal de Cultura de Irecê'

const CORPO = `![Card de divulgação oficial da Assembleia de Composição do Conselho Municipal de Cultura de Irecê, com data, horários e local do encontro](${IMAGEM})

A cultura de Irecê é feita por você! Quem faz cultura tem voz e espaço para ajudar a construir os caminhos da cultura em nossa cidade.

A Secretaria de Cultura e Turismo de Irecê convoca agentes, fazedores de cultura, artistas, produtores, instituições e representantes da sociedade civil para participar da Assembleia de Composição do Conselho Municipal de Cultura.

## Serviço

**Assembleia de Composição do Conselho Municipal de Cultura de Irecê**
Quando: 21 de setembro de 2026
Horário: 1ª chamada às 17h | 2ª chamada às 18h
Onde: Cine Teatro da Praça CEU — Rua São Francisco, s/n, Coopirecê, em frente ao Colégio Municipal Tenente Wilson

Podem participar representantes de diferentes áreas da cultura, como audiovisual, artes visuais, fotografia, música, teatro, dança, circo, literatura, cultura popular e cultura afro-brasileira, além de instituições ligadas ao setor cultural do município.`

const DATA_EVENTO = new Date('2026-09-21T23:59:59-03:00')

async function seedNoticia() {
  // Sem imagemUrl de propósito: o card de divulgação é uma peça gráfica com
  // texto próprio (título, data, endereço), não uma fotografia. Os
  // componentes de capa de notícia (Manchete, CabecalhoNoticia) recortam a
  // imagem em 16:9/21:9 e sobrepõem gradiente + título por cima — tratamento
  // certo pra foto, mas que mutila um card com texto embutido. O card já
  // aparece inteiro (object-contain) no slide de destaque da home.
  const noticia = await prisma.noticia.upsert({
    where: { slug: SLUG },
    update: {
      titulo: TITULO,
      corpo: CORPO,
      tags: ['Conselho Municipal de Cultura', 'Participação Social'],
      imagemUrl: null,
      publicado: true,
    },
    create: {
      slug: SLUG,
      titulo: TITULO,
      corpo: CORPO,
      tags: ['Conselho Municipal de Cultura', 'Participação Social'],
      publicado: true,
      publicadoEm: new Date(),
    },
  })
  console.log(`✔ Notícia "${noticia.titulo}" (slug: ${noticia.slug})`)
}

async function seedSlide() {
  const tituloSlide = 'Assembleia do Conselho Municipal de Cultura'
  const existente = await prisma.slideDestaque.findFirst({ where: { titulo: tituloSlide } })

  const dados = {
    titulo: tituloSlide,
    descricao: '21 de setembro — participe da Assembleia de Composição do Conselho Municipal de Cultura de Irecê.',
    imagemUrl: IMAGEM,
    ctaLabel: 'Saiba mais',
    ctaUrl: `/noticias/${SLUG}`,
    ordem: 0,
    ativo: true,
    fimEm: DATA_EVENTO,
  }

  const slide = existente
    ? await prisma.slideDestaque.update({ where: { id: existente.id }, data: dados })
    : await prisma.slideDestaque.create({ data: dados })

  console.log(`✔ Slide de destaque "${slide.titulo}" (id: ${slide.id})`)
}

async function main() {
  await seedNoticia()
  await seedSlide()
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
