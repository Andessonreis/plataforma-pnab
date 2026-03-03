import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description:
    'Termos e condições de uso do Portal PNAB Irecê — Secretaria de Arte e Cultura de Irecê/BA.',
}

export default function TermsOfUsePage() {
  return (
    <div className="bg-white py-12 sm:py-16">
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Termos de Uso
          </h1>
          <p className="text-sm text-slate-500">
            Ultima atualizacao: 01 de marco de 2026
          </p>
        </header>

        {/* Introducao */}
        <section className="mb-8">
          <p className="text-slate-600 leading-relaxed">
            Bem-vindo ao Portal da Politica Nacional Aldir Blanc (PNAB) do
            municipio de Irece/BA. Este portal e mantido pela Secretaria de
            Arte e Cultura da Prefeitura Municipal de Irece e tem como
            finalidade viabilizar o acesso a editais de fomento a cultura,
            inscricoes de projetos culturais e a transparencia dos resultados.
          </p>
          <p className="text-slate-600 leading-relaxed mt-4">
            Ao acessar e utilizar este portal, voce concorda com os presentes
            Termos de Uso. Caso nao concorde com alguma das condicoes aqui
            estabelecidas, recomendamos que nao utilize os servicos
            disponibilizados.
          </p>
        </section>

        {/* Secao 1 — Aceitacao dos Termos */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            1. Aceitacao dos Termos
          </h2>
          <p className="text-slate-600 leading-relaxed">
            O uso do Portal PNAB Irece implica a aceitacao integral e
            irrestrita de todos os itens destes Termos de Uso, em sua versao
            mais recente. A Secretaria de Arte e Cultura reserva-se o direito
            de atualizar estes termos a qualquer momento, sendo
            responsabilidade do usuario consultar esta pagina periodicamente.
          </p>
        </section>

        {/* Secao 2 — Uso do Portal */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            2. Uso do Portal
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            O Portal PNAB Irece destina-se a:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              Publicacao e consulta de editais de fomento a cultura no ambito
              da Politica Nacional Aldir Blanc;
            </li>
            <li>
              Cadastro de proponentes (pessoas fisicas, juridicas e coletivos
              culturais) para submissao de projetos;
            </li>
            <li>
              Inscricao, acompanhamento e gestao de propostas culturais;
            </li>
            <li>
              Divulgacao de resultados, habilitacoes e recursos;
            </li>
            <li>
              Transparencia publica sobre projetos apoiados e valores
              destinados.
            </li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-4">
            O usuario compromete-se a utilizar o portal de forma licita,
            respeitando a legislacao vigente, a moral, os bons costumes e a
            ordem publica. E vedado o uso do portal para fins ilegais,
            fraudulentos ou que possam causar danos a terceiros ou ao
            municipio de Irece.
          </p>
        </section>

        {/* Secao 3 — Cadastro e Conta do Usuario */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            3. Cadastro e Conta do Usuario
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Para utilizar funcionalidades restritas do portal (como inscrever
            projetos em editais), o usuario devera criar uma conta
            fornecendo informacoes verdadeiras e atualizadas, incluindo CPF ou
            CNPJ conforme aplicavel.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              O usuario e responsavel pela veracidade de todas as informacoes
              fornecidas no cadastro e nas inscricoes;
            </li>
            <li>
              A senha de acesso e pessoal e intransferivel, cabendo ao usuario
              sua guarda e sigilo;
            </li>
            <li>
              A Secretaria podera suspender ou cancelar contas que apresentem
              informacoes falsas, incompletas ou que violem estes Termos;
            </li>
            <li>
              O usuario deve comunicar imediatamente qualquer uso nao
              autorizado de sua conta.
            </li>
          </ul>
        </section>

        {/* Secao 4 — Propriedade Intelectual */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            4. Propriedade Intelectual
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Todo o conteudo disponibilizado neste portal — incluindo textos,
            imagens, logotipos, layouts, codigos-fonte e demais elementos
            visuais — e de propriedade da Prefeitura Municipal de Irece ou
            de seus respectivos titulares, sendo protegido pela legislacao
            brasileira de propriedade intelectual.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              E proibida a reproducao, distribuicao ou modificacao do conteudo
              do portal sem autorizacao previa;
            </li>
            <li>
              Os projetos culturais submetidos pelos proponentes permanecem de
              autoria de seus respectivos titulares, ressalvado o direito de
              divulgacao pela Secretaria para fins de transparencia publica;
            </li>
            <li>
              Os documentos oficiais dos editais (regulamentos, anexos e
              modelos) podem ser baixados e utilizados exclusivamente para fins
              de inscricao.
            </li>
          </ul>
        </section>

        {/* Secao 5 — Responsabilidades */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            5. Responsabilidades
          </h2>
          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">
            5.1. Da Secretaria de Arte e Cultura
          </h3>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              Manter o portal disponivel e funcional, ressalvadas
              interrupcoes para manutencao ou por motivos de forca maior;
            </li>
            <li>
              Garantir a seguranca dos dados pessoais conforme a Lei Geral de
              Protecao de Dados (LGPD — Lei 13.709/2018);
            </li>
            <li>
              Divulgar informacoes oficiais e atualizadas sobre os editais e
              seus resultados.
            </li>
          </ul>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">
            5.2. Do Usuario
          </h3>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              Fornecer informacoes verdadeiras, completas e atualizadas;
            </li>
            <li>
              Manter a confidencialidade de suas credenciais de acesso;
            </li>
            <li>
              Respeitar os prazos estabelecidos nos editais;
            </li>
            <li>
              Nao tentar acessar areas restritas do sistema sem autorizacao;
            </li>
            <li>
              Responder por quaisquer danos decorrentes do uso indevido do
              portal.
            </li>
          </ul>
        </section>

        {/* Secao 6 — Limitacao de Responsabilidade */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            6. Limitacao de Responsabilidade
          </h2>
          <p className="text-slate-600 leading-relaxed">
            A Secretaria de Arte e Cultura nao se responsabiliza por danos
            decorrentes de interrupcoes temporarias no acesso ao portal,
            falhas tecnicas, ataques ciberneticos ou eventos de forca maior.
            O portal e fornecido &ldquo;como esta&rdquo;, sem garantias de
            disponibilidade ininterrupta. Recomenda-se que o usuario nao
            deixe para realizar inscricoes nos ultimos momentos antes do
            encerramento dos prazos.
          </p>
        </section>

        {/* Secao 7 — Alteracoes nos Termos */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            7. Alteracoes nos Termos
          </h2>
          <p className="text-slate-600 leading-relaxed">
            A Secretaria de Arte e Cultura podera modificar estes Termos de
            Uso a qualquer tempo. As alteracoes entrarao em vigor na data de
            sua publicacao nesta pagina. O uso continuado do portal apos a
            publicacao de alteracoes implica a aceitacao dos novos termos.
            Recomendamos a consulta periodica desta pagina.
          </p>
        </section>

        {/* Secao 8 — Foro */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            8. Foro
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Fica eleito o foro da Comarca de Irece, Estado da Bahia, para
            dirimir quaisquer questoes oriundas da utilizacao deste portal,
            com renuncia expressa a qualquer outro, por mais privilegiado que
            seja.
          </p>
        </section>

        {/* Contato */}
        <section className="mt-12 rounded-xl bg-slate-50 border border-slate-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Contato
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Para duvidas ou solicitacoes relacionadas a estes Termos de Uso,
            entre em contato:
          </p>
          <ul className="space-y-2 text-slate-600">
            <li>
              <strong className="text-slate-900">Secretaria de Arte e Cultura de Irece</strong>
            </li>
            <li>
              E-mail:{' '}
              <a
                href="mailto:cultura@irece.ba.gov.br"
                className="text-brand-600 hover:text-brand-700 underline"
              >
                cultura@irece.ba.gov.br
              </a>
            </li>
            <li>
              Telefone:{' '}
              <a
                href="tel:+557436413116"
                className="text-brand-600 hover:text-brand-700 underline"
              >
                (74) 3641-3116
              </a>
            </li>
          </ul>
        </section>

        {/* Links relacionados */}
        <nav className="mt-8 flex flex-wrap gap-4 text-sm" aria-label="Paginas relacionadas">
          <Link
            href="/privacidade"
            className="text-brand-600 hover:text-brand-700 underline"
          >
            Politica de Privacidade
          </Link>
          <Link
            href="/acessibilidade"
            className="text-brand-600 hover:text-brand-700 underline"
          >
            Acessibilidade
          </Link>
        </nav>
      </article>
    </div>
  )
}
