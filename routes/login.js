import { Router } from 'express'
import { compararSenha } from '../services/senha.js'
import { gerarToken } from '../services/token.js'
import { buscarPorEmail } from '../storage/usuarios.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { email, senha } = req.body
    const emailNormalizado = (email ?? '').trim().toLowerCase()

    if (!emailNormalizado || !senha) {
      return res.status(400).json({ mensagem: 'Informe e-mail e senha' })
    }

    const usuario = await buscarPorEmail(emailNormalizado)

    if (!usuario || !(await compararSenha(senha, usuario.senha))) {
      return res.status(401).json({ mensagem: 'E-mail ou senha incorretos' })
    }

    const token = gerarToken(usuario.id)

    console.log('[LOGIN] Usuário autenticado:', {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    })

    res.json({
      mensagem: 'Login realizado com sucesso',
      token,
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
