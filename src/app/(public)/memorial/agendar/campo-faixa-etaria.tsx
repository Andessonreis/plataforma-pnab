'use client'

import { Input } from '@/components/ui'
import { idDoCampo } from '@/components/formulario-dinamico/campo-com-erro'
import { FAIXA_PERSONALIZADA, FAIXAS_ETARIAS, intervaloDeIdades } from '@/lib/memorial/agendamento/faixa-etaria'
import type { DadosVisita, ErrosVisita } from './dados-visita'
import { apenasDigitos, PROPS_NUMERICO } from './entrada-numerica'
import { OpcoesRadio } from './opcoes-radio'

const OPCOES = [
  ...FAIXAS_ETARIAS.map((f) => ({ valor: f.id, rotulo: f.rotulo, detalhe: intervaloDeIdades(f.de, f.ate) })),
  { valor: FAIXA_PERSONALIZADA, rotulo: 'Outro intervalo', detalhe: 'Informe a idade inicial e a final' },
]

interface CampoFaixaEtariaProps {
  dados: DadosVisita
  erros: ErrosVisita
  aoMudar: (parcial: Partial<DadosVisita>) => void
}

/**
 * Faixa etária como intervalo de idades. As faixas prontas preenchem as duas idades;
 * "Outro intervalo" abre os campos "de ... a ... anos" para grupos mistos, como famílias.
 */
export function CampoFaixaEtaria({ dados, erros, aoMudar }: CampoFaixaEtariaProps) {
  function escolher(valor: string) {
    const faixa = FAIXAS_ETARIAS.find((f) => f.id === valor)
    aoMudar(
      faixa
        ? { faixaEtaria: valor, idadeMinima: String(faixa.de), idadeMaxima: String(faixa.ate) }
        : { faixaEtaria: valor, idadeMinima: '', idadeMaxima: '' },
    )
  }

  return (
    <OpcoesRadio
      nome="faixaEtaria"
      legenda="Faixa etária do grupo"
      dica="Escolha a faixa que melhor descreve o grupo."
      opcoes={OPCOES}
      valor={dados.faixaEtaria}
      aoMudar={escolher}
      erro={erros.faixaEtaria}
      obrigatorio
    >
      {dados.faixaEtaria === FAIXA_PERSONALIZADA && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-sm">
          <Input
            id={idDoCampo('idadeMinima')}
            label="De (anos)"
            {...PROPS_NUMERICO}
            value={dados.idadeMinima}
            onChange={(e) => aoMudar({ idadeMinima: apenasDigitos(e.target.value) })}
            error={erros.idadeMinima}
            required
          />
          <Input
            id={idDoCampo('idadeMaxima')}
            label="Até (anos)"
            {...PROPS_NUMERICO}
            value={dados.idadeMaxima}
            onChange={(e) => aoMudar({ idadeMaxima: apenasDigitos(e.target.value) })}
            error={erros.idadeMaxima}
            required
          />
        </div>
      )}
    </OpcoesRadio>
  )
}
