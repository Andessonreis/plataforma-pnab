'use client'

import { Input, Select } from '@/components/ui'

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
].map((uf) => ({ value: uf, label: uf }))

interface EnderecoValues {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

interface EnderecoSetters {
  setCep: (v: string) => void
  setLogradouro: (v: string) => void
  setNumero: (v: string) => void
  setComplemento: (v: string) => void
  setBairro: (v: string) => void
  setCidade: (v: string) => void
  setUf: (v: string) => void
}

interface EnderecoFieldsProps {
  values: EnderecoValues
  setters: EnderecoSetters
  errors: Record<string, string>
  loadingCep: boolean
  onCepBlur: () => void
}

/** Campos de endereço do perfil, com autopreenchimento por CEP (ViaCEP). */
export function EnderecoFields({ values, setters, errors, loadingCep, onCepBlur }: EnderecoFieldsProps) {
  return (
    <>
      {/* deslop-ignore-next-line 28 — linha de campos de formulário (CEP + logradouro), não grade de cartões */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          label="CEP"
          value={values.cep}
          onChange={(e) => setters.setCep(e.target.value)}
          onBlur={onCepBlur}
          error={errors.cep}
          hint={loadingCep ? 'Buscando...' : undefined}
        />
        <div className="sm:col-span-2">
          <Input
            label="Logradouro"
            value={values.logradouro}
            onChange={(e) => setters.setLogradouro(e.target.value)}
            error={errors.logradouro}
          />
        </div>
      </div>

      {/* deslop-ignore-next-line 28 — linha de campos de formulário (número + complemento), não grade de cartões */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          label="Número"
          value={values.numero}
          onChange={(e) => {
            // Aceita números, letras (ex: "123A") e "S/N", mas rejeita sinal negativo
            const v = e.target.value.replace(/-/g, '')
            setters.setNumero(v)
          }}
          error={errors.numero}
          hint="Ex: 123, 123A ou S/N"
          maxLength={20}
        />
        <div className="sm:col-span-2">
          <Input
            label="Complemento"
            value={values.complemento}
            onChange={(e) => setters.setComplemento(e.target.value)}
            error={errors.complemento}
            hint="Ex: Apto 302, Casa dos fundos, próximo ao mercado"
            maxLength={100}
          />
        </div>
      </div>

      {/* deslop-ignore-next-line 28 — linha de campos de formulário (bairro + cidade + UF), não grade de cartões */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          label="Bairro"
          value={values.bairro}
          onChange={(e) => setters.setBairro(e.target.value)}
          error={errors.bairro}
        />
        <Input
          label="Cidade"
          value={values.cidade}
          onChange={(e) => setters.setCidade(e.target.value)}
          error={errors.cidade}
        />
        <Select
          label="UF"
          value={values.uf}
          onChange={(e) => setters.setUf(e.target.value)}
          options={UF_OPTIONS}
          placeholder="UF"
        />
      </div>
    </>
  )
}
