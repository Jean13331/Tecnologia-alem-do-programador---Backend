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
    texto.includes('unavailable') ||
    texto.includes('fetch failed') ||
    texto.includes('socket') ||
    texto.includes('econnreset') ||
    texto.includes('enotfound') ||
    texto.includes('etimedout') ||
    texto.includes('certificate') ||
    texto.includes('ssl')
  )
}

export function isChatbot(usuarioId) {
  return usuarioId === CHATBOT_ID
}

function montarErroFetch(mensagem, causaOriginal) {
  const erro = new Error(mensagem)
  erro.code = causaOriginal?.code
  erro.causaOriginal = causaOriginal
  return erro
}

async function gerarComModelo(apiKey, modelo, contents) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`

  let resposta
  const tempoLimiteMs = Number(process.env.GEMINI_FETCH_TIMEOUT_MS) || 60_000
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), tempoLimiteMs)

  try {
    resposta = await fetch(url, {
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
      signal: ctl.signal,
    })
  } catch (fetchErr) {
    const codigo =
      typeof fetchErr === 'object' && fetchErr && 'cause' in fetchErr
        ? fetchErr.cause
        : fetchErr

    let detalhe = fetchErr.message || 'Erro de rede'

    const code =
      codigo &&
      typeof codigo === 'object' &&
      'code' in codigo &&
      typeof codigo.code === 'string'
        ? codigo.code
        : null

    if (code === 'ENOTFOUND') {
      detalhe +=
        '. Sem DNS/rede até generativelanguage.googleapis.com — verifique internet e firewall.'
    } else if (code === 'ECONNRESET' || code === 'ECONNREFUSED') {
      detalhe +=
        '. Conexão bloqueada ou recusada — proxy corporativo/VPN/antivírus com frequência causa isso.'
    } else if (code === 'ETIMEDOUT' || fetchErr.name === 'AbortError') {
      detalhe +=
        '. Tempo esgotado — rede lenta ou serviço inacessível neste momento.'
    } else if (code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || code === 'CERT_HAS_EXPIRED') {
      detalhe += '. Falha ao validar HTTPS (certificado/inspeção SSL).'
    }

    console.warn('[GEMINI] Detalhe da rede:', {
      modelo,
      code,
      message: fetchErr.message,
      causa: codigo instanceof Error ? codigo.message : codigo,
    })

    throw montarErroFetch(`Falha de rede ao Gemini: ${detalhe}`, codigo instanceof Error ? codigo : fetchErr)
  } finally {
    clearTimeout(timer)
  }

  let dados
  try {
    dados = await resposta.json()
  } catch {
    const texto = await resposta.text().catch(() => '')
    throw montarErroFetch(
      `Resposta Gemini inválida (HTTP ${resposta.status}). ${texto.slice(0, 200)}`,
      null,
    )
  }

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
