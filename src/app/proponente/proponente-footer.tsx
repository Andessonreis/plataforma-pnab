import Image from "next/image";
import Link from "next/link";
import { SeloCidadesInteligentes } from "@/components/marca/selo-cidades-inteligentes";

const colunas = [
  {
    titulo: "Ajuda",
    links: [
      { href: "/contato", label: "Falar com a Secretaria" },
      { href: "/faq", label: "Perguntas frequentes" },
      { href: "/editais", label: "Editais abertos" },
    ],
  },
  {
    titulo: "Informações legais",
    links: [
      { href: "/termos", label: "Termos de uso" },
      { href: "/privacidade", label: "Política de privacidade" },
    ],
  },
];

const classeLink =
  "inline-flex min-h-[44px] items-center text-papel-200 underline-offset-4 hover:text-accent-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400";

/**
 * Rodapé da área logada em tinta escura, a mesma do menu lateral: fecha a
 * página de papel por baixo como a lombada fecha pela esquerda. Identifica
 * quem responde pelo portal e deixa o PNAB como contexto, não como dono da casa.
 *
 * No celular a folga para a barra de abas fixa fica dentro do rodapé, e não na
 * coluna, para não sobrar uma tira de papel embaixo da tinta.
 */
export function ProponenteFooter() {
  const anoAtual = new Date().getFullYear();

  return (
    <footer
      className="mt-12 border-t-2 border-accent-500 bg-tinta-950 px-4 text-papel-200 max-lg:pb-[calc(60px+env(safe-area-inset-bottom))] sm:px-6 lg:px-10"
      role="contentinfo"
    >
      <div className="mx-auto grid max-w-6xl gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_14rem_14rem] lg:gap-12">
        <div className="flex items-start gap-4">
          <Image
            src="/images/secult/simbolo-secult.png"
            alt=""
            width={659}
            height={800}
            className="h-14 w-auto"
            aria-hidden="true"
          />
          <div>
            <p className="titulo text-xl text-papel-50">
              Secretaria de Cultura e Turismo
            </p>
            <p className="text-sm">Prefeitura de Irecê, Bahia</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed">
              Portal de editais e serviços da Secretaria, incluindo a Política
              Nacional Aldir Blanc de Fomento à Cultura (PNAB).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:contents">
          {colunas.map((coluna) => (
            <nav
              key={coluna.titulo}
              aria-label={coluna.titulo}
              className="text-sm"
            >
              <h2 className="rotulo mb-1 text-accent-300">
                {coluna.titulo}
              </h2>
              <ul>
                {coluna.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={classeLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-4 border-t border-papel-50/15 py-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {anoAtual} Prefeitura Municipal de Irecê. Todos os direitos
          reservados.
        </p>
        <SeloCidadesInteligentes fundo="escuro" />
      </div>
    </footer>
  );
}
