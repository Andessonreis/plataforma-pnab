import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
          <span className="text-white font-bold">P</span>
        </div>
        <div>
          <p className="text-base font-bold text-slate-900 leading-tight">Portal PNAB</p>
          <p className="text-xs text-slate-500 leading-tight">Irecê</p>
        </div>
      </Link>

      <div className="w-full max-w-md">{children}</div>

      {/* Voltar ao site */}
      <p className="mt-8 text-sm text-slate-500">
        <Link href="/" className="text-brand-600 hover:text-brand-700 font-medium">
          &larr; Voltar ao portal
        </Link>
      </p>
    </div>
  )
}
