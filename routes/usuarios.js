import { Router } from 'express'
import { adicionarMoedas, buscarPorId, listarUsuarios } from '../storage/usuarios.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const usuarios = await listarUsuarios()
    console.log('[USUARIOS] Listagem completa:', usuarios.length, 'registro(s)')
    res.json({ usuarios })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ mensagem: 'Erro ao listar usuários' })
  }
})

router.post('/:id/moedas', async (req, res) => {
  try {
    const quantidade = Number(req.body?.quantidade) || 100
    const usuario = await adicionarMoedas(req.params.id, quantidade)

    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' })
    }

    console.log('[MOEDAS] Adicionadas:', { id: usuario.id, quantidade, total: usuario.moedas })

    res.json({
      mensagem: `${quantidade} moedas adicionadas`,
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
