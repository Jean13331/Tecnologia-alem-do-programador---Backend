import { Router } from 'express'
import {
  autenticar,
  idUsuarioInvalido,
  responderErroIdUsuario,
} from '../middleware/autenticar.js'
import { adicionarMoedas, buscarPorId } from '../storage/usuarios.js'

const router = Router()

function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    cpf: usuario.cpf,
    moedas: usuario.moedas ?? 0,
  }
}

router.get('/me', autenticar, async (req, res) => {
  try {
    const usuario = await buscarPorId(req.usuarioId)

    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' })
    }

    res.json({ usuario: usuarioPublico(usuario) })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ mensagem: 'Erro ao buscar usuário' })
  }
})

router.get('/', autenticar, (_req, res) => {
  res.status(403).json({ mensagem: 'Acesso negado' })
})

router.post('/:id/moedas', autenticar, async (req, res) => {
  try {
    if (idUsuarioInvalido(req, req.params.id)) {
      return responderErroIdUsuario(res)
    }

    const quantidade = Number(req.body?.quantidade) || 100
    const usuario = await adicionarMoedas(req.usuarioId, quantidade)

    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' })
    }

    res.json({
      mensagem: `${quantidade} moedas adicionadas`,
      usuario: usuarioPublico(usuario),
    })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ mensagem: 'Erro interno no servidor' })
  }
})

router.get('/:id', autenticar, async (req, res) => {
  try {
    if (idUsuarioInvalido(req, req.params.id)) {
      return responderErroIdUsuario(res)
    }

    const usuario = await buscarPorId(req.usuarioId)

    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' })
    }

    res.json({ usuario: usuarioPublico(usuario) })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ mensagem: 'Erro interno no servidor' })
  }
})

export default router
