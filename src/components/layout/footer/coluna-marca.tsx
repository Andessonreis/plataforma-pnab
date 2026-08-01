import Image from 'next/image'
import Link from 'next/link'
import { IconMail, IconMapPin } from '@/components/ui/icons'

/** Bloco institucional: marca da Secretaria, descrição e canais de contato. */
export function ColunaMarca() {
  return (
    <div className="lg:col-span-4">
      <Link href="/" className="group mb-5 flex items-center gap-3">
        <Image
          src="/images/secult/simbolo-secult.png"
          alt=""
          width={659}
          height={800}
          className="h-11 w-auto"
          aria-hidden="true"
        />
        <div>
          <p className="titulo text-base leading-tight tracking-wide text-papel-50 transition-colors group-hover:text-accent-300">
            Portal PNAB
          </p>
          <p className="text-xs leading-tight text-papel-200/60">Irecê/BA</p>
        </div>
      </Link>

      <p className="mb-6 text-sm leading-relaxed text-papel-200/75">
        Política Nacional Aldir Blanc de Fomento à Cultura. Secretaria de Cultura e Turismo de
        Irecê/BA.
      </p>

      <div className="space-y-2.5 text-sm">
        <a
          href="mailto:cultura@irece.ba.gov.br"
          className="group flex items-center gap-2.5 text-papel-200/85 transition-colors hover:text-papel-50"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-papel-100/10 transition-colors group-hover:bg-papel-100/20">
            <IconMail className="h-3.5 w-3.5" />
          </span>
          cultura@irece.ba.gov.br
        </a>
        <p className="flex items-center gap-2.5 text-papel-200/60">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-papel-100/10">
            <IconMapPin className="h-3.5 w-3.5" />
          </span>
          Irecê, Bahia — Brasil
        </p>
      </div>
    </div>
  )
}
