import { Input } from '@client/components/ui'
import { UF_OPTIONS, type EnderecoSectionProps } from './types'

export function EnderecoSection({
  cep,
  setCep,
  logradouro,
  setLogradouro,
  numero,
  setNumero,
  complemento,
  setComplemento,
  bairro,
  setBairro,
  cidade,
  setCidade,
  uf,
  setUf,
  loadingCep,
  onCepBlur,
  errors,
}: EnderecoSectionProps) {
  return (
    <>
      <h3 className="text-sm font-semibold text-slate-700 pt-2">Endereco</h3>
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="CEP"
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          onBlur={onCepBlur}
          error={errors.cep}
          hint={loadingCep ? 'Buscando...' : undefined}
        />
        <div className="col-span-2">
          <Input
            label="Logradouro"
            value={logradouro}
            onChange={(e) => setLogradouro(e.target.value)}
            error={errors.logradouro}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Número"
          value={numero}
          onChange={(e) => {
            // Aceita números, letras (ex: "123A") e "S/N", mas rejeita sinal negativo
            const v = e.target.value.replace(/-/g, '')
            setNumero(v)
          }}
          error={errors.numero}
          hint="Ex: 123, 123A ou S/N"
          maxLength={20}
        />
        <div className="col-span-2">
          <Input
            label="Complemento"
            value={complemento}
            onChange={(e) => setComplemento(e.target.value)}
            error={errors.complemento}
            hint="Ex: Apto 302, Casa dos fundos, próximo ao mercado"
            maxLength={100}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Bairro"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          error={errors.bairro}
        />
        <Input
          label="Cidade"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          error={errors.cidade}
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">UF</label>
          <select
            value={uf}
            onChange={(e) => setUf(e.target.value)}
            className="w-full min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus-visible:outline-none"
          >
            <option value="">UF</option>
            {UF_OPTIONS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  )
}
