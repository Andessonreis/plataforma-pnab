import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
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
      <body className={inter.className}>{children}</body>
    </html>
  )
}
