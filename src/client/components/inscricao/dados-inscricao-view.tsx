import type { ReactNode } from 'react'
import type { TipoProponente } from '@prisma/client'
import type { CampoFormulario } from '@/types/campo-formulario'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import { CampoEstruturaRevisao } from '@/app/proponente/inscricoes/nova/campo-estrutura'
import { CollapsibleSection } from './collapsible-section'

const tipoProponenteLabels: Record<TipoProponente, string> = {
  PF: 'Pessoa Física',
  PJ: 'Pessoa Jurídica',
  MEI: 'MEI',
  COLETIVO: 'Coletivo',
}

interface Proponente {
  nome: string
  cpfCnpj: string | null
  email?: string | null
  telefone?: string | null
  tipoProponente?: TipoProponente | null
}

interface Props {
  proponente: Proponente
  categoria?: string | null
  campos: Record<string, unknown>
  camposFormulario: CampoFormulario[]
  etapasCustomizadas: EtapaCustomizada[]
  /** Bloco de anexos pronto para renderizar (ex: <AnexoViewer/>). Se fornecido, vira uma seção própria. */
  anexos?: {
    count: number
    node: ReactNode
  }
  /** Usa accordion (true) ou cards abertos (false). Default true. */
  collapsible?: boolean
}

function SimpleField({ label, value, obrigatorio }: { label: string; value: unknown; obrigatorio?: boolean }) {
  const empty = value === undefined || value === null || value === ''
  const shown = empty
    ? 'Não preenchido'
    : Array.isArray(value) ? (value as string[]).join(', ') : String(value)
  return (
    <div className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <dt className="text-sm font-medium text-slate-500">
        {label}
        {obrigatorio && <span className="text-red-500 ml-1">*</span>}
      </dt>
      <dd className={`text-sm mt-0.5 whitespace-pre-wrap break-words ${empty ? 'text-red-500 italic' : 'text-slate-900'}`}>
        {shown}
      </dd>
    </div>
  )
}

function WrapperBloco({
  collapsible,
  title,
  subtitle,
  badge,
  defaultOpen,
  children,
}: {
  collapsible: boolean
  title: string
  subtitle?: string
  badge?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  if (collapsible) {
    return (
      <CollapsibleSection title={title} subtitle={subtitle} badge={badge} defaultOpen={defaultOpen}>
        {children}
      </CollapsibleSection>
    )
  }
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {badge}
      </div>
      {children}
    </section>
  )
}

/**
 * Renderiza todos os dados submetidos pelo proponente em uma inscrição:
 * - Dados pessoais (nome, CPF/CNPJ, email, telefone, tipo)
 * - Categoria
 * - Campos da etapa "Dados" (camposFormulario do edital)
 * - Cada etapa customizada (info, tabela, grupo_repetivel)
 * - Anexos (se fornecidos)
 *
 * Cada bloco é uma CollapsibleSection (accordion), a menos que collapsible=false.
 * Usado em /admin/inscricoes/[id] e /avaliador/inscricoes/[id].
 */
export function DadosInscricaoView({
  proponente,
  categoria,
  campos,
  camposFormulario,
  etapasCustomizadas,
  anexos,
  collapsible = true,
}: Props) {
  const etapasOrdenadas = [...etapasCustomizadas].sort((a, b) => a.ordem - b.ordem)
  const camposDadosFiltrados = camposFormulario.filter((c) => c.tipo !== 'arquivo')

  return (
    <div className="space-y-4">
      {/* Proponente */}
      <WrapperBloco collapsible={collapsible} title="Proponente" defaultOpen>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <dt className="text-sm font-medium text-slate-500">Nome</dt>
            <dd className="text-sm text-slate-900 font-medium">{proponente.nome}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">CPF/CNPJ</dt>
            <dd className="text-sm text-slate-900 font-mono">{proponente.cpfCnpj ?? '—'}</dd>
          </div>
          {proponente.email && (
            <div>
              <dt className="text-sm font-medium text-slate-500">E-mail</dt>
              <dd className="text-sm text-slate-900 break-all">{proponente.email}</dd>
            </div>
          )}
          {proponente.telefone && (
            <div>
              <dt className="text-sm font-medium text-slate-500">Telefone</dt>
              <dd className="text-sm text-slate-900">{proponente.telefone}</dd>
            </div>
          )}
          {proponente.tipoProponente && (
            <div>
              <dt className="text-sm font-medium text-slate-500">Tipo</dt>
              <dd className="text-sm text-slate-900">
                {tipoProponenteLabels[proponente.tipoProponente] ?? proponente.tipoProponente}
              </dd>
            </div>
          )}
          {categoria && (
            <div>
              <dt className="text-sm font-medium text-slate-500">Categoria</dt>
              <dd className="text-sm text-slate-900">{categoria}</dd>
            </div>
          )}
        </dl>
      </WrapperBloco>

      {/* Etapa "Dados do Projeto" (camposFormulario do edital) */}
      {camposDadosFiltrados.length > 0 && (
        <WrapperBloco
          collapsible={collapsible}
          title="Dados do Projeto"
          subtitle={`${camposDadosFiltrados.length} campo(s)`}
          defaultOpen
        >
          <dl className="space-y-3">
            {camposDadosFiltrados.map((campo) => (
              <SimpleField
                key={campo.nome}
                label={campo.label || campo.nome}
                value={campos[campo.nome]}
                obrigatorio={campo.obrigatorio}
              />
            ))}
          </dl>
        </WrapperBloco>
      )}

      {/* Etapas customizadas */}
      {etapasOrdenadas.map((etapa) => {
        const elementos = (etapa.campos ?? []).filter((c) => c.tipo !== 'arquivo')
        if (elementos.length === 0) return null
        const preenchiveisCount = elementos.filter(
          (c) => c.tipo !== 'info',
        ).length
        return (
          <WrapperBloco
            key={etapa.id}
            collapsible={collapsible}
            title={etapa.titulo}
            subtitle={preenchiveisCount > 0 ? `${preenchiveisCount} campo(s)` : undefined}
            defaultOpen
          >
            {etapa.descricao && (
              <p className="text-sm text-slate-500 mb-3 whitespace-pre-line">{etapa.descricao}</p>
            )}
            <div className="space-y-4">
              {elementos.map((c, idx) => {
                if (c.tipo === 'info' || c.tipo === 'tabela' || c.tipo === 'grupo_repetivel') {
                  return (
                    <CampoEstruturaRevisao
                      key={c.nome || `info_${idx}`}
                      campo={c}
                      value={campos[c.nome]}
                    />
                  )
                }
                return (
                  <SimpleField
                    key={c.nome}
                    label={c.label || c.nome}
                    value={campos[c.nome]}
                    obrigatorio={c.obrigatorio}
                  />
                )
              })}
            </div>
          </WrapperBloco>
        )
      })}

      {/* Anexos */}
      {anexos && anexos.count > 0 && (
        <WrapperBloco
          collapsible={collapsible}
          title="Anexos"
          subtitle={`${anexos.count} arquivo(s)`}
          defaultOpen
        >
          {anexos.node}
        </WrapperBloco>
      )}
    </div>
  )
}
