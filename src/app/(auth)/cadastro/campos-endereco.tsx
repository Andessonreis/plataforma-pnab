'use client'

import { Input, Select } from '@/components/ui'
import { formatCep } from '@/lib/utils/format'
import { UFS, type DadosCadastro } from './tipos'

interface CamposEnderecoProps {
  dados: DadosCadastro
  aoAlterar: (campo: keyof DadosCadastro, valor: string) => void
  /** Dispara a consulta ao ViaCEP quando o CEP sai de foco. */
  aoSairDoCep: () => void
  buscandoCep: boolean
}

const OPCOES_UF = UFS.map((uf) => ({ value: uf, label: uf }))

/**
 * Bloco de endereço do cadastro.
 *
 * O CEP vem primeiro e sozinho porque é ele que preenche o resto: quem digita
 * oito números não precisa digitar mais nada além do número da casa. Os pares
 * seguintes agrupam o que se lê junto — número com complemento, cidade com UF
 * — e cada campo largo fica em linha própria, que num telefone é a única forma
 * de "logradouro" caber no rótulo.
 */
export function CamposEndereco({ dados, aoAlterar, aoSairDoCep, buscandoCep }: CamposEnderecoProps) {
  return (
    <fieldset className="space-y-4 border-t border-slate-200 pt-5">
      <legend className="mb-2.5 block font-medium text-slate-700">Endereço</legend>

      {/* CEP e número lado a lado: são os dois campos que a pessoa realmente
          digita — o resto o ViaCEP costuma trazer pronto. */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="CEP"
          type="text"
          inputMode="numeric"
          placeholder="00000-000"
          value={dados.cep}
          onChange={(e) => aoAlterar('cep', formatCep(e.target.value))}
          onBlur={aoSairDoCep}
          maxLength={9}
          required
          autoComplete="postal-code"
          hint={buscandoCep ? 'Buscando endereço...' : undefined}
        />
        <Input
          label="Número"
          type="text"
          inputMode="numeric"
          placeholder="123"
          value={dados.numero}
          onChange={(e) => aoAlterar('numero', e.target.value)}
        />
      </div>

      <Input
        label="Logradouro"
        type="text"
        placeholder="Rua, avenida, praça"
        value={dados.logradouro}
        onChange={(e) => aoAlterar('logradouro', e.target.value)}
        required
        autoComplete="address-line1"
      />

      <Input
        label="Complemento"
        type="text"
        placeholder="Apto, sala, fundos"
        value={dados.complemento}
        onChange={(e) => aoAlterar('complemento', e.target.value)}
        autoComplete="address-line2"
      />

      <Input
        label="Bairro"
        type="text"
        placeholder="Bairro"
        value={dados.bairro}
        onChange={(e) => aoAlterar('bairro', e.target.value)}
        required
      />

      <div className="grid grid-cols-[1fr_6.5rem] gap-3">
        <Input
          label="Cidade"
          type="text"
          placeholder="Cidade"
          value={dados.cidade}
          onChange={(e) => aoAlterar('cidade', e.target.value)}
          required
        />
        <Select
          label="UF"
          placeholder="UF"
          options={OPCOES_UF}
          value={dados.uf}
          onChange={(e) => aoAlterar('uf', e.target.value)}
          required
        />
      </div>
    </fieldset>
  )
}
