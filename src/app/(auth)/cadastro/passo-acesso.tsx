'use client'

import { CampoSenha } from '@/components/ui'
import type { Cadastro } from './use-cadastro'

/**
 * Terceira etapa: a senha da conta.
 *
 * As duas exigências aparecem marcadas enquanto se digita, em vez de virarem
 * erro depois do envio. `aria-live` educado anuncia a mudança sem cortar o
 * leitor de tela a cada tecla, e o símbolo tem texto ao lado — verde e cinza
 * sozinhos não comunicam a quem não distingue as duas cores.
 */
export function PassoAcesso({ cadastro }: { cadastro: Cadastro }) {
  const { dados, alterarCampo } = cadastro

  const temTamanho = dados.password.length >= 8
  const conferem = dados.password.length > 0 && dados.password === dados.confirmPassword

  return (
    <>
      <CampoSenha
        label="Senha"
        placeholder="Mínimo 8 caracteres"
        value={dados.password}
        onChange={(e) => alterarCampo('password', e.target.value)}
        required
        autoComplete="new-password"
      />

      <CampoSenha
        label="Confirmar senha"
        placeholder="Repita a senha"
        value={dados.confirmPassword}
        onChange={(e) => alterarCampo('confirmPassword', e.target.value)}
        required
        autoComplete="new-password"
      />

      <ul className="space-y-1.5 text-sm" aria-live="polite">
        <Exigencia atendida={temTamanho}>Pelo menos 8 caracteres</Exigencia>
        <Exigencia atendida={conferem}>As duas senhas são iguais</Exigencia>
      </ul>

      <p className="border-t border-slate-200 pt-5 text-sm leading-relaxed text-slate-500">
        Seus dados são usados apenas para a análise das inscrições da PNAB e ficam sob a guarda da
        Secretaria de Cultura e Turismo de Irecê, conforme a Lei Geral de Proteção de Dados.
      </p>
    </>
  )
}

function Exigencia({ atendida, children }: { atendida: boolean; children: string }) {
  return (
    <li className={`flex items-center gap-2 ${atendida ? 'text-emerald-700' : 'text-slate-500'}`}>
      <span aria-hidden="true" className="font-semibold">
        {atendida ? '✓' : '·'}
      </span>
      {children}
      <span className="sr-only">{atendida ? '— atendido' : '— pendente'}</span>
    </li>
  )
}
