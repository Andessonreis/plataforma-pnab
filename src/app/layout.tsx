// Força SSR em todas as rotas — banco não disponível no build
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { VLibras } from '@client/components/layout/vlibras'
import { Toaster } from '@client/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  // `||` (não `??`) — `NEXT_PUBLIC_SITE_URL` chega como string vazia se o
  // .env da VPS não define a var, e `new URL('')` explode no build.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Portal PNAB Irecê',
    template: '%s | Portal PNAB Irecê',
  },
  description:
    'Política Nacional Aldir Blanc de Fomento à Cultura — Secretaria de Arte e Cultura de Irecê/BA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <Toaster />
        <VLibras />
      </body>
    </html>
  )
}
