import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'

const arquivo = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'data',
  'usuarios.json',
)

const usuarios = JSON.parse(readFileSync(arquivo, 'utf-8'))

for (const usuario of usuarios) {
  if (!usuario.senha || String(usuario.senha).startsWith('$2')) continue
  usuario.senha = await bcrypt.hash(usuario.senha, 10)
}

writeFileSync(arquivo, JSON.stringify(usuarios, null, 2), 'utf-8')
console.log('Senhas de', usuarios.length, 'usuário(s) criptografadas em usuarios.json')
