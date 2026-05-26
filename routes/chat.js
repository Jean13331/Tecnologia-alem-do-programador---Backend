import { Router } from 'express'
import {
  autenticar,
  idUsuarioInvalido,
  responderErroIdUsuario,
} from '../middleware/autenticar.js'
import { CHATBOT_ID, gerarRespostaChatbot } from '../services/gemini.js'
import {
  criarMensagem,
  limparMensagensPorUsuario,
  listarMensagensPorUsuario,
} from '../storage/mensagens.js'
import {
  buscarPorId,
  CUSTO_MENSAGEM_CHAT,
  descontarMoedas,
} from '../storage/usuarios.js'
import { normalizarTexto } from '../utils/texto.js'

const router = Router()

router.use(autenticar)

router.get('/', async (req, res) => {
  try {
    const usuarioId = String(req.query.usuarioId ?? '').trim()

    if (idUsuarioInvalido(req, usuarioId)) {
      return responderErroIdUsuario(res)
    }

    const mensagens = await listarMensagensPorUsuario(req.usuarioId)
    res.json({ mensagens })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ mensagem: 'Erro ao listar mensagens' })
  }
})

router.delete('/', async (req, res) => {
  try {
    const usuarioId = String(req.query.usuarioId ?? '').trim()

    if (idUsuarioInvalido(req, usuarioId)) {
      return responderErroIdUsuario(res)
    }

    await limparMensagensPorUsuario(req.usuarioId)
    console.log('[CHAT] Conversa limpa para usuario:', req.usuarioId)
    res.json({ mensagem: 'Conversa limpa com sucesso', mensagens: [] })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ mensagem: 'Erro ao limpar a conversa' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { usuarioId, usuarioCobrancaId, texto } = req.body
    const textoLimpo = normalizarTexto(texto ?? '').trim()
    const idAutenticado = req.usuarioId
    const valorCobranca = CUSTO_MENSAGEM_CHAT

    const idInformadoCobranca = String(
      usuarioCobrancaId ?? usuarioId ?? '',
    ).trim()

    if (idInformadoCobranca && idUsuarioInvalido(req, idInformadoCobranca)) {
      return responderErroIdUsuario(res)
    }

    if (usuarioId && idUsuarioInvalido(req, usuarioId)) {
      return responderErroIdUsuario(res)
    }

    if (!textoLimpo) {
      return res.status(400).json({ mensagem: 'Digite uma mensagem' })
    }

    const usuarioCobrado = await buscarPorId(idAutenticado)

    if (!usuarioCobrado) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' })
    }

    const saldoAtual = usuarioCobrado.moedas ?? 0

    if (saldoAtual < valorCobranca) {
      return res.status(402).json({
        mensagem: `Moedas insuficientes. São necessárias ${valorCobranca} moedas (saldo: ${saldoAtual}).`,
        moedasNecessarias: valorCobranca,
        moedas: saldoAtual,
      })
    }

    const resultadoCobranca = await descontarMoedas(idAutenticado, valorCobranca)

    if (!resultadoCobranca.ok) {
      if (resultadoCobranca.motivo === 'insuficiente') {
        return res.status(402).json({
          mensagem: `Moedas insuficientes. São necessárias ${valorCobranca} moedas (saldo: ${resultadoCobranca.moedas ?? 0}).`,
          moedasNecessarias: valorCobranca,
          moedas: resultadoCobranca.moedas ?? 0,
        })
      }
      return res.status(404).json({ mensagem: 'Usuário não encontrado' })
    }

    const mensagemUsuario = {
      id: `${Date.now()}-u`,
      usuarioId: idAutenticado,
      conversaUsuarioId: idAutenticado,
      nome: usuarioCobrado.nome,
      texto: textoLimpo,
      criadoEm: new Date().toISOString(),
    }

    await criarMensagem(mensagemUsuario)

    const historico = await listarMensagensPorUsuario(idAutenticado)
    const historicoAnterior = historico.slice(0, -1)

    let mensagemBot

    try {
      const respostaGemini = await gerarRespostaChatbot(textoLimpo, historicoAnterior)

      mensagemBot = {
        id: `${Date.now()}-b`,
        usuarioId: CHATBOT_ID,
        conversaUsuarioId: idAutenticado,
        nome: 'ChatBot',
        texto: respostaGemini,
        criadoEm: new Date().toISOString(),
      }

      await criarMensagem(mensagemBot)
    } catch (erroGemini) {
      console.error('[CHAT] Erro Gemini:', erroGemini.message)

      mensagemBot = {
        id: `${Date.now()}-e`,
        usuarioId: CHATBOT_ID,
        conversaUsuarioId: idAutenticado,
        nome: 'ChatBot',
        texto: `Não consegui responder agora: ${erroGemini.message}`,
        criadoEm: new Date().toISOString(),
      }

      await criarMensagem(mensagemBot)
    }

    res.status(201).json({
      mensagem: 'Mensagem enviada',
      chat: mensagemUsuario,
      resposta: mensagemBot,
      moedasDescontadas: valorCobranca,
      usuarioCobranca: {
        id: resultadoCobranca.usuario.id,
        nome: resultadoCobranca.usuario.nome,
        moedas: resultadoCobranca.usuario.moedas,
      },
    })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ mensagem: 'Erro ao enviar mensagem' })
  }
})

export default router
