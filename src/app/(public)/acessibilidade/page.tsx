import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Acessibilidade',
  description:
    'Declaração de acessibilidade do Portal PNAB Irecê — Conformidade com WCAG 2.1 AA e recursos disponíveis.',
}

export default function AccessibilityPage() {
  return (
    <div className="bg-white py-12 sm:py-16">
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Acessibilidade
          </h1>
          <p className="text-sm text-slate-500">
            Última atualização: 01 de março de 2026
          </p>
        </header>

        {/* Introducao */}
        <section className="mb-8">
          <p className="text-slate-600 leading-relaxed">
            O Portal da Política Nacional Aldir Blanc (PNAB) de Irecê tem o
            compromisso de garantir o acesso a informação e aos servicos
            públicos para todas as pessoas, incluindo pessoas com
            deficiência. Este portal foi desenvolvido em conformidade com as
            diretrizes de acessibilidade WCAG 2.1 nivel AA (Web Content
            Accessibility Guidelines) e com o Modelo de Acessibilidade em
            Governo Eletrônico (eMAG).
          </p>
          <p className="text-slate-600 leading-relaxed mt-4">
            A acessibilidade digital e um direito assegurado pela Lei
            Brasileira de Inclusão (Lei 13.146/2015) e pelo Decreto
            5.296/2004. Trabalhamos contínuamente para aprimorar a
            experiência de todos os usuários.
          </p>
        </section>

        {/* Seção 1 — Recursos Disponíveis */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            1. Recursos de Acessibilidade Disponíveis
          </h2>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">
            1.1. VLibras — Tradução em Libras
          </h3>
          <p className="text-slate-600 leading-relaxed">
            O portal conta com a ferramenta VLibras, do Governo Federal,
            que traduz o conteúdo do site para a Língua Brasileira de Sinais
            (Libras). O widget do VLibras esta disponível em todas as
            páginas públicas. Para utiliza-lo, clique no ícone do VLibras
            que aparece na tela e selecione o conteúdo que deseja traduzir.
          </p>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">
            1.2. Ajuste de Tamanho de Fonte
          </h3>
          <p className="text-slate-600 leading-relaxed">
            Na barra superior do portal, estao disponíveis os botões
            &ldquo;A+&rdquo; e &ldquo;A-&rdquo; que permitem aumentar e
            diminuir o tamanho do texto para facilitar a leitura. Voce
            também pode utilizar os atalhos do navegador:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed mt-2">
            <li>
              <strong className="text-slate-900">Aumentar:</strong> Ctrl + (mais) ou Cmd + (mais) no Mac;
            </li>
            <li>
              <strong className="text-slate-900">Diminuir:</strong> Ctrl - (menos) ou Cmd - (menos) no Mac;
            </li>
            <li>
              <strong className="text-slate-900">Restaurar:</strong> Ctrl 0 ou Cmd 0 no Mac.
            </li>
          </ul>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">
            1.3. Alto Contraste
          </h3>
          <p className="text-slate-600 leading-relaxed">
            O botao &ldquo;Contraste&rdquo; na barra superior ativa o modo
            de alto contraste, melhorando a visibilidade do conteúdo para
            pessoas com baixa visao. Todo o texto do portal atende ao
            requisito mínimo de contraste de 4.5:1 para texto normal e
            3:1 para texto grande (WCAG AA).
          </p>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">
            1.4. Navegação por Teclado
          </h3>
          <p className="text-slate-600 leading-relaxed">
            Todo o conteúdo do portal pode ser acessado utilizando apenas o
            teclado. Utilize as seguintes teclas:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed mt-2">
            <li>
              <strong className="text-slate-900">Tab:</strong> Avanca para o
              próximo elemento interativo;
            </li>
            <li>
              <strong className="text-slate-900">Shift + Tab:</strong> Retorna
              ao elemento anterior;
            </li>
            <li>
              <strong className="text-slate-900">Enter:</strong> Ativa links e
              botões;
            </li>
            <li>
              <strong className="text-slate-900">Escape:</strong> Fecha modais
              e menus;
            </li>
            <li>
              <strong className="text-slate-900">Setas:</strong> Navega entre
              opções em menus e listas.
            </li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-4">
            Todos os elementos interativos possuem indicador de foco
            visivel (focus ring) para facilitar a identificacao durante a
            navegação por teclado.
          </p>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">
            1.5. Semântica e Estrutura
          </h3>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              Hierarquia correta de títulos (h1, h2, h3) em todas as páginas;
            </li>
            <li>
              Uso de marcos semânticos (header, nav, main, footer) para
              facilitar a navegação com leitores de tela;
            </li>
            <li>
              Textos alternativos (alt) em todas as imagens informativas;
            </li>
            <li>
              Formularios com labels associados e mensagens de erro claras;
            </li>
            <li>
              Areas de toque com dimensão minima de 44x44 pixels.
            </li>
          </ul>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">
            1.6. Leitores de Tela
          </h3>
          <p className="text-slate-600 leading-relaxed">
            O portal foi desenvolvido com marcação semântica e atributos
            ARIA para compatibilidade com os principais leitores de tela,
            incluindo NVDA, JAWS e VoiceOver. Modais utilizam atributos
            como role=&ldquo;dialog&rdquo;, aria-modal e gerenciamento de
            foco (focus trap).
          </p>
        </section>

        {/* Seção 2 — Conformidade */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            2. Conformidade
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Este portal busca atender integralmente os seguintes padroes:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">WCAG 2.1 nivel AA</strong>{' '}
              — Diretrizes internacionais de acessibilidade para conteúdo
              web, públicadas pelo W3C;
            </li>
            <li>
              <strong className="text-slate-900">eMAG 3.1</strong>{' '}
              — Modelo de Acessibilidade em Governo Eletrônico, padrao do
              Governo Federal brasileiro;
            </li>
            <li>
              <strong className="text-slate-900">Lei 13.146/2015</strong>{' '}
              — Lei Brasileira de Inclusão da Pessoa com Deficiencia
              (Estatuto da Pessoa com Deficiência);
            </li>
            <li>
              <strong className="text-slate-900">Decreto 5.296/2004</strong>{' '}
              — Regulamenta a acessibilidade em portais e sítios eletrônicos
              da administracao pública.
            </li>
          </ul>
        </section>

        {/* Seção 3 — Limitações Conhecidas */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
            3. Limitações Conhecidas
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Embora trabalhemos contínuamente para melhorar a acessibilidade,
            algumas limitações podem existir:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            <li>
              Documentos PDF de editais podem não estar totalmente
              acessíveis — disponibilizamos versoes alternativas em HTML
              sempre que possivel;
            </li>
            <li>
              Conteudos de terceiros (como widgets externos) podem nao
              atender integralmente aos padroes de acessibilidade;
            </li>
            <li>
              Melhorias são implementadas de forma contínua a cada
              atualização do portal.
            </li>
          </ul>
        </section>

        {/* Seção 4 — Contato para Acessibilidade */}
        <section className="mt-12 rounded-xl bg-slate-50 border border-slate-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            4. Contato para Acessibilidade
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Se você encontrar alguma barreira de acessibilidade neste portal
            ou tiver sugestoes de melhoria, entre em contato conosco.
            Valorizamos seu retorno e estamos comprometidos em resolver
            qualquer problema de acessibilidade no menor prazo possivel.
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
            <li>
              Assunto do e-mail: <em>&ldquo;Acessibilidade — Portal PNAB&rdquo;</em>
            </li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-4">
            Ao reportar um problema, por favor inclua a descrição da
            dificuldade encontrada, a página onde ocorreu e o dispositivo
            ou tecnologia assistiva utilizada. Nos comprometemos a
            responder em ate 5 (cinco) dias úteis.
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
            href="/privacidade"
            className="text-brand-600 hover:text-brand-700 underline"
          >
            Política de Privacidade
          </Link>
        </nav>
      </article>
    </div>
  )
}
