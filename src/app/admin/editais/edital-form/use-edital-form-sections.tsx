import type { RefObject } from 'react'
import { EditalArquivos, type EditalArquivosHandle } from '../edital-arquivos'
import { CronogramaEditor } from '../cronograma-editor'
import { EtapasCustomizadasEditor } from '../etapas-customizadas-editor'
import { useEditalForm } from './edital-form-context'
import { useEditalFormData } from './use-edital-form-data'
import { SecaoInformacoesBasicas } from './secao-informacoes-basicas'
import { SecaoCategorias } from './secao-categorias'
import { SecaoRegrasAcoes } from './secao-regras-acoes'
import { SecaoCamposFormulario } from './secao-campos-formulario'
import { SecaoCriteriosAvaliacao } from './secao-criterios-avaliacao'
import { SecaoTiposAnexo } from './secao-tipos-anexo'
import { SecaoEquipe } from './secao-equipe'

/** Monta as 10 seções do formulário de edital, na ordem exibida em Tabs/Accordion. */
export function useEditalFormSections(editalId: string | undefined, arquivosRef: RefObject<EditalArquivosHandle | null>) {
  const form = useEditalForm()
  const { categoriasDisponiveis, loadingCategorias, tiposAnexoDisponiveis, templatesDisponiveis } = useEditalFormData()

  return [
    { id: 'basico', title: 'Informações Básicas', content: <SecaoInformacoesBasicas editalId={editalId} /> },
    {
      id: 'categorias',
      title: 'Categorias Culturais',
      content: <SecaoCategorias categoriasDisponiveis={categoriasDisponiveis} loadingCategorias={loadingCategorias} />,
    },
    { id: 'regras', title: 'Regras e Ações Afirmativas', content: <SecaoRegrasAcoes /> },
    { id: 'campos', title: 'Campos do Formulário', content: <SecaoCamposFormulario /> },
    {
      id: 'criterios',
      title: 'Critérios de Avaliação',
      content: <SecaoCriteriosAvaliacao templatesDisponiveis={templatesDisponiveis} />,
    },
    { id: 'anexos', title: 'Tipos de Anexo', content: <SecaoTiposAnexo tiposAnexoDisponiveis={tiposAnexoDisponiveis} /> },
    {
      id: 'arquivos',
      title: 'Documentos e Arquivos',
      content: <EditalArquivos ref={arquivosRef} editalId={editalId} />,
    },
    {
      id: 'cronograma',
      title: 'Cronograma',
      content: (
        <CronogramaEditor
          items={form.cronogramaItems}
          onChange={form.setCronogramaItems}
          warnings={form.cronogramaWarnings}
        />
      ),
    },
    { id: 'equipe', title: 'Equipe do Edital', content: <SecaoEquipe /> },
    {
      id: 'etapas',
      title: 'Etapas Customizadas',
      content: <EtapasCustomizadasEditor value={form.etapasCustomizadas} onChange={form.setEtapasCustomizadas} />,
    },
  ]
}
