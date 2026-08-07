interface UsuarioCadastro {
  nome?: string | null
  telefone?: string | null
  email?: string | null
}

/**
 * Pré-preenche nome/telefone/e-mail do wizard com o que já foi capturado no
 * cadastro do proponente — só quando o edital define um campo com esses
 * nomes convencionados E o valor ainda não está preenchido em `campos`.
 * Usado tanto ao criar (nova) quanto ao continuar (editar) uma inscrição:
 * um rascunho salvo antes de a pessoa chegar na etapa "Dados do Projeto"
 * não tem esses campos ainda, e sem isso ficava sem preenchimento nenhum
 * ao reabrir pra editar.
 */
export function aplicarDadosPessoaisDoCadastro(
  campos: Record<string, unknown>,
  // Aceita o array de campos "cru" vindo do Json do Prisma — mesmo padrão de
  // cast usado no resto do wizard pra esse tipo de dado.
  camposFormulario: unknown[],
  user: UsuarioCadastro | null | undefined,
): Record<string, unknown> {
  const dadosDoCadastro: Record<string, string | undefined> = {
    nome_completo: user?.nome ?? undefined,
    telefone_contato: user?.telefone ?? undefined,
    email_contato: user?.email ?? undefined,
  }
  const camposNomes = new Set(
    camposFormulario.map((c) => (c as { nome?: string }).nome),
  )
  const resultado = { ...campos }
  for (const [nome, valor] of Object.entries(dadosDoCadastro)) {
    if (valor && camposNomes.has(nome) && !resultado[nome]) {
      resultado[nome] = valor
    }
  }
  return resultado
}
