/**
 * Texto da confirmação de salvamento. Fica separado do componente para ser testado
 * sem relógio de verdade.
 */
export function textoSalvo(salvoEm: Date, agora: Date): string {
  const minutos = Math.floor((agora.getTime() - salvoEm.getTime()) / 60_000)
  if (minutos < 2) return 'Salvo agora há pouco'
  if (minutos < 60) return `Salvo há ${minutos} minutos`
  const hora = salvoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bahia' })
  return `Salvo às ${hora}`
}
