'use client'

import { useState } from 'react'
import { Input, type InputProps } from './input'

type CampoSenhaProps = Omit<InputProps, 'type' | 'rightIcon'>

/**
 * Campo de senha com alternância de visibilidade.
 *
 * O par campo + botão de olho estava copiado em cinco lugares (entrar, criar
 * conta duas vezes, redefinir senha duas vezes), cada cópia com os mesmos dois
 * SVGs inteiros no meio do formulário. Além do peso, era onde os detalhes de
 * acessibilidade divergiam com o tempo: o `aria-label` que alterna e a área de
 * toque de 44px precisam existir nas cinco, e agora existem em uma.
 */
export function CampoSenha(props: CampoSenhaProps) {
  const [visivel, setVisivel] = useState(false)

  return (
    <Input
      {...props}
      type={visivel ? 'text' : 'password'}
      rightIcon={
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          className="-mr-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visivel ? <IconeOlhoCortado /> : <IconeOlho />}
        </button>
      }
    />
  )
}

function IconeOlho() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function IconeOlhoCortado() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}
