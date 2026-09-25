import { FASES_DO_PRELIMINAR, resultadoDefinitivo } from '@/lib/edital/fase'
import { guardarResultadoPreliminar, lerResultadoPreliminar } from './resultado-publico'

/**
 * Ao sair do preliminar para o resultado final sem que a publicação tenha
 * guardado a lista (edital publicado antes de a cópia existir), congela a que
 * está valendo agora. Sem isso o preliminar some da página quando as notas mudam.
 */
export async function congelarPreliminarAoAvancar(
  edital: { id: string; resultadoPreliminar: unknown },
  de: string,
  para: string,
): Promise<void> {
  const saindoDoPreliminar = FASES_DO_PRELIMINAR.includes(de) && resultadoDefinitivo(para)
  if (saindoDoPreliminar && !lerResultadoPreliminar(edital.resultadoPreliminar)) {
    await guardarResultadoPreliminar(edital.id)
  }
}
