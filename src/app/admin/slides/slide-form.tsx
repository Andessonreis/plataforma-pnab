'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import type { EditalResumo } from '@/components/home/types'
import { CamposArte } from './_form/campos-arte'
import { CamposPecaMidia } from './_form/campos-peca-midia'
import { CamposPecaTexto } from './_form/campos-peca-texto'
import { CamposVisibilidade } from './_form/campos-visibilidade'
import { PreviaQuadro } from './_form/previa-quadro'
import { SeletorFormato } from './_form/seletor-formato'
import { useSlideForm } from './_form/use-slide-form'
import type { FormSlide } from './_form/estado'

interface SlideFormProps {
  initialData?: FormSlide
  slideId?: string
  /** Editais e fotos reais da home, para a prévia mostrar o quadro como ele vai ficar. */
  editais: EditalResumo[]
  fotos: string[]
}

/**
 * Formulário do slide da abertura. Os campos mudam com o formato (arte pronta
 * ou peça editorial) e a prévia ao lado redesenha o quadro da home a cada
 * tecla. No computador a prévia acompanha a rolagem; no celular fica no topo.
 */
export function SlideForm({ initialData, slideId, editais, fotos }: SlideFormProps) {
  const router = useRouter()
  const controle = useSlideForm(initialData, slideId)
  const { form, campo, salvando, salvar } = controle

  return (
    <form onSubmit={salvar} noValidate className="grid gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="xl:sticky xl:top-24 xl:order-2 xl:self-start">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Prévia na página inicial</h2>
        <PreviaQuadro form={form} editais={editais} fotos={fotos} />
        <p className="mt-2 text-sm text-slate-600">
          O quadro tem altura fixa: textos maiores que o limite de cada campo não cabem.
        </p>
      </div>

      <div className="space-y-5 sm:space-y-6 xl:order-1">
        <SeletorFormato valor={form.formato} onChange={(f) => campo('formato', f)} />
        {form.formato === 'ARTE' ? (
          <CamposArte {...controle} />
        ) : (
          <>
            <CamposPecaTexto {...controle} />
            <CamposPecaMidia {...controle} />
          </>
        )}
        <CamposVisibilidade {...controle} />

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.push('/admin/slides')}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvando}>
            {slideId ? 'Salvar alterações' : 'Criar slide'}
          </Button>
        </div>
      </div>
    </form>
  )
}
