import { Button } from '@/components/ui'
import { NovaInscricaoHeader } from './nova-inscricao-header'

interface InscricaoNaoPermitidaProps {
  editalTitulo: string
  tiposTexto: string
}

// Tela exibida quando o tipo de proponente do usuário não está entre os aceitos pelo edital.
export function InscricaoNaoPermitida({ editalTitulo, tiposTexto }: InscricaoNaoPermitidaProps) {
  return (
    <div className="space-y-6">
      <NovaInscricaoHeader editalTitulo={editalTitulo} />
      <div className="rounded-xl border border-accent-200 bg-accent-50 p-6" role="alert"> {/* deslop-ignore 21 — filho usa rounded-lg (Button), radius menor que o painel */}
        <div className="flex items-start gap-3">
          <svg
            className="h-6 w-6 text-accent-600 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h2 className="text-xl font-semibold text-accent-900">Inscrição não permitida</h2>
            <p className="text-sm text-accent-800 mt-1">
              Este edital aceita apenas inscrições de <strong>{tiposTexto}</strong>.
            </p>
            <p className="text-sm text-accent-800 mt-2">
              Seu cadastro atual não corresponde aos tipos aceitos. Se acredita que houve um erro,
              entre em contato com a Secretaria de Arte e Cultura de Irecê.
            </p>
            <Button href="/proponente/perfil" variant="secondary" size="sm" className="mt-4">
              Ver meu perfil
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
