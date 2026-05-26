import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizarTexto } from '../utils/texto.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const arquivo = path.join(__dirname, '..', 'data', 'mensagens.json')
const CHATBOT_ID = 'chatbot'

function isChatbot(usuarioId) {
  return usuarioId === CHATBOT_ID
}

/** Filtra mensagens de uma conversa (suporta registros antigos sem conversaUsuarioId). */
export function filtrarMensagensPorUsuario(mensagens, usuarioId) {
  const id = String(usuarioId ?? '').trim()
  if (!id) return []

  let donoAtual = null
  const resultado = []

  for (const m of mensagens) {
    const donoExplicito = m.conversaUsuarioId?.trim()

    if (donoExplicito) {
      if (donoExplicito === id) resultado.push(m)
      if (!isChatbot(m.usuarioId)) donoAtual = donoExplicito
      continue
    }

    if (!isChatbot(m.usuarioId)) {
      donoAtual = m.usuarioId
    }

    if (donoAtual === id) resultado.push(m)
  }

  return resultado
}

export async function listarMensagensPorUsuario(usuarioId) {
  const mensagens = await listarMensagens()
  return filtrarMensagensPorUsuario(mensagens, usuarioId)
}

export async function listarMensagens() {
  const conteudo = await fs.readFile(arquivo, 'utf-8')
  const mensagens = JSON.parse(conteudo)
  return mensagens.map((m) => ({
    ...m,
    nome: normalizarTexto(m.nome),
    texto: normalizarTexto(m.texto),
  }))
}

export async function salvarMensagens(mensagens) {
  await fs.writeFile(arquivo, JSON.stringify(mensagens, null, 2), {
    encoding: 'utf8',
  })
}

export async function criarMensagem(mensagem) {
  const mensagemNormalizada = {
    ...mensagem,
    nome: normalizarTexto(mensagem.nome),
    texto: normalizarTexto(mensagem.texto),
  }
  const mensagens = await listarMensagens()
  mensagens.push(mensagemNormalizada)
  await salvarMensagens(mensagens)
  return mensagemNormalizada
}

export async function limparMensagensPorUsuario(usuarioId) {
  const todas = await listarMensagens()
  const idsRemover = new Set(
    filtrarMensagensPorUsuario(todas, usuarioId).map((m) => m.id),
  )
  const restantes = todas.filter((m) => !idsRemover.has(m.id))
  await salvarMensagens(restantes)
  return []
}
