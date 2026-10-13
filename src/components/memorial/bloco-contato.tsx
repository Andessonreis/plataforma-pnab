import type { ReactNode } from 'react'
import { IconClock, IconExternalLink, IconInstagram, IconMail, IconMapPin, IconPhone } from '@/components/ui/icons'
import type { Contato } from '@/lib/memorial/config'

function soDigitos(v: string) {
  return v.replace(/\D/g, '')
}

/** "@memorial" ou endereço completo → link do perfil. */
function linkInstagram(v: string) {
  return v.startsWith('http') ? v : `https://instagram.com/${v.replace(/^@/, '')}`
}

function Canal({ icone, rotulo, children }: { icone: ReactNode; rotulo: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 border-t border-tinta-900/15 pt-5">
      <span className="mt-0.5 shrink-0 text-brand-700">{icone}</span>
      <div className="min-w-0">
        <dt className="text-sm font-semibold text-tinta-900">{rotulo}</dt>
        <dd className="mt-1 break-words text-base text-tinta-700">{children}</dd>
      </div>
    </div>
  )
}

const LINK = 'underline underline-offset-4 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'

/** Canais oficiais do Memorial, todos vindos das configurações (só aparece o que foi preenchido). */
export function BlocoContato({ contato }: { contato: Contato }) {
  const icone = 'h-5 w-5'
  return (
    <section aria-labelledby="contato-titulo" className="papel-textura bg-papel-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <h2 id="contato-titulo" className="titulo text-4xl leading-none text-tinta-900 sm:text-5xl">
          Fale com o Memorial
        </h2>
        <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {contato.email && (
            <Canal icone={<IconMail className={icone} />} rotulo="E-mail">
              <a href={`mailto:${contato.email}`} className={LINK}>{contato.email}</a>
            </Canal>
          )}
          {contato.telefone && (
            <Canal icone={<IconPhone className={icone} />} rotulo="Telefone">
              <a href={`tel:+55${soDigitos(contato.telefone)}`} className={LINK}>{contato.telefone}</a>
            </Canal>
          )}
          {contato.whatsapp && (
            <Canal icone={<IconPhone className={icone} />} rotulo="WhatsApp">
              <a href={`https://wa.me/55${soDigitos(contato.whatsapp)}`} target="_blank" rel="noopener noreferrer" className={LINK}>
                {contato.whatsapp}
              </a>
            </Canal>
          )}
          {contato.instagram && (
            <Canal icone={<IconInstagram className={icone} />} rotulo="Instagram">
              <a href={linkInstagram(contato.instagram)} target="_blank" rel="noopener noreferrer" className={LINK}>
                {contato.instagram}
              </a>
            </Canal>
          )}
          {contato.endereco && (
            <Canal icone={<IconMapPin className={icone} />} rotulo="Endereço">{contato.endereco}</Canal>
          )}
          {contato.funcionamento && (
            <Canal icone={<IconClock className={icone} />} rotulo="Funcionamento">{contato.funcionamento}</Canal>
          )}
          {contato.site && (
            <Canal icone={<IconExternalLink className={icone} />} rotulo="Site">
              <a href={contato.site.startsWith('http') ? contato.site : `https://${contato.site}`} target="_blank" rel="noopener noreferrer" className={LINK}>{contato.site}</a>
            </Canal>
          )}
        </dl>
      </div>
    </section>
  )
}
