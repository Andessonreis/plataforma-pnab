import { variaveisDeFonte } from '../fontes'

/**
 * Moldura das telas de acesso.
 *
 * `tema-secult` é a paleta da identidade 2025 — a mesma da home e do edital.
 * Sem ela estas telas cairiam no verde padrão dos stops `brand-*`, que não
 * conversa com nenhuma outra página do portal.
 *
 * `variaveisDeFonte` carrega a variável CSS que `.titulo`/`.rotulo` leem
 * (Anton). Sem ela aqui, as duas classes caem no `Impact` do fallback do
 * `font-family` — foi o que aconteceu antes desta faixa de identidade existir.
 *
 * Sem `font-questrial` de propósito, ao contrário das páginas de conteúdo: a
 * Questrial da identidade só existe em peso 400, e um formulário precisa de
 * três pesos para separar rótulo, valor e ação. Pedir `font-semibold` dela faz
 * o navegador engordar o desenho por conta própria, e o resultado é a letra
 * borrada. Aqui vale a Inter que o `<body>` já carrega.
 *
 * Sem cabeçalho e rodapé do portal também de propósito: quem chega aqui está
 * numa tarefa só, e a navegação inteira do site ao redor de um formulário de
 * duas linhas só dá o que errar. A faixa de identidade no topo da própria
 * tela de acesso (não o header do portal) já leva de volta.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className={`tema-secult acesso ${variaveisDeFonte}`}>{children}</div>
}
