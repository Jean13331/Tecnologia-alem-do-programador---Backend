import './carregarEnv.js'
import cors from 'cors'
import express from 'express'
import cadastroRoutes from './routes/cadastro.js'
import loginRoutes from './routes/login.js'
import chatRoutes from './routes/chat.js'
import usuariosRoutes from './routes/usuarios.js'
import { configurarSwagger } from './swagger/setup.js'

const app = express()
const PORT = process.env.PORT || 3001

app.set('json spaces', 2)

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
    ],
  }),
)
app.use(express.json({ limit: '2mb' }))

app.use((_req, res, next) => {
  const json = res.json.bind(res)
  res.json = (corpo) => {
    res.set('Content-Type', 'application/json; charset=utf-8')
    return json(corpo)
  }
  next()
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mensagem: 'API Sesi online' })
})

configurarSwagger(app)

app.use('/api/cadastro', cadastroRoutes)
app.use('/api/login', loginRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/chat', chatRoutes)

app.use((erro, _req, res, next) => {
  if (erro instanceof SyntaxError && erro.status === 400 && 'body' in erro) {
    return res.status(400).json({
      mensagem:
        'JSON inválido no corpo da requisição. Em moedasDescontar não use +100 sem aspas. ' +
        'Use número: 100 ou -15, ou string com expressão: "15-30" ou "0-100".',
      detalhe: erro.message,
    })
  }
  next(erro)
})

const servidor = app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
  console.log(
    'Rotas: http://localhost:' + PORT + '/api/docs (Swagger) | Gemini no chat',
  )
  console.log(
    process.env.GEMINI_API_KEY
      ? 'Gemini: API KEY carregada'
      : 'Gemini: GEMINI_API_KEY ausente no .env',
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
