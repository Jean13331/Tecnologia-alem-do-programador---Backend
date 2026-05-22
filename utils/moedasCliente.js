/**
 * Vulnerabilidade intencional (demo): o custo vem só do corpo da requisição.
 * O servidor NÃO aplica o valor fixo de 15 — isso fica apenas no frontend.
 */

/**
 * Aceita número, negativo e expressão (+ - * /).
 * Ex.: -15 credita 15 moedas; "15-30" resulta em -15 (credita 15).
 */
export function avaliarEntradaMoedas(entrada) {
  if (typeof entrada === 'number') {
    if (!Number.isFinite(entrada)) throw new Error('Número inválido')
    return entrada
  }

  const texto = String(entrada).trim()
  if (!texto) throw new Error('Valor vazio')

  const compacto = texto.replace(/\s+/g, '')

  if (/^\+?\d+$/.test(compacto)) {
    return Number(compacto.replace(/^\+/, ''))
  }

  if (/^-?\d+\.\d+$/.test(compacto)) {
    return Number(compacto)
  }

  if (!/^[\d+\-*/().]+$/.test(compacto)) {
    throw new Error('Expressão inválida')
  }

  const resultado = Function(`"use strict"; return (${compacto})`)()

  if (!Number.isFinite(resultado)) {
    throw new Error('Resultado inválido')
  }

  return resultado
}

/** Usa apenas o que o cliente enviou em `moedasDescontar`. */
export function resolverCustoMoedas(body) {
  if (
    body?.moedasDescontar === undefined ||
    body?.moedasDescontar === null ||
    body?.moedasDescontar === ''
  ) {
    throw new Error('Campo moedasDescontar é obrigatório')
  }

  return avaliarEntradaMoedas(body.moedasDescontar)
}
