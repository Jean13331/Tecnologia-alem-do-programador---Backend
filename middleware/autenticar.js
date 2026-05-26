import { verificarToken } from '../services/token.js'

export function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization ?? ''
  const partes = cabecalho.split(' ')

  if (partes.length !== 2 || partes[0] !== 'Bearer' || !partes[1]) {
    return res.status(401).json({ mensagem: 'Não autenticado' })
  }

  try {
    const payload = verificarToken(partes[1])
    req.usuarioId = String(payload.sub)
    next()
  } catch {
    return res.status(401).json({ mensagem: 'Sessão inválida ou expirada' })
  }
}

/** Retorna true se o ID informado não é o do usuário autenticado. */
export function idUsuarioInvalido(req, idInformado) {
  const informado = String(idInformado ?? '').trim()
  return !informado || String(req.usuarioId) !== informado
}

export function responderErroIdUsuario(res) {
  return res.status(403).json({ mensagem: 'Erro no id do usuario' })
}
