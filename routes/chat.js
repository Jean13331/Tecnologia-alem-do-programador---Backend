import { Router } from 'express'
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
import { resolverCustoMoedas } from '../utils/moedasCliente.js'
import { normalizarTexto } from '../utils/texto.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const usuarioId = String(req.query.usuarioId ?? '').trim()
    if (!usuarioId) {
      return res.status(400).json({ mensagem: 'Informe o usuarioId na consulta' })
    }

    const mensagens = await listarMensagensPorUsuario(usuarioId)
    res.json({ mensagens })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ mensagem: 'Erro ao listar mensagens' })
  }
})

router.delete('/', async (req, res) => {
  try {
    const usuarioId = String(req.query.usuarioId ?? '').trim()
    if (!usuarioId) {
      return res.status(400).json({ mensagem: 'Informe o usuarioId na consulta' })
    }

    await limparMensagensPorUsuario(usuarioId)
    console.log('[CHAT] Conversa limpa para usuario:', usuarioId)
    res.json({ mensagem: 'Conversa limpa com sucesso', mensagens: [] })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ mensagem: 'Erro ao limpar a conversa' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { usuarioId, usuarioCobrancaId, nome, texto } = req.body
    const textoLimpo = normalizarTexto(texto ?? '').trim()
    const idCobranca = (usuarioCobrancaId ?? usuarioId ?? '').trim()
    let valorCobranca

    try {
      valorCobranca = resolverCustoMoedas(req.body)
    } catch {
      return res.status(400).json({
        mensagem:
          'Valor ou expressão de moedas inválida. Use número, negativo (ex.: -15) ou expressão (ex.: 15-30).',
      })
    }

    if (!textoLimpo) {
      return res.status(400).json({ mensagem: 'Digite uma mensagem' })
    }

    if (!idCobranca) {
      return res.status(400).json({ mensagem: 'Informe o usuário para cobrança de moedas' })
    }

    const usuarioCobrado = await buscarPorId(idCobranca)

    if (!usuarioCobrado) {
      return res.status(404).json({ mensagem: 'Usuário para cobrança não encontrado' })
    }

    const saldoAtual = usuarioCobrado.moedas ?? 0

    if (valorCobranca > 0 && saldoAtual < valorCobranca) {
      return res.status(402).json({
        mensagem: `Moedas insuficientes. São necessárias ${valorCobranca} moedas (saldo: ${saldoAtual}).`,
        moedasNecessarias: valorCobranca,
        moedas: saldoAtual,
        usuarioCobrancaId: idCobranca,
      })
    }

    const resultadoCobranca = await descontarMoedas(idCobranca, valorCobranca)

    if (!resultadoCobranca.ok) {
      if (resultadoCobranca.motivo === 'insuficiente') {
        return res.status(402).json({
          mensagem: `Moedas insuficientes. São necessárias ${valorCobranca} moedas (saldo: ${resultadoCobranca.moedas ?? 0}).`,
          moedasNecessarias: valorCobranca,
          moedas: resultadoCobranca.moedas ?? 0,
          usuarioCobrancaId: idCobranca,
        })
      }
      return res.status(404).json({ mensagem: 'Usuário para cobrança não encontrado' })
    }

    console.log('[CHAT] Moedas descontadas:', {
      usuarioCobrancaId: idCobranca,
      desconto: valorCobranca,
      saldoRestante: resultadoCobranca.usuario.moedas,
      custoPadrao: CUSTO_MENSAGEM_CHAT,
    })

    const donoConversa = String(usuarioId ?? idCobranca).trim()

    const mensagemUsuario = {
      id: `${Date.now()}-u`,
      usuarioId: usuarioId ?? '',
      conversaUsuarioId: donoConversa,
      nome: (nome ?? '').trim() || 'Anônimo',
      texto: textoLimpo,
      criadoEm: new Date().toISOString(),
    }

    await criarMensagem(mensagemUsuario)
    console.log('[CHAT] Usuário:', mensagemUsuario)

    const historico = await listarMensagensPorUsuario(donoConversa)
    const historicoAnterior = historico.slice(0, -1)

    let mensagemBot

    try {
      const respostaGemini = await gerarRespostaChatbot(textoLimpo, historicoAnterior)

      mensagemBot = {
        id: `${Date.now()}-b`,
        usuarioId: CHATBOT_ID,
        conversaUsuarioId: donoConversa,
        nome: 'ChatBot',
        texto: respostaGemini,
        criadoEm: new Date().toISOString(),
      }

      await criarMensagem(mensagemBot)
      console.log('[CHAT] ChatBot (Gemini):', mensagemBot)
    } catch (erroGemini) {
      console.error('[CHAT] Erro Gemini:', erroGemini.message)

      mensagemBot = {
        id: `${Date.now()}-e`,
        usuarioId: CHATBOT_ID,
        conversaUsuarioId: donoConversa,
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
