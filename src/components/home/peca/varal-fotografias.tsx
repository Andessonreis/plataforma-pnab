import { LinhaVaral } from './linha-varal'
import type { PecaEditorial } from './tipos'

/**
 * Marcos do eixo de tempo: décadas cheias entre os dois anos. Intervalos longos
 * pulam de 20 em 20, 30 em 30... para o eixo nunca passar de ~6 marcos e os
 * anos não se atropelarem.
 */
export function decadas(inicio: number, fim: number) {
  const passo = Math.max(10, Math.ceil((fim - inicio) / 60) * 10)
  const marcos = [inicio]
  for (let ano = Math.ceil((inicio + 1) / passo) * passo; ano < fim; ano += passo) {
    if (ano - marcos[marcos.length - 1] >= passo / 2 && fim - ano >= passo / 2) marcos.push(ano)
  }
  return [...marcos, fim]
}

function Eixo({ anos }: { anos: number[] }) {
  return (
    <div className="mt-1 flex justify-between text-sm font-semibold tabular-nums text-papel-100/90">
      {anos.map((ano) => (
        <span key={ano}>{ano}</span>
      ))}
    </div>
  )
}

/**
 * Faixa de baixo da peça: fotografias penduradas num varal ao longo de um
 * intervalo de anos (no Memorial, as 28 da mostra "Re-Tratos do Tempo", de
 * 1950 a 1980). Do tablet em diante é uma linha só; no celular quebra em duas
 * metades porque 28 cópias numa linha de 360px viram tracinhos ilegíveis.
 *
 * O rótulo é texto real; o desenho em si é decorativo.
 */
export function VaralFotografias({ varal }: { varal: NonNullable<PecaEditorial['varal']> }) {
  const { quantidade, anoInicial, anoFinal, rotulo } = varal
  const meio = Math.ceil(quantidade / 2)
  const anoMeio = Math.round((anoInicial + anoFinal) / 2)

  return (
    <div>
      <p className="mb-1.5 line-clamp-2 text-sm font-semibold uppercase tracking-[0.12em] text-papel-100 md:line-clamp-1 md:tracking-[0.16em]">
        {rotulo}
      </p>

      <div className="hidden md:block">
        <LinhaVaral quantidade={quantidade} className="h-auto w-full" />
        <Eixo anos={decadas(anoInicial, anoFinal)} />
      </div>

      <div className="space-y-2 md:hidden">
        <div>
          <LinhaVaral quantidade={meio} className="h-auto w-full" />
          <Eixo anos={[anoInicial, anoMeio]} />
        </div>
        <div>
          <LinhaVaral quantidade={quantidade - meio} inicio={meio} className="h-auto w-full" />
          <Eixo anos={[anoMeio, anoFinal]} />
        </div>
      </div>
    </div>
  )
}
