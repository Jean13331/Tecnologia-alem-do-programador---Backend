import { Router } from 'express'
import { buscarPorEmail } from '../storage/usuarios.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { email, senha } = req.body
    const usuario = await buscarPorEmail((email ?? '').trim())

    if (!usuario || usuario.senha !== senha) {
      return res.status(401).json({ mensagem: 'E-mail ou senha incorretos' })
    }

    console.log('[LOGIN] Usuário autenticado:', {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cpf: usuario.cpf,
      moedas: usuario.moedas ?? 0,
    })

    res.json({
      mensagem: 'Login realizado com sucesso',
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
