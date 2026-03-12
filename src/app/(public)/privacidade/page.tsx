import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Política de Privacidade do Portal PNAB Irecê — Tratamento de dados pessoais conforme a LGPD (Lei 13.709/2018).',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white py-12 sm:py-16">
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Política de Privacidade
          </h1>
          <p className="text-sm text-slate-500">
            Última atualização: 01 de março de 2026
          </p>
        </header>

        {/* Introducao */}
        <section className="mb-8">
          <p className="text-slate-600 leading-relaxed">
            A Secretaria de Arte e Cultura da Prefeitura Municipal de
            Irecê/BA, na qualidade de controladora dos dados pessoais
            tratados por meio do Portal da Política Nacional Aldir Blanc
            (PNAB), apresenta esta Política de Privacidade em conformidade
            com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei
            n. 13.709/2018).
          </p>
          <p className="text-slate-600 leading-relaxed mt-4">
            Este documento descreve como coletamos, utilizamos, armazenamos
            e protegemos os dados pessoais dos usuários do portal, bem como
            os direitos dos titulares de dados e os canais de contato
            disponíveis.
          </p>
        </section>

        {/* Seção 1 — Dados Coletados */}
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
            <li>Endereço de e-mail;</li>
            <li>Número de telefone;</li>
            <li>Endereço residencial ou comercial;</li>
            <li>Data de nascimento;</li>
            <li>
              Dados demográficos relevantes para os editais (autodeclaracao
              étnico-racial, gênero, pessoa com deficiência).
            </li>
          </ul>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">
            1.2. Dados de Inscrição em Editais
          </h3>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>Informacoes do projeto cultural (descrição, cronograma, orçamento);</li>
            <li>Documentos comprobatórios (currículo, portfolio, certidoes);</li>
            <li>Dados bancários para pagamento de prêmios ou fomento.</li>
          </ul>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">
            1.3. Dados de Navegação
          </h3>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>Endereço IP;</li>
            <li>Tipo de navegador e sistema operacional;</li>
            <li>Páginas acessadas e tempo de permanencia;</li>
            <li>Cookies essenciais e de desempenho (veja a seção especifica).</li>
          </ul>
        </section>

        {/* Seção 2 — Finalidade do Tratamento */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            2. Finalidade do Tratamento
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Os dados pessoais são tratados para as seguintes finalidades:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              Cadastro e autenticação de usuários no portal;
            </li>
            <li>
              Gestao de inscrições em editais de fomento a cultura;
            </li>
            <li>
              Análise de habilitacao e avaliação de propostas culturais;
            </li>
            <li>
              Comunicação oficial sobre editais, resultados e recursos;
            </li>
            <li>
              Cumprimento de obrigações legais e regulatórias perante órgãos
              de controle;
            </li>
            <li>
              Transparência pública sobre projetos culturais apoiados
              (públicacao de dados não sensiveis do proponente e do projeto);
            </li>
            <li>
              Melhoria contínua dos servicos do portal por meio de
              estatísticas anonimizadas.
            </li>
          </ul>
        </section>

        {/* Seção 3 — Base Legal */}
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
              <strong className="text-slate-900">Execução de políticas públicas</strong>{' '}
              (Art. 7, III) — A PNAB é uma política pública federal
              executada pelo município, e o tratamento dos dados e necessário
              para sua operacionalização;
            </li>
            <li>
              <strong className="text-slate-900">Cumprimento de obrigação legal</strong>{' '}
              (Art. 7, II) — A prestação de contas perante órgãos de controle
              (TCM, CGU) exige o registro e a manutenção de dados dos
              proponentes;
            </li>
            <li>
              <strong className="text-slate-900">Consentimento</strong>{' '}
              (Art. 7, I) — Para dados não obrigatorios e cookies de
              desempenho, o consentimento do titular e solicitado de forma
              livre, informada e inequívoca;
            </li>
            <li>
              <strong className="text-slate-900">Interesse legítimo</strong>{' '}
              (Art. 7, IX) — Para fins estatisticos e de melhoria dos
              servicos, desde que resguardados os direitos fundamentais do
              titular.
            </li>
          </ul>
        </section>

        {/* Seção 4 — Compartilhamento de Dados */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            4. Compartilhamento de Dados
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Os dados pessoais poderao ser compartilhados com:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">Órgãos de controle</strong> — Tribunal de
              Contas dos Municípios (TCM/BA), Controladoria-Geral da União
              (CGU) e Ministério da Cultura, conforme exigencias legais;
            </li>
            <li>
              <strong className="text-slate-900">Comissões de avaliação</strong> — Membros
              designados por portaria para analisar as propostas culturais;
            </li>
            <li>
              <strong className="text-slate-900">Transparência pública</strong> — Nome do
              proponente, título do projeto e valor aprovado serao públicados
              nos resultados oficiais, conforme exigencia de transparência
              ativa.
            </li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-4">
            Não comercializamos, alugamos ou compartilhamos dados pessoais
            com terceiros para fins de marketing ou publicidade. Os dados
            não são transferidos para fora do territorio brasileiro.
          </p>
        </section>

        {/* Seção 5 — Segurança dos Dados */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            5. Segurança dos Dados
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Adotamos medidas tecnicas e administrativas para proteger os
            dados pessoais contra acessos não autorizados, destruição,
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
              Controle de acesso baseado em funções (RBAC) com diferentes
              níveis de permissão;
            </li>
            <li>
              Armazenamento seguro de documentos com URLs assinadas e
              tempo de expiração;
            </li>
            <li>
              Monitoramento de logs e auditoria de acessos;
            </li>
            <li>
              Validacao e sanitizacao de todas as entradas de dados.
            </li>
          </ul>
        </section>

        {/* Seção 6 — Direitos do Titular */}
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
              <strong className="text-slate-900">Confirmação e acesso</strong> — Confirmar a
              existencia de tratamento e acessar seus dados;
            </li>
            <li>
              <strong className="text-slate-900">Correção</strong> — Solicitar a correção de
              dados incompletos, inexatos ou desatualizados;
            </li>
            <li>
              <strong className="text-slate-900">Anonimização, bloqueio ou eliminação</strong>{' '}
              — Solicitar o tratamento anonimizado, o bloqueio ou a
              eliminação de dados desnecessários ou excessivos;
            </li>
            <li>
              <strong className="text-slate-900">Portabilidade</strong> — Solicitar a
              portabilidade dos dados a outro fornecedor de servico;
            </li>
            <li>
              <strong className="text-slate-900">Eliminação</strong> — Solicitar a eliminação
              dos dados tratados com base no consentimento;
            </li>
            <li>
              <strong className="text-slate-900">Informação</strong> — Ser informado sobre
              entidades públicas e privadas com as quais houve
              compartilhamento de dados;
            </li>
            <li>
              <strong className="text-slate-900">Revogação do consentimento</strong> — Revogar
              o consentimento a qualquer momento, sem prejuízo do
              tratamento ja realizado.
            </li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-4">
            Para exercer seus direitos, entre em contato com o Encarregado
            de Dados (DPO) pelos canais indicados na seção 8 deste
            documento.
          </p>
        </section>

        {/* Seção 7 — Retenção de Dados */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            7. Retenção de Dados
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Os dados pessoais serao armazenados pelo periodo necessário ao
            cumprimento das finalidades para as quais foram coletados,
            observando os seguintes critérios:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">Dados de inscrição em editais</strong> —
              Mantidos por no mínimo 10 (dez) anos, conforme exigencia de
              órgãos de controle e prestação de contas;
            </li>
            <li>
              <strong className="text-slate-900">Dados de cadastro</strong> — Mantidos
              enquanto a conta estiver ativa ou pelo prazo legal de retenção
              aplicável;
            </li>
            <li>
              <strong className="text-slate-900">Dados de navegação</strong> — Mantidos por
              ate 12 (doze) meses para fins estatisticos, sendo
              anonimizados apos esse periodo;
            </li>
            <li>
              <strong className="text-slate-900">Dados para transparência pública</strong> —
              Mantidos por prazo indeterminado, conforme legislacao de
              acesso a informação (Lei 12.527/2011).
            </li>
          </ul>
        </section>

        {/* Seção 8 — Cookies */}
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
              para o funcionamento básico do portal (autenticação, segurança,
              preferências de sessao). Não requerem consentimento;
            </li>
            <li>
              <strong className="text-slate-900">Cookies de desempenho</strong> — Utilizados
              para coletar estatísticas anonimas de uso. Requerem
              consentimento do usuário.
            </li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-4">
            O usuário pode gerenciar suas preferências de cookies por meio
            do banner exibido no primeiro acesso ao portal.
          </p>
        </section>

        {/* Seção 9 — Encarregado de Dados (DPO) */}
        <section className="mt-12 rounded-xl bg-slate-50 border border-slate-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            9. Encarregado de Dados (DPO)
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Para questoes relacionadas ao tratamento de dados pessoais,
            incluindo o exercicio dos direitos do titular, entre em contato
            com o Encarregado de Proteção de Dados:
          </p>
          <ul className="space-y-2 text-slate-600">
            <li>
              <strong className="text-slate-900">Órgão responsável:</strong>{' '}
              Secretaria de Arte e Cultura de Irecê
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
              <strong className="text-slate-900">Endereço:</strong>{' '}
              Secretaria de Arte e Cultura, Prefeitura Municipal de
              Irecê — Irecê/BA
            </li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-4">
            O titular também podera apresentar reclamação perante a
            Autoridade Nacional de Proteção de Dados (ANPD) pelo site{' '}
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
        <nav className="mt-8 flex flex-wrap gap-4 text-sm" aria-label="Páginas relacionadas">
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
