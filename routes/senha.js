import { Router } from 'express'
import { atualizarSenhaPorEmail, buscarPorEmail } from '../storage/usuarios.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { email, senha } = req.body
    const emailNormalizado = (email ?? '').trim().toLowerCase()

    const usuario = await buscarPorEmail(emailNormalizado)
    if (!usuario) {
      return res.status(404).json({ mensagem: 'E-mail não encontrado' })
    }

    const usuarioAtualizado = await atualizarSenhaPorEmail(
      emailNormalizado,
      senha ?? '',
    )

    console.log('[SENHA] Senha atualizada:', {
      id: usuarioAtualizado.id,
      email: usuarioAtualizado.email,
    })

    res.json({
      mensagem: 'Senha alterada com sucesso',
      usuario: {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        email: usuarioAtualizado.email,
      },
    })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ mensagem: 'Erro interno no servidor' })
  }
})

export default router
