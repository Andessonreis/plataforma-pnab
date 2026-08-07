import { Input } from '@/components/ui'

interface CamposIdentificacaoProps {
  nomeContato: string
  emailContato: string
  erroNome?: string
  erroEmail?: string
  aoMudarNome: (valor: string) => void
  aoMudarEmail: (valor: string) => void
}

/** Agrupamento "Seus dados" do formulário de contato: nome e e-mail. */
export function CamposIdentificacao({
  nomeContato,
  emailContato,
  erroNome,
  erroEmail,
  aoMudarNome,
  aoMudarEmail,
}: CamposIdentificacaoProps) {
  return (
    <fieldset className="space-y-5 border-0">
      <legend className="rotulo mb-1 text-xs text-tinta-500">Seus dados</legend>

      <Input
        label="Nome completo"
        type="text"
        placeholder="Seu nome"
        value={nomeContato}
        onChange={(e) => aoMudarNome(e.target.value)}
        error={erroNome}
        required
        autoComplete="name"
      />

      <Input
        label="E-mail"
        type="email"
        placeholder="seu@email.com"
        value={emailContato}
        onChange={(e) => aoMudarEmail(e.target.value)}
        error={erroEmail}
        required
        autoComplete="email"
      />
    </fieldset>
  )
}
