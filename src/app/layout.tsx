// Força SSR em todas as rotas — banco não disponível no build
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { VLibras } from '@/components/layout/vlibras'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Secretaria de Cultura e Turismo de Irecê',
    template: '%s | Cultura e Turismo Irecê',
  },
  description:
    'Portal oficial da Secretaria de Cultura e Turismo de Irecê/BA — editais, políticas culturais (PNAB), turismo e ações da Prefeitura Municipal.',
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
