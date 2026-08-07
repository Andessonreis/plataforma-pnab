'use client'

import { Card, Input, Button, InlineFeedback } from '@/components/ui'
import { formatTelefoneBR } from '@/lib/utils/format'
import { EnderecoFields } from './endereco-fields'
import type { usePersonalDataForm } from './hooks/use-personal-data-form'

type PersonalDataFormState = ReturnType<typeof usePersonalDataForm>

export function PersonalDataSection({
  values, setters, loading, message, errors, loadingCep, handleCepBlur, handleSubmit,
}: PersonalDataFormState) {
  return (
    <Card id="tour-perfil-dados" className="shadow-none">
      <h3 className="mb-5 text-base font-semibold text-slate-900">Dados pessoais</h3>

      {message && (
        <div className="mb-4">
          <InlineFeedback type={message.type} message={message.text} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome completo"
          value={values.nome}
          onChange={(e) => setters.setNome(e.target.value)}
          error={errors.nome}
          required
        />
        <Input
          label="E-mail"
          type="email"
          value={values.email}
          onChange={(e) => setters.setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <Input
          label="Telefone"
          type="tel"
          inputMode="numeric"
          value={values.telefone}
          onChange={(e) => setters.setTelefone(formatTelefoneBR(e.target.value))}
          error={errors.telefone}
          hint="Com DDD. Ex: (77) 99999-0000"
          maxLength={15}
        />

        <h4 id="tour-perfil-endereco" className="pt-3 text-base font-semibold text-slate-900">Endereço</h4>
        <EnderecoFields
          values={values}
          setters={setters}
          errors={errors}
          loadingCep={loadingCep}
          onCepBlur={handleCepBlur}
        />

        <div id="tour-perfil-salvar" className="pt-2 sm:flex sm:justify-end">
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            Salvar alterações
          </Button>
        </div>
      </form>
    </Card>
  )
}
