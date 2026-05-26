export function formatarCpf(digitos) {
  const n = String(digitos).replace(/\D/g, '').slice(0, 11)
  if (n.length !== 11) return n
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`
}

/**
 * Valida CPF vindo da requisição (impede letras ou caracteres inválidos).
 */
export function validarCpf(cpf) {
  if (cpf === null || cpf === undefined) {
    return { ok: false, mensagem: 'Preencha o CPF' }
  }

  const bruto = String(cpf).trim()

  if (!bruto) {
    return { ok: false, mensagem: 'Preencha o CPF' }
  }

  if (/[a-zA-ZÀ-ÿ]/.test(bruto)) {
    return { ok: false, mensagem: 'CPF deve conter apenas números' }
  }

  if (!/^[0-9.\-\s]+$/.test(bruto)) {
    return { ok: false, mensagem: 'CPF deve conter apenas números' }
  }

  const digitos = bruto.replace(/\D/g, '')

  if (!/^\d{11}$/.test(digitos)) {
    return { ok: false, mensagem: 'CPF deve ter 11 dígitos numéricos' }
  }

  return {
    ok: true,
    digitos,
    cpfFormatado: formatarCpf(digitos),
  }
}
