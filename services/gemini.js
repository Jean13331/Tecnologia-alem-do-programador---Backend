const MODELOS_PADRAO = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
]

import { normalizarTexto } from '../utils/texto.js'

const CHATBOT_ID = 'chatbot'
const MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS) || 8192

function modelosDisponiveis() {
  const preferido = process.env.GEMINI_MODEL?.trim()
  const lista = preferido
    ? [preferido, ...MODELOS_PADRAO.filter((m) => m !== preferido)]
    : [...MODELOS_PADRAO]
  return [...new Set(lista)]
}

function aguardar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function erroRecuperavel(status, mensagem) {
  if (status === 429 || status === 503 || status === 500 || status === 502) {
    return true
  }
  const texto = (mensagem ?? '').toLowerCase()
  return (
    texto.includes('high demand') ||
    texto.includes('quota') ||
    texto.includes('overloaded') ||
    texto.includes('try again') ||
    texto.includes('resource_exhausted') ||
    texto.includes('unavailable')
  )
}

export function isChatbot(usuarioId) {
  return usuarioId === CHATBOT_ID
}

async function gerarComModelo(apiKey, modelo, contents) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`

  const resposta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text:
              'Você é o ChatBot do sistema Sesi. Responda sempre em português do Brasil, com acentuação correta (UTF-8). ' +
              'Use parágrafos curtos, listas com * quando fizer sentido e **negrito** para títulos. ' +
              'Se a resposta for longa, organize por tópicos sem cortar frases no meio.',
          },
        ],
      },
      generationConfig: {
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.7,
      },
      contents,
    }),
  })

  const dados = await resposta.json()

  if (!resposta.ok) {
    const detalhe =
      dados?.error?.message ?? 'Erro ao consultar o Gemini'
    const erro = new Error(detalhe)
    erro.status = resposta.status
    erro.modelo = modelo
    throw erro
  }

  const candidato = dados?.candidates?.[0]
  let texto = normalizarTexto(
    candidato?.content?.parts
      ?.map((parte) => parte.text)
      .join('')
      .trim() ?? '',
  )

  if (candidato?.finishReason === 'MAX_TOKENS' && texto) {
    texto +=
      '\n\n_(A resposta foi longa e pode ter sido cortada. Peça "continue" se quiser o restante.)_'
  }

  if (!texto) {
    const erro = new Error('O Gemini não retornou texto na resposta')
    erro.status = 502
    erro.modelo = modelo
    throw erro
  }

  return texto
}

export async function gerarRespostaChatbot(textoUsuario, historico = []) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no arquivo .env')
  }

  const contents = historico
    .filter((m) => m.texto?.trim())
    .slice(-12)
    .map((m) => ({
      role: isChatbot(m.usuarioId) ? 'model' : 'user',
      parts: [{ text: m.texto }],
    }))

  contents.push({
    role: 'user',
    parts: [{ text: textoUsuario }],
  })

  const modelos = modelosDisponiveis()
  let ultimoErro = null

  for (const modelo of modelos) {
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      try {
        const texto = await gerarComModelo(apiKey, modelo, contents)
        if (tentativa > 0 || modelo !== modelos[0]) {
          console.log(`[GEMINI] Resposta via ${modelo} (tentativa ${tentativa + 1})`)
        }
        return texto
      } catch (erro) {
        ultimoErro = erro
        const recuperavel = erroRecuperavel(erro.status, erro.message)

        console.warn(
          `[GEMINI] Falha ${modelo} (tentativa ${tentativa + 1}):`,
          erro.message,
        )

        if (!recuperavel) {
          throw erro
        }

        if (tentativa === 0) {
          await aguardar(1500)
        }
      }
    }
  }

  throw new Error(
    ultimoErro?.message ??
      'Serviço de IA indisponível no momento. Tente novamente em alguns instantes.',
  )
}

export { CHATBOT_ID }
