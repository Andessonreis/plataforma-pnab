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
            Última atualização: 01 de março de 2026
          </p>
        </header>

        {/* Introducao */}
        <section className="mb-8">
          <p className="text-slate-600 leading-relaxed">
            Bem-vindo ao Portal da Política Nacional Aldir Blanc (PNAB) do
            município de Irecê/BA. Este portal é mantido pela Secretaria de
            Arte e Cultura da Prefeitura Municipal de Irecê e tem como
            finalidade viabilizar o acesso a editais de fomento a cultura,
            inscrições de projetos culturais e a transparência dos resultados.
          </p>
          <p className="text-slate-600 leading-relaxed mt-4">
            Ao acessar e utilizar este portal, você concorda com os presentes
            Termos de Uso. Caso não concorde com alguma das condições aqui
            estabelecidas, recomendamos que não utilize os servicos
            disponibilizados.
          </p>
        </section>

        {/* Seção 1 — Aceitação dos Termos */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            1. Aceitação dos Termos
          </h2>
          <p className="text-slate-600 leading-relaxed">
            O uso do Portal PNAB Irecê implica a aceitação integral e
            irrestrita de todos os itens destes Termos de Uso, em sua versão
            mais recente. A Secretaria de Arte e Cultura reserva-se o direito
            de atualizar estes termos a qualquer momento, sendo
            responsabilidade do usuário consultar esta página periodicamente.
          </p>
        </section>

        {/* Seção 2 — Uso do Portal */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            2. Uso do Portal
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            O Portal PNAB Irecê destina-se a:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              Públicacao e consulta de editais de fomento a cultura no ambito
              da Política Nacional Aldir Blanc;
            </li>
            <li>
              Cadastro de proponentes (pessoas físicas, jurídicas e coletivos
              culturais) para submissao de projetos;
            </li>
            <li>
              Inscricao, acompanhamento e gestao de propostas culturais;
            </li>
            <li>
              Divulgacao de resultados, habilitações e recursos;
            </li>
            <li>
              Transparência pública sobre projetos apoiados e valores
              destinados.
            </li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-4">
            O usuário compromete-se a utilizar o portal de forma licita,
            respeitando a legislacao vigente, a moral, os bons costumes e a
            ordem pública. É vedado o uso do portal para fins ilegais,
            fraudulentos ou que possam causar danos a terceiros ou ao
            município de Irecê.
          </p>
        </section>

        {/* Seção 3 — Cadastro e Conta do Usuário */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            3. Cadastro e Conta do Usuário
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Para utilizar funcionalidades restritas do portal (como inscrever
            projetos em editais), o usuário devera criar uma conta
            fornecendo informações verdadeiras e atualizadas, incluindo CPF ou
            CNPJ conforme aplicável.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              O usuário e responsável pela veracidade de todas as informações
              fornecidas no cadastro e nas inscrições;
            </li>
            <li>
              A senha de acesso é pessoal e intransferivel, cabendo ao usuário
              sua guarda e sigilo;
            </li>
            <li>
              A Secretaria podera suspender ou cancelar contas que apresentem
              informações falsas, incompletas ou que violem estes Termos;
            </li>
            <li>
              O usuário deve comunicar imediatamente qualquer uso nao
              autorizado de sua conta.
            </li>
          </ul>
        </section>

        {/* Seção 4 — Propriedade Intelectual */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            4. Propriedade Intelectual
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Todo o conteúdo disponibilizado neste portal — incluindo textos,
            imagens, logotipos, layouts, códigos-fonte e demais elementos
            visuais — e de propriedade da Prefeitura Municipal de Irecê ou
            de seus respectivos titulares, sendo protegido pela legislacao
            brasileira de propriedade intelectual.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              É proibida a reprodução, distribuição ou modificação do conteúdo
              do portal sem autorização previa;
            </li>
            <li>
              Os projetos culturais submetidos pelos proponentes permanecem de
              autoria de seus respectivos titulares, ressalvado o direito de
              divulgação pela Secretaria para fins de transparência pública;
            </li>
            <li>
              Os documentos oficiais dos editais (regulamentos, anexos e
              modelos) podem ser baixados e utilizados exclusivamente para fins
              de inscrição.
            </li>
          </ul>
        </section>

        {/* Seção 5 — Responsabilidades */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            5. Responsabilidades
          </h2>
          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">
            5.1. Da Secretaria de Arte e Cultura
          </h3>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              Manter o portal disponível e funcional, ressalvadas
              interrupções para manutenção ou por motivos de forca maior;
            </li>
            <li>
              Garantir a segurança dos dados pessoais conforme a Lei Geral de
              Proteção de Dados (LGPD — Lei 13.709/2018);
            </li>
            <li>
              Divulgar informações oficiais e atualizadas sobre os editais e
              seus resultados.
            </li>
          </ul>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">
            5.2. Do Usuário
          </h3>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              Fornecer informações verdadeiras, completas e atualizadas;
            </li>
            <li>
              Manter a confidencialidade de suas credenciais de acesso;
            </li>
            <li>
              Respeitar os prazos estabelecidos nos editais;
            </li>
            <li>
              Não tentar acessar areas restritas do sistema sem autorização;
            </li>
            <li>
              Responder por quaisquer danos decorrentes do uso indevido do
              portal.
            </li>
          </ul>
        </section>

        {/* Seção 6 — Limitação de Responsabilidade */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            6. Limitação de Responsabilidade
          </h2>
          <p className="text-slate-600 leading-relaxed">
            A Secretaria de Arte e Cultura não se responsabiliza por danos
            decorrentes de interrupções temporarias no acesso ao portal,
            falhas tecnicas, ataques cibernéticos ou eventos de forca maior.
            O portal é fornecido &ldquo;como esta&rdquo;, sem garantias de
            disponibilidade ininterrupta. Recomenda-se que o usuário nao
            deixe para realizar inscrições nos últimos momentos antes do
            encerramento dos prazos.
          </p>
        </section>

        {/* Seção 7 — Alterações nos Termos */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            7. Alterações nos Termos
          </h2>
          <p className="text-slate-600 leading-relaxed">
            A Secretaria de Arte e Cultura podera modificar estes Termos de
            Uso a qualquer tempo. As alterações entrarao em vigor na data de
            sua públicacao nesta página. O uso contínuado do portal apos a
            públicacao de alterações implica a aceitação dos novos termos.
            Recomendamos a consulta periodica desta página.
          </p>
        </section>

        {/* Seção 8 — Foro */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            8. Foro
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Fica eleito o foro da Comarca de Irecê, Estado da Bahia, para
            dirimir quaisquer questoes oriundas da utilização deste portal,
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
            Para dúvidas ou solicitações relacionadas a estes Termos de Uso,
            entre em contato:
          </p>
          <ul className="space-y-2 text-slate-600">
            <li>
              <strong className="text-slate-900">Secretaria de Arte e Cultura de Irecê</strong>
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
        <nav className="mt-8 flex flex-wrap gap-4 text-sm" aria-label="Páginas relacionadas">
          <Link
            href="/privacidade"
            className="text-brand-600 hover:text-brand-700 underline"
          >
            Política de Privacidade
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
