import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politica de Privacidade',
  description:
    'Politica de Privacidade do Portal PNAB Irece — Tratamento de dados pessoais conforme a LGPD (Lei 13.709/2018).',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white py-12 sm:py-16">
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Politica de Privacidade
          </h1>
          <p className="text-sm text-slate-500">
            Ultima atualizacao: 01 de marco de 2026
          </p>
        </header>

        {/* Introducao */}
        <section className="mb-8">
          <p className="text-slate-600 leading-relaxed">
            A Secretaria de Arte e Cultura da Prefeitura Municipal de
            Irece/BA, na qualidade de controladora dos dados pessoais
            tratados por meio do Portal da Politica Nacional Aldir Blanc
            (PNAB), apresenta esta Politica de Privacidade em conformidade
            com a Lei Geral de Protecao de Dados Pessoais (LGPD — Lei
            n. 13.709/2018).
          </p>
          <p className="text-slate-600 leading-relaxed mt-4">
            Este documento descreve como coletamos, utilizamos, armazenamos
            e protegemos os dados pessoais dos usuarios do portal, bem como
            os direitos dos titulares de dados e os canais de contato
            disponiveis.
          </p>
        </section>

        {/* Secao 1 — Dados Coletados */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            1. Dados Coletados
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Podemos coletar as seguintes categorias de dados pessoais:
          </p>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">
            1.1. Dados de Cadastro
          </h3>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>Nome completo e nome social (quando informado);</li>
            <li>CPF ou CNPJ;</li>
            <li>Endereco de e-mail;</li>
            <li>Numero de telefone;</li>
            <li>Endereco residencial ou comercial;</li>
            <li>Data de nascimento;</li>
            <li>
              Dados demograficos relevantes para os editais (autodeclaracao
              etnico-racial, genero, pessoa com deficiencia).
            </li>
          </ul>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">
            1.2. Dados de Inscricao em Editais
          </h3>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>Informacoes do projeto cultural (descricao, cronograma, orcamento);</li>
            <li>Documentos comprobatorios (curriculo, portfolio, certidoes);</li>
            <li>Dados bancarios para pagamento de premios ou fomento.</li>
          </ul>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">
            1.3. Dados de Navegacao
          </h3>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>Endereco IP;</li>
            <li>Tipo de navegador e sistema operacional;</li>
            <li>Paginas acessadas e tempo de permanencia;</li>
            <li>Cookies essenciais e de desempenho (veja a secao especifica).</li>
          </ul>
        </section>

        {/* Secao 2 — Finalidade do Tratamento */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            2. Finalidade do Tratamento
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Os dados pessoais sao tratados para as seguintes finalidades:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              Cadastro e autenticacao de usuarios no portal;
            </li>
            <li>
              Gestao de inscricoes em editais de fomento a cultura;
            </li>
            <li>
              Analise de habilitacao e avaliacao de propostas culturais;
            </li>
            <li>
              Comunicacao oficial sobre editais, resultados e recursos;
            </li>
            <li>
              Cumprimento de obrigacoes legais e regulatorias perante orgaos
              de controle;
            </li>
            <li>
              Transparencia publica sobre projetos culturais apoiados
              (publicacao de dados nao sensiveis do proponente e do projeto);
            </li>
            <li>
              Melhoria continua dos servicos do portal por meio de
              estatisticas anonimizadas.
            </li>
          </ul>
        </section>

        {/* Secao 3 — Base Legal */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            3. Base Legal (LGPD — Art. 7)
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            O tratamento de dados pessoais realizado pelo Portal PNAB Irece
            fundamenta-se nas seguintes bases legais previstas no Art. 7 da
            Lei 13.709/2018:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">Execucao de politicas publicas</strong>{' '}
              (Art. 7, III) — A PNAB e uma politica publica federal
              executada pelo municipio, e o tratamento dos dados e necessario
              para sua operacionalizacao;
            </li>
            <li>
              <strong className="text-slate-900">Cumprimento de obrigacao legal</strong>{' '}
              (Art. 7, II) — A prestacao de contas perante orgaos de controle
              (TCM, CGU) exige o registro e a manutencao de dados dos
              proponentes;
            </li>
            <li>
              <strong className="text-slate-900">Consentimento</strong>{' '}
              (Art. 7, I) — Para dados nao obrigatorios e cookies de
              desempenho, o consentimento do titular e solicitado de forma
              livre, informada e inequivoca;
            </li>
            <li>
              <strong className="text-slate-900">Interesse legitimo</strong>{' '}
              (Art. 7, IX) — Para fins estatisticos e de melhoria dos
              servicos, desde que resguardados os direitos fundamentais do
              titular.
            </li>
          </ul>
        </section>

        {/* Secao 4 — Compartilhamento de Dados */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            4. Compartilhamento de Dados
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Os dados pessoais poderao ser compartilhados com:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">Orgaos de controle</strong> — Tribunal de
              Contas dos Municipios (TCM/BA), Controladoria-Geral da Uniao
              (CGU) e Ministerio da Cultura, conforme exigencias legais;
            </li>
            <li>
              <strong className="text-slate-900">Comissoes de avaliacao</strong> — Membros
              designados por portaria para analisar as propostas culturais;
            </li>
            <li>
              <strong className="text-slate-900">Transparencia publica</strong> — Nome do
              proponente, titulo do projeto e valor aprovado serao publicados
              nos resultados oficiais, conforme exigencia de transparencia
              ativa.
            </li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-4">
            Nao comercializamos, alugamos ou compartilhamos dados pessoais
            com terceiros para fins de marketing ou publicidade. Os dados
            nao sao transferidos para fora do territorio brasileiro.
          </p>
        </section>

        {/* Secao 5 — Seguranca dos Dados */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            5. Seguranca dos Dados
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Adotamos medidas tecnicas e administrativas para proteger os
            dados pessoais contra acessos nao autorizados, destruicao,
            perda, alteracao ou vazamento, incluindo:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              Criptografia de senhas com algoritmo bcrypt;
            </li>
            <li>
              Conexoes seguras via HTTPS/TLS;
            </li>
            <li>
              Controle de acesso baseado em funcoes (RBAC) com diferentes
              niveis de permissao;
            </li>
            <li>
              Armazenamento seguro de documentos com URLs assinadas e
              tempo de expiracao;
            </li>
            <li>
              Monitoramento de logs e auditoria de acessos;
            </li>
            <li>
              Validacao e sanitizacao de todas as entradas de dados.
            </li>
          </ul>
        </section>

        {/* Secao 6 — Direitos do Titular */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            6. Direitos do Titular
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Conforme os artigos 17 a 22 da LGPD, o titular dos dados
            pessoais tem direito a:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">Confirmacao e acesso</strong> — Confirmar a
              existencia de tratamento e acessar seus dados;
            </li>
            <li>
              <strong className="text-slate-900">Correcao</strong> — Solicitar a correcao de
              dados incompletos, inexatos ou desatualizados;
            </li>
            <li>
              <strong className="text-slate-900">Anonimizacao, bloqueio ou eliminacao</strong>{' '}
              — Solicitar o tratamento anonimizado, o bloqueio ou a
              eliminacao de dados desnecessarios ou excessivos;
            </li>
            <li>
              <strong className="text-slate-900">Portabilidade</strong> — Solicitar a
              portabilidade dos dados a outro fornecedor de servico;
            </li>
            <li>
              <strong className="text-slate-900">Eliminacao</strong> — Solicitar a eliminacao
              dos dados tratados com base no consentimento;
            </li>
            <li>
              <strong className="text-slate-900">Informacao</strong> — Ser informado sobre
              entidades publicas e privadas com as quais houve
              compartilhamento de dados;
            </li>
            <li>
              <strong className="text-slate-900">Revogacao do consentimento</strong> — Revogar
              o consentimento a qualquer momento, sem prejuizo do
              tratamento ja realizado.
            </li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-4">
            Para exercer seus direitos, entre em contato com o Encarregado
            de Dados (DPO) pelos canais indicados na secao 8 deste
            documento.
          </p>
        </section>

        {/* Secao 7 — Retencao de Dados */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            7. Retencao de Dados
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Os dados pessoais serao armazenados pelo periodo necessario ao
            cumprimento das finalidades para as quais foram coletados,
            observando os seguintes criterios:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">Dados de inscricao em editais</strong> —
              Mantidos por no minimo 10 (dez) anos, conforme exigencia de
              orgaos de controle e prestacao de contas;
            </li>
            <li>
              <strong className="text-slate-900">Dados de cadastro</strong> — Mantidos
              enquanto a conta estiver ativa ou pelo prazo legal de retencao
              aplicavel;
            </li>
            <li>
              <strong className="text-slate-900">Dados de navegacao</strong> — Mantidos por
              ate 12 (doze) meses para fins estatisticos, sendo
              anonimizados apos esse periodo;
            </li>
            <li>
              <strong className="text-slate-900">Dados para transparencia publica</strong> —
              Mantidos por prazo indeterminado, conforme legislacao de
              acesso a informacao (Lei 12.527/2011).
            </li>
          </ul>
        </section>

        {/* Secao 8 — Cookies */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            8. Cookies
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Utilizamos cookies para o funcionamento adequado do portal:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">Cookies essenciais</strong> — Necessarios
              para o funcionamento basico do portal (autenticacao, seguranca,
              preferencias de sessao). Nao requerem consentimento;
            </li>
            <li>
              <strong className="text-slate-900">Cookies de desempenho</strong> — Utilizados
              para coletar estatisticas anonimas de uso. Requerem
              consentimento do usuario.
            </li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-4">
            O usuario pode gerenciar suas preferencias de cookies por meio
            do banner exibido no primeiro acesso ao portal.
          </p>
        </section>

        {/* Secao 9 — Encarregado de Dados (DPO) */}
        <section className="mt-12 rounded-xl bg-slate-50 border border-slate-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            9. Encarregado de Dados (DPO)
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Para questoes relacionadas ao tratamento de dados pessoais,
            incluindo o exercicio dos direitos do titular, entre em contato
            com o Encarregado de Protecao de Dados:
          </p>
          <ul className="space-y-2 text-slate-600">
            <li>
              <strong className="text-slate-900">Orgao responsavel:</strong>{' '}
              Secretaria de Arte e Cultura de Irece
            </li>
            <li>
              <strong className="text-slate-900">E-mail:</strong>{' '}
              <a
                href="mailto:lgpd@irece.ba.gov.br"
                className="text-brand-600 hover:text-brand-700 underline"
              >
                lgpd@irece.ba.gov.br
              </a>
            </li>
            <li>
              <strong className="text-slate-900">E-mail alternativo:</strong>{' '}
              <a
                href="mailto:cultura@irece.ba.gov.br"
                className="text-brand-600 hover:text-brand-700 underline"
              >
                cultura@irece.ba.gov.br
              </a>
            </li>
            <li>
              <strong className="text-slate-900">Telefone:</strong>{' '}
              <a
                href="tel:+557436413116"
                className="text-brand-600 hover:text-brand-700 underline"
              >
                (74) 3641-3116
              </a>
            </li>
            <li>
              <strong className="text-slate-900">Endereco:</strong>{' '}
              Secretaria de Arte e Cultura, Prefeitura Municipal de
              Irece — Irece/BA
            </li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-4">
            O titular tambem podera apresentar reclamacao perante a
            Autoridade Nacional de Protecao de Dados (ANPD) pelo site{' '}
            <a
              href="https://www.gov.br/anpd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:text-brand-700 underline"
            >
              www.gov.br/anpd
            </a>
            .
          </p>
        </section>

        {/* Links relacionados */}
        <nav className="mt-8 flex flex-wrap gap-4 text-sm" aria-label="Paginas relacionadas">
          <Link
            href="/termos"
            className="text-brand-600 hover:text-brand-700 underline"
          >
            Termos de Uso
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
