/**
 * Documentos previstos no edital que a inscrição não trouxe.
 *
 * A tela de conferência lista só o que foi enviado — sem isso, quem habilita
 * precisa abrir o edital por fora pra saber o que faltou. Aqui o que falta
 * aparece como "Não informado" junto dos demais.
 */

/** Entrada da configuração `Edital.tiposAnexo` (JSON). */
interface TipoAnexoConfig {
  tipo: string
  label: string
  obrigatorio?: boolean
}

export interface AnexoPendente {
  tipo: string
  label: string
  obrigatorio: boolean
}

function parseTiposAnexo(raw: unknown): TipoAnexoConfig[] {
  const data = typeof raw === 'string'
    ? (() => { try { return JSON.parse(raw) } catch { return [] } })()
    : raw

  if (!Array.isArray(data)) return []

  return data.filter(
    (t): t is TipoAnexoConfig =>
      typeof t === 'object'
      && t !== null
      && typeof (t as TipoAnexoConfig).tipo === 'string'
      && typeof (t as TipoAnexoConfig).label === 'string',
  )
}

/**
 * Cruza os tipos previstos no edital com os anexos efetivamente enviados.
 *
 * @param tiposAnexoRaw  `Edital.tiposAnexo` como vem do Prisma (Json).
 * @param anexosEnviados Anexos da inscrição (só o `tipo` importa aqui).
 */
export function calcularAnexosPendentes(
  tiposAnexoRaw: unknown,
  anexosEnviados: { tipo: string }[],
): AnexoPendente[] {
  const enviados = new Set(anexosEnviados.map((a) => a.tipo))

  return parseTiposAnexo(tiposAnexoRaw)
    .filter((t) => !enviados.has(t.tipo))
    .map((t) => ({ tipo: t.tipo, label: t.label, obrigatorio: t.obrigatorio === true }))
}
