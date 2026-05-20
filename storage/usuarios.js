import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const arquivo = path.join(__dirname, '..', 'data', 'usuarios.json')

export const MOEDAS_INICIAIS = 100

export async function listarUsuarios() {
  const conteudo = await fs.readFile(arquivo, 'utf-8')
  return JSON.parse(conteudo)
}

export async function salvarUsuarios(usuarios) {
  await fs.writeFile(arquivo, JSON.stringify(usuarios, null, 2), 'utf-8')
}

export async function buscarPorEmail(email) {
  const usuarios = await listarUsuarios()
  return usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

/** Atribui moedas iniciais ao objeto do usuário (antes de salvar). */
export function atribuirMoedasIniciais(usuario, moedas = MOEDAS_INICIAIS) {
  return { ...usuario, moedas }
}

export async function criarUsuario(usuario) {
  const usuarioComMoedas = atribuirMoedasIniciais(usuario)
  const usuarios = await listarUsuarios()
  usuarios.push(usuarioComMoedas)
  await salvarUsuarios(usuarios)
  return usuarioComMoedas
}
