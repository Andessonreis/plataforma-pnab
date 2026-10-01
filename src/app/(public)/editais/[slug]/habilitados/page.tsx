import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function HabilitadosRedirectPage({ params }: Props) {
  const { slug } = await params
  redirect(`/editais/${slug}/habilitacao`)
}
