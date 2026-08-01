'use client'

import { Input } from '@/components/ui'
import { formatTelefoneBR } from '@/lib/utils/format'
import { CamposEndereco } from './campos-endereco'
import type { Cadastro } from './use-cadastro'

/**
 * Segunda etapa: por onde a Secretaria fala com o proponente.
 *
 * O e-mail leva a confirmação da inscrição, os pedidos de documento e o
 * resultado — daí a ressalva logo abaixo do campo, e não num aviso perdido no
 * fim da ficha.
 */
export function PassoContato({ cadastro }: { cadastro: Cadastro }) {
  const { dados, alterarCampo, consultarCep, buscandoCep } = cadastro

  return (
    <>
      <Input
        label="E-mail"
        type="email"
        placeholder="seu@email.com"
        value={dados.email}
        onChange={(e) => alterarCampo('email', e.target.value)}
        required
        autoComplete="email"
        hint="É por aqui que chegam habilitação, avaliação e resultado."
      />

      <Input
        label="Telefone"
        type="tel"
        inputMode="numeric"
        placeholder="(74) 99999-0000"
        value={dados.telefone}
        onChange={(e) => alterarCampo('telefone', formatTelefoneBR(e.target.value))}
        maxLength={15}
        required
        autoComplete="tel"
      />

      <CamposEndereco
        dados={dados}
        aoAlterar={alterarCampo}
        aoSairDoCep={consultarCep}
        buscandoCep={buscandoCep}
      />
    </>
  )
}
