import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizarTexto } from '../utils/texto.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const arquivo = path.join(__dirname, '..', 'data', 'mensagens.json')

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

export async function limparMensagens() {
  await salvarMensagens([])
  return []
}
