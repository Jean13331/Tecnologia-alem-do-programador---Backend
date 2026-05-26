import bcrypt from 'bcryptjs'

const RODADAS = 10

export async function criptografarSenha(senhaPlana) {
  return bcrypt.hash(senhaPlana, RODADAS)
}

export async function compararSenha(senhaPlana, senhaArmazenada) {
  if (!senhaArmazenada) return false
  if (String(senhaArmazenada).startsWith('$2')) {
    return bcrypt.compare(senhaPlana, senhaArmazenada)
  }
  return senhaPlana === senhaArmazenada
}

export function senhaEstaCriptografada(senha) {
  return String(senha ?? '').startsWith('$2')
}
