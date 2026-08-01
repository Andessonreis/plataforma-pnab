'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ehCnpj, TOTAL_PASSOS, type DadosCadastro, type TipoProponente } from './tipos'
import { buscarCep, buscarCnpj } from './consultas'
import { criarConta, enviarDeclaracao } from './registro'
import { validarPasso, validarTudo } from './validacao'

const DADOS_VAZIOS: DadosCadastro = {
  nome: '', cpfCnpj: '', email: '', telefone: '', cep: '', logradouro: '',
  numero: '', complemento: '', bairro: '', cidade: '', uf: '',
  password: '', confirmPassword: '',
}

/**
 * Estado da ficha de cadastro: os campos, a etapa corrente e as duas consultas
 * que preenchem campos sozinhas (CNPJ na Receita, CEP no ViaCEP).
 *
 * As regras de cada etapa moram em `validacao`, as chamadas ao servidor em
 * `registro`. Aqui fica só o que muda com o tempo — separação que mantém este
 * arquivo legível agora que o cadastro tem etapas: sem ela, achar por que um
 * campo se preenche sozinho virava leitura de quinhentas linhas.
 */
export function useCadastro() {
  const router = useRouter()
  const [passo, setPasso] = useState(0)
  const [tipo, setTipo] = useState<TipoProponente>('PF')
  const [dados, setDados] = useState<DadosCadastro>(DADOS_VAZIOS)
  const [declaracao, setDeclaracao] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [avisoUpload, setAvisoUpload] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const [dicaCnpj, setDicaCnpj] = useState('')

  const isCnpj = ehCnpj(tipo)
  const estado = { tipo, dados, declaracao }
  const noUltimoPasso = passo === TOTAL_PASSOS - 1

  function alterarCampo(campo: keyof DadosCadastro, valor: string) {
    setDados((anterior) => ({ ...anterior, [campo]: valor }))
    setErro('')
  }

  function escolherTipo(novo: TipoProponente) {
    setTipo(novo)
    setErro('')
    setDicaCnpj('')
  }

  function voltar() {
    setErro('')
    setPasso((atual) => Math.max(0, atual - 1))
  }

  /**
   * Avança uma etapa, ou envia quando já está na última.
   *
   * O submit do formulário é o mesmo em todas as etapas: assim o Enter no
   * teclado continua fazendo a coisa óbvia, em vez de enviar a ficha pela
   * metade a partir do primeiro campo.
   */
  async function avancar(e: React.FormEvent) {
    e.preventDefault()

    const impedimento = validarPasso(passo, estado)
    if (impedimento) {
      setErro(impedimento)
      return
    }

    if (!noUltimoPasso) {
      setErro('')
      setPasso((atual) => atual + 1)
      return
    }

    await enviar()
  }

  async function enviar() {
    setErro('')
    setAvisoUpload('')

    const impedimento = validarTudo(estado)
    if (impedimento) {
      setErro(impedimento)
      return
    }

    setEnviando(true)

    const resultado = await criarConta(dados, tipo)

    if (!resultado.ok) {
      setErro(resultado.erro ?? 'Erro ao criar conta.')
      setEnviando(false)
      return
    }

    if (declaracao && resultado.userId) {
      const aviso = await enviarDeclaracao(declaracao, resultado.userId)
      if (aviso) setAvisoUpload(aviso)
    }

    router.push('/login?cadastro=sucesso')
  }

  /** Preenche razão social e endereço a partir do CNPJ, sem sobrescrever o que já foi digitado. */
  async function consultarCnpj() {
    if (!isCnpj) return
    const digitos = dados.cpfCnpj.replace(/\D/g, '')
    if (digitos.length !== 14) return

    setBuscandoCnpj(true)
    setDicaCnpj('')

    const { razaoSocial, endereco, dica } = await buscarCnpj(digitos)

    if (endereco) {
      setDados((anterior) => ({
        ...anterior,
        nome: anterior.nome || razaoSocial || anterior.nome,
        cep: anterior.cep || endereco.cep || anterior.cep,
        logradouro: anterior.logradouro || endereco.logradouro || anterior.logradouro,
        numero: anterior.numero || endereco.numero || anterior.numero,
        complemento: anterior.complemento || endereco.complemento || anterior.complemento,
        bairro: anterior.bairro || endereco.bairro || anterior.bairro,
        cidade: anterior.cidade || endereco.municipio || anterior.cidade,
        uf: anterior.uf || endereco.uf || anterior.uf,
      }))
    }

    setDicaCnpj(dica)
    setBuscandoCnpj(false)
  }

  /** Ao contrário do CNPJ, o CEP sobrescreve: quem redigita o CEP quer o endereço novo. */
  async function consultarCep() {
    const cep = dados.cep.replace(/\D/g, '')
    if (cep.length !== 8) return

    setBuscandoCep(true)
    const encontrado = await buscarCep(cep)

    if (encontrado) {
      setDados((anterior) => ({
        ...anterior,
        logradouro: encontrado.logradouro || anterior.logradouro,
        bairro: encontrado.bairro || anterior.bairro,
        cidade: encontrado.localidade || anterior.cidade,
        uf: encontrado.uf || anterior.uf,
      }))
    }

    setBuscandoCep(false)
  }

  return {
    passo, noUltimoPasso, avancar, voltar,
    tipo, escolherTipo, isCnpj,
    dados, alterarCampo,
    declaracao, setDeclaracao,
    enviando, erro, avisoUpload,
    buscandoCep, buscandoCnpj, dicaCnpj,
    consultarCnpj, consultarCep,
  }
}

/** Assinatura do hook, para os grupos de campos de cada etapa. */
export type Cadastro = ReturnType<typeof useCadastro>
