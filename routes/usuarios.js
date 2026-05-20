import { Router } from 'express'
import { buscarPorId } from '../storage/usuarios.js'

const router = Router()

router.get('/:id', async (req, res) => {
  try {
    const usuario = await buscarPorId(req.params.id)

    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' })
    }

    res.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf,
        moedas: usuario.moedas ?? 0,
      },
    })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ mensagem: 'Erro interno no servidor' })
  }
})

export default router
