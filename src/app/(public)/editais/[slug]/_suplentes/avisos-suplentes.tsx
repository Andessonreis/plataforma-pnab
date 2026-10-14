import Link from 'next/link'
import { FaixaSecao } from '@/components/ui/faixa-secao'
import { IconArrowLeft } from '@/components/ui/icons'
import type { SuplentesEdital } from './consulta'

interface AvisoProps {
  dados: SuplentesEdital
}

export function AvisoIndisponivelSuplentes({ dados }: AvisoProps) {
  return (
    <FaixaSecao id="suplentes-aguardando" cartela="Aguardando Publicação" cor="papel" corCartela="terracota">
      <div className="max-w-2xl space-y-4">
        <h3 className="titulo text-2xl text-tinta-900">Ainda não publicado</h3>
        <p className="leading-relaxed text-tinta-700">
          A relação de proponentes suplentes convocados para este edital aguarda publicação oficial.
          Assim que for publicada no Diário Oficial do Município, a lista completa com todas as categorias
          ficará disponível nesta página.
        </p>
        <div className="pt-2">
          <Link
            href={`/editais/${dados.slug}`}
            className="inline-flex min-h-[44px] items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 underline-offset-4 hover:underline"
          >
            <IconArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Voltar ao edital
          </Link>
        </div>
      </div>
    </FaixaSecao>
  )
}

export function ComoFuncionaSuplentes() {
  return (
    <FaixaSecao id="orientacoes-suplentes" cartela="Orientações aos Suplentes" cor="papel-forte" corCartela="terracota">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="titulo text-xl text-tinta-900">Prazo e Local de Habilitação Documental</h3>
          <p className="text-sm leading-relaxed text-tinta-700">
            Os proponentes suplentes convocados devem comparecer presencialmente à sede da{' '}
            <strong>Secretaria Municipal de Cultura e Turismo de Irecê (SECULT)</strong> para a entrega da
            documentação de habilitação e assinatura do Termo de Execução Cultural (TEC).
          </p>
          <div className="border-l-4 border-l-terracota-700 bg-papel-50 p-4 text-sm text-tinta-900 shadow-sm">
            <p className="font-bold">Dias de comparecimento:</p>
            <p className="mt-1 text-base font-semibold text-terracota-800">
              15 e 16 de outubro de 2026
            </p>
            <p className="mt-2 text-xs text-tinta-700">
              Horários: das <strong>08:30 às 11:30h</strong> e das <strong>14:00 às 16:30h</strong>
            </p>
            <p className="mt-1 text-xs text-tinta-600">
              Local: Praça Teotônio Marques Dourado Filho, S/N (Praça da antiga Prefeitura), Irecê/BA.
            </p>
          </div>
          <p className="text-xs text-tinta-600">
            * O não comparecimento do contemplado no prazo regulamentar incidirá na desclassificação do certame e
            na convocação do suplente subsequente, conforme item 1 do Diário Oficial.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="titulo text-xl text-tinta-900">Documentação Exigida</h3>
          <div className="space-y-3 text-sm text-tinta-800">
            <div>
              <p className="font-bold text-tinta-900">Pessoa Física ou Coletivo sem CNPJ:</p>
              <ul className="mt-1 list-disc pl-5 space-y-1 text-xs text-tinta-700">
                <li>Dados bancários de conta corrente específica com extrato de saldo zerado;</li>
                <li>Documento oficial com foto (RG, CNH ou equivalente com CPF);</li>
                <li>Certidão Negativa Federal e Dívida Ativa da União;</li>
                <li>Certidões Negativas Estadual e Municipal;</li>
                <li>Certidão Negativa de Débitos Trabalhistas (CNDT);</li>
                <li>Comprovante de residência nominal ou declaração assinada pelo titular.</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-tinta-900">Pessoa Jurídica:</p>
              <ul className="mt-1 list-disc pl-5 space-y-1 text-xs text-tinta-700">
                <li>Conta corrente bancária da PJ com saldo zerado;</li>
                <li>Comprovante de CNPJ e Ato Constitutivo (Contrato Social ou Estatuto);</li>
                <li>Documentos do representante legal e Certidões de Falência, FGTS, CNDT e Tributárias.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </FaixaSecao>
  )
}
