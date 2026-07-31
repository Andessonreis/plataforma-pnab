'use client'

import { Input } from '@/components/ui'
import { formatCpfCnpj } from '@/lib/utils/format'
import { SeletorTipo } from './seletor-tipo'
import { CampoDeclaracao } from './campo-declaracao'
import type { Cadastro } from './use-cadastro'

/**
 * Primeira etapa: quem se inscreve.
 *
 * A natureza do proponente vem antes de tudo porque decide o resto da etapa —
 * muda o rótulo e a máscara do documento, liga a consulta à Receita e, no caso
 * do coletivo, acrescenta a declaração.
 */
export function PassoIdentificacao({ cadastro }: { cadastro: Cadastro }) {
  const {
    tipo, escolherTipo, isCnpj,
    dados, alterarCampo,
    buscandoCnpj, dicaCnpj, consultarCnpj,
    setDeclaracao,
  } = cadastro

  const dicaDocumento = isCnpj
    ? buscandoCnpj
      ? 'Consultando CNPJ na Receita...'
      : dicaCnpj || undefined
    : undefined

  return (
    <>
      <SeletorTipo valor={tipo} aoEscolher={escolherTipo} />

      <Input
        label={isCnpj ? 'Razão social' : 'Nome completo'}
        type="text"
        placeholder={isCnpj ? 'Razão social da empresa' : 'Seu nome completo'}
        value={dados.nome}
        onChange={(e) => alterarCampo('nome', e.target.value)}
        required
        autoComplete="name"
      />

      <Input
        label={isCnpj ? 'CNPJ' : 'CPF'}
        type="text"
        inputMode="numeric"
        placeholder={isCnpj ? '00.000.000/0000-00' : '000.000.000-00'}
        value={dados.cpfCnpj}
        onChange={(e) => alterarCampo('cpfCnpj', formatCpfCnpj(e.target.value))}
        onBlur={isCnpj ? consultarCnpj : undefined}
        maxLength={isCnpj ? 18 : 14}
        required
        autoComplete="off"
        hint={dicaDocumento}
      />

      {tipo === 'COLETIVO' && <CampoDeclaracao aoEscolher={setDeclaracao} />}
    </>
  )
}
