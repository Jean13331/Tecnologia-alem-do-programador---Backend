import { Router } from 'express'
import { criptografarSenha } from '../services/senha.js'
import { buscarPorEmail, criarUsuario } from '../storage/usuarios.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { nome, email, cpf, senha } = req.body
    const emailNormalizado = (email ?? '').trim().toLowerCase()
    const nomeLimpo = (nome ?? '').trim()

    if (!nomeLimpo) {
      return res.status(400).json({ mensagem: 'Preencha o nome' })
    }

    if (!emailNormalizado) {
      return res.status(400).json({ mensagem: 'Preencha o e-mail' })
    }

    if (!emailNormalizado.includes('@')) {
      return res.status(400).json({ mensagem: 'E-mail deve conter @' })
    }

    if (!senha) {
      return res.status(400).json({ mensagem: 'Preencha a senha' })
    }

    const existente = await buscarPorEmail(emailNormalizado)
    if (existente) {
      return res.status(409).json({ mensagem: 'E-mail já cadastrado' })
    }

    const senhaHash = await criptografarSenha(senha)

    const usuario = await criarUsuario({
      nome: nomeLimpo,
      email: emailNormalizado,
      cpf: cpf ?? '',
      senha: senhaHash,
      criadoEm: new Date().toISOString(),
    })

    console.log('[CADASTRO] Novo usuário:', {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cpf: usuario.cpf,
      moedas: usuario.moedas,
    })

    res.status(201).json({
      mensagem: 'Cadastro realizado com sucesso',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf,
        moedas: usuario.moedas,
      },
    })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ mensagem: 'Erro interno no servidor' })
  }
})

export default router
