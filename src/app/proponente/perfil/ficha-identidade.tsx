import type { ReactNode } from 'react'
import Link from 'next/link'
import type { TipoProponente } from '@prisma/client'
import { IconLock } from '@/components/ui/icons'
import { tipoProponenteLabel } from '@/lib/status-maps'
import { formatCpfCnpj } from '@/lib/utils/format'

interface FichaIdentidadeProps {
  nome: string
  tipoProponente: TipoProponente | null
  cpfCnpj: string | null
  createdAt: Date
  /** Bloco da foto, que é interativo e vive no componente cliente. */
  foto: ReactNode
}

const SECOES = [
  { href: '#tour-perfil-identificacao', rotulo: 'Identificação' },
  { href: '#tour-perfil-contato', rotulo: 'Contato' },
  { href: '#tour-perfil-endereco', rotulo: 'Endereço' },
  { href: '#tour-perfil-senha', rotulo: 'Senha de acesso' },
]

/**
 * Canhoto da ficha cadastral: quem é a conta e o que não muda por aqui. O
 * documento fica à vista e travado, com o caminho para corrigir, em vez de
 * um campo desabilitado no meio do formulário que parecia quebrado.
 */
export function FichaIdentidade({ nome, tipoProponente, cpfCnpj, createdAt, foto }: FichaIdentidadeProps) {
  const documento = cpfCnpj ? formatCpfCnpj(cpfCnpj) : null
  const ehCnpj = (cpfCnpj ?? '').replace(/\D/g, '').length > 11

  return (
    <aside id="tour-perfil-resumo" aria-label="Sua conta" className="border-t-4 border-tinta-900 pt-5 lg:sticky lg:top-8">
      {foto}

      <p className="mt-5 text-xl font-semibold leading-snug text-tinta-900">{nome || 'Sem nome'}</p>
      <p className="text-tinta-700">{tipoProponente ? tipoProponenteLabel[tipoProponente] : 'Proponente'}</p>

      <dl className="mt-5 border-t border-tinta-900/15">
        <div className="border-b border-tinta-900/15 py-3">
          <dt className="flex items-center gap-1.5 text-sm text-tinta-700">
            <IconLock className="h-4 w-4" />
            {ehCnpj ? 'CNPJ' : 'CPF'}
          </dt>
          {/* deslop-ignore-next-line 34 documento oficial, dígitos alinhados */}
          <dd className="mt-0.5 font-mono text-tinta-900">{documento ?? 'Não informado'}</dd>
          <dd className="mt-1 text-sm text-tinta-700">
            É o seu login e não pode ser alterado aqui. Se estiver errado,{' '}
            <Link href="/contato" className="font-semibold text-brand-700 underline underline-offset-4">
              fale com a Secretaria
            </Link>
            .
          </dd>
        </div>
        <div className="py-3">
          <dt className="text-sm text-tinta-700">Conta criada em</dt>
          <dd className="mt-0.5 text-tinta-900">
            {createdAt.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })}
          </dd>
        </div>
      </dl>

      <nav aria-label="Partes do perfil" className="mt-4 hidden lg:block">
        <ul className="border-t border-tinta-900/15">
          {SECOES.map((secao) => (
            <li key={secao.href}>
              <a
                href={secao.href}
                className="flex min-h-[44px] items-center border-b border-tinta-900/15 text-sm font-semibold text-tinta-800 [@media(hover:hover)]:hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta-900"
              >
                {secao.rotulo}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
