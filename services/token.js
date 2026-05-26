import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET ?? 'sesi-jwt-dev-altere-no-env'

export function gerarToken(usuarioId) {
  return jwt.sign({ sub: String(usuarioId) }, SECRET, { expiresIn: '12h' })
}

export function verificarToken(token) {
  return jwt.verify(token, SECRET)
}
