'use client'

import { Input, Textarea } from '@/components/ui'
import { SecaoForm } from '../_componentes/secao-form'
import { CampoAutorizacao } from './campo-autorizacao'
import type { SecaoItemProps } from './item-valores'

/** Autoria, origem e direitos: o que permite (ou não) mostrar o item ao público. */
export function ItemCreditos({ valores, definir, texto, erros }: SecaoItemProps) {
  return (
    <SecaoForm titulo="Créditos e direitos" ajuda="Toda imagem tem dono. Registre de onde veio e em que condições pode ser usada.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Autor" error={erros.autor} {...texto('autor')} />
        <Input label="Fotógrafo" error={erros.fotografo} {...texto('fotografo')} />
        <Input label="Fonte / instituição de origem" error={erros.fonte} {...texto('fonte')} />
        <Input
          label="Crédito"
          hint="Texto exibido junto da imagem no site."
          placeholder="Ex.: Acervo da família Dourado"
          error={erros.credito}
          {...texto('credito')}
        />
      </div>
      <Textarea label="Direitos de uso e observações" rows={3} error={erros.direitosUso} {...texto('direitosUso')} />
      <CampoAutorizacao marcado={valores.autorizado} onChange={(v) => definir('autorizado', v)} />
    </SecaoForm>
  )
}
