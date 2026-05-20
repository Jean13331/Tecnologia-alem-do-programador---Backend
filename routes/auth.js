import { Router } from 'express'
import { buscarPorEmail, criarUsuario } from '../storage/usuarios.js'

const router = Router()

router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, cpf, senha } = req.body
    const emailNormalizado = (email ?? '').trim().toLowerCase()

    const existente = await buscarPorEmail(emailNormalizado)
    if (existente) {
      return res.status(409).json({ mensagem: 'E-mail já cadastrado' })
    }

    const usuario = await criarUsuario({
      id: Date.now().toString(),
      nome: (nome ?? '').trim(),
      email: emailNormalizado,
      cpf: cpf ?? '',
      senha: senha ?? '',
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

router.post('/login', async (req, res) => {
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
