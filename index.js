import cors from 'cors'
import express from 'express'
import cadastroRoutes from './routes/cadastro.js'
import loginRoutes from './routes/login.js'
import usuariosRoutes from './routes/usuarios.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
    ],
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mensagem: 'API Sessi online' })
})

app.use('/api/cadastro', cadastroRoutes)
app.use('/api/login', loginRoutes)
app.use('/api/usuarios', usuariosRoutes)

const servidor = app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
  console.log(
    'Rotas: POST /api/cadastro | POST /api/login | GET /api/usuarios/:id',
  )
})

servidor.on('error', (erro) => {
  if (erro.code === 'EADDRINUSE') {
    console.error(
      `Porta ${PORT} já está em uso. Feche o outro processo ou use: set PORT=3002 && npm run dev`,
    )
    process.exit(1)
  }
  throw erro
})
