import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import swaggerUi from 'swagger-ui-express'

const pastaSwagger = path.dirname(fileURLToPath(import.meta.url))
const especificacao = JSON.parse(
  readFileSync(path.join(pastaSwagger, 'openapi.json'), 'utf-8'),
)

export function configurarSwagger(app) {
  app.get('/api/docs/openapi.json', (_req, res) => {
    res.json(especificacao)
  })

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(especificacao, {
      customSiteTitle: 'API Sesi — Swagger',
      swaggerOptions: {
        docExpansion: 'list',
        defaultModelsExpandDepth: 1,
      },
    }),
  )
}
