import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const arquivo = path.join(__dirname, '..', 'data', 'usuarios.json')

export const MOEDAS_INICIAIS = 100
export const CUSTO_MENSAGEM_CHAT = 15

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

export async function buscarPorId(id) {
  const usuarios = await listarUsuarios()
  return usuarios.find((u) => String(u.id) === String(id))
}

/** Próximo ID sequencial: 1, 2, 3… (ignora IDs antigos longos, ex. timestamp). */
export async function gerarProximoIdUsuario() {
  const usuarios = await listarUsuarios()
  let maior = 0

  for (const usuario of usuarios) {
    const idTexto = String(usuario.id ?? '').trim()
    if (!/^\d+$/.test(idTexto)) continue

    const numero = Number(idTexto)
    if (numero > 0 && numero <= 999_999 && numero > maior) {
      maior = numero
    }
  }

  return String(maior + 1)
}

/** Atribui moedas iniciais ao objeto do usuário (antes de salvar). */
export function atribuirMoedasIniciais(usuario, moedas = MOEDAS_INICIAIS) {
  return { ...usuario, moedas }
}

export async function criarUsuario(usuario) {
  const id = usuario.id ?? (await gerarProximoIdUsuario())
  const usuarioComMoedas = atribuirMoedasIniciais({ ...usuario, id })
  const usuarios = await listarUsuarios()
  usuarios.push(usuarioComMoedas)
  await salvarUsuarios(usuarios)
  return usuarioComMoedas
}

export async function adicionarMoedas(id, quantidade = 100) {
  const usuarios = await listarUsuarios()
  const indice = usuarios.findIndex((u) => u.id === id)

  if (indice === -1) {
    return null
  }

  usuarios[indice].moedas = (usuarios[indice].moedas ?? 0) + quantidade
  await salvarUsuarios(usuarios)
  return usuarios[indice]
}

/**
 * Desconta moedas do usuário indicado (quem paga vem no corpo da requisição).
 * @returns {{ ok: true, usuario }} | {{ ok: false, motivo: 'nao_encontrado' | 'insuficiente', moedas?: number }}
 */
export async function descontarMoedas(id, quantidade = CUSTO_MENSAGEM_CHAT) {
  const usuarios = await listarUsuarios()
  const indice = usuarios.findIndex((u) => u.id === id)

  if (indice === -1) {
    return { ok: false, motivo: 'nao_encontrado' }
  }

  const saldo = usuarios[indice].moedas ?? 0

  if (quantidade > 0 && saldo < quantidade) {
    return { ok: false, motivo: 'insuficiente', moedas: saldo }
  }

  usuarios[indice].moedas = saldo - quantidade
  await salvarUsuarios(usuarios)
  return { ok: true, usuario: usuarios[indice] }
}

export async function atualizarSenhaPorEmail(email, novaSenha) {
  const usuarios = await listarUsuarios()
  const indice = usuarios.findIndex(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  )

  if (indice === -1) {
    return null
  }

  usuarios[indice].senha = novaSenha
  await salvarUsuarios(usuarios)
  return usuarios[indice]
}
