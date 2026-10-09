'use client'

import { Input } from '@/components/ui'
import { formatTelefoneBR } from '@/lib/utils/format'
import { SecaoPainel } from '../secao-painel'
import { BarraSalvar } from './barra-salvar'
import { EnderecoFields } from './endereco-fields'
import { camposNoPapel } from './estilo-campos'
import type { usePersonalDataForm } from './hooks/use-personal-data-form'

type PersonalDataFormState = ReturnType<typeof usePersonalDataForm>

const ajuda = 'mb-5 max-w-prose text-tinta-700'

/**
 * Dados cadastrais em três partes com propósito dito na própria seção. Um
 * envio só para as três, porque a API grava tudo num PUT; a barra fixa no fim
 * mostra se ficou algo por salvar.
 */
export function PersonalDataSection({
  values, setters, alterado, loading, message, errors, loadingCep, handleCepBlur, handleSubmit,
}: PersonalDataFormState) {
  return (
    <form onSubmit={handleSubmit} className={`${camposNoPapel} space-y-12`} aria-describedby="perfil-obrigatorios">
      <SecaoPainel id="tour-perfil-identificacao" titulo="Identificação">
        <p className={ajuda}>
          É assim que seu nome sai nas inscrições e nos documentos que a Secretaria emite.
          <span id="perfil-obrigatorios" className="mt-1 block text-sm">
            Campos marcados com <span aria-hidden="true">*</span>
            <span className="sr-only">asterisco</span> são obrigatórios.
          </span>
        </p>
        <Input
          label="Nome completo"
          autoComplete="name"
          value={values.nome}
          onChange={(e) => setters.setNome(e.target.value)}
          error={errors.nome}
          required
        />
      </SecaoPainel>

      <SecaoPainel id="tour-perfil-contato" titulo="Contato">
        <p className={ajuda}>Para onde chegam os avisos, os resultados e as convocações.</p>
        {/* deslop-ignore-next-line 28 — par de campos de formulário, não grade de cartões */}
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="E-mail"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setters.setEmail(e.target.value)}
            error={errors.email}
            required
          />
          <Input
            label="Telefone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={values.telefone}
            onChange={(e) => setters.setTelefone(formatTelefoneBR(e.target.value))}
            error={errors.telefone}
            hint="Com DDD. Ex.: (74) 99999-0000"
            maxLength={15}
          />
        </div>
      </SecaoPainel>

      <SecaoPainel id="tour-perfil-endereco" titulo="Endereço">
        <p className={ajuda}>Comece pelo CEP: rua, bairro, cidade e estado se completam sozinhos. Depois confira e informe o número.</p>
        <div className="space-y-5">
          <EnderecoFields values={values} setters={setters} errors={errors} loadingCep={loadingCep} onCepBlur={handleCepBlur} />
        </div>
      </SecaoPainel>

      <BarraSalvar alterado={alterado} carregando={loading} mensagem={message} />
    </form>
  )
}
