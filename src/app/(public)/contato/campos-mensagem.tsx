import { Input, Select, Textarea } from '@/components/ui'

interface CamposMensagemProps {
  editais: { id: string; titulo: string }[]
  editalId: string
  assunto: string
  mensagem: string
  erroAssunto?: string
  erroMensagem?: string
  aoMudarEdital: (valor: string) => void
  aoMudarAssunto: (valor: string) => void
  aoMudarMensagem: (valor: string) => void
}

/**
 * Agrupamento "Sobre sua mensagem": edital (opcional), assunto e mensagem.
 *
 * O edital relacionado só aparece quando há editais publicados — é uma
 * categorização de triagem para o atendimento, não o formulário dinâmico de
 * inscrição de cada edital.
 */
export function CamposMensagem({
  editais,
  editalId,
  assunto,
  mensagem,
  erroAssunto,
  erroMensagem,
  aoMudarEdital,
  aoMudarAssunto,
  aoMudarMensagem,
}: CamposMensagemProps) {
  return (
    <fieldset className="mt-8 space-y-5 border-0">
      <legend className="rotulo mb-1 text-xs text-tinta-500">Sobre sua mensagem</legend>

      {editais.length > 0 && (
        <Select
          label="Edital relacionado (opcional)"
          hint="Ajuda a resposta a chegar mais rápido."
          value={editalId}
          onChange={(e) => aoMudarEdital(e.target.value)}
          options={editais.map((edital) => ({ value: edital.id, label: edital.titulo }))}
          placeholder="Nenhum edital específico"
        />
      )}

      <Input
        label="Assunto"
        type="text"
        placeholder="Resumo da sua mensagem"
        value={assunto}
        onChange={(e) => aoMudarAssunto(e.target.value)}
        error={erroAssunto}
        required
      />

      <Textarea
        label="Mensagem"
        rows={5}
        placeholder="Descreva sua dúvida ou solicitação com detalhes..."
        value={mensagem}
        onChange={(e) => aoMudarMensagem(e.target.value)}
        error={erroMensagem}
        hint="Mínimo de 10 caracteres."
        required
      />
    </fieldset>
  )
}
