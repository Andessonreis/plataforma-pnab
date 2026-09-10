import { redirect } from 'next/navigation'

/**
 * `/avaliador` não tem tela própria: o painel que existia aqui repetia, agregado
 * e sem contexto de edital, os mesmos números que a seleção de edital de
 * "Minhas Avaliações" já mostra por edital — e essa seleção ainda vai direto
 * pra fila quando o avaliador tem um edital só. A rota fica como entrada do
 * menu e encaminha pro trabalho.
 */
export default function AvaliadorPage() {
  redirect('/avaliador/inscricoes')
}
