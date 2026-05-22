import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const pastaBackend = dirname(fileURLToPath(import.meta.url))

export function carregarEnv() {
  const caminhoEnv = join(pastaBackend, '.env')

  if (!existsSync(caminhoEnv)) {
    return false
  }

  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(caminhoEnv)
      return true
    } catch {
      /* fallback abaixo */
    }
  }

  const conteudo = readFileSync(caminhoEnv, 'utf8').replace(/^\uFEFF/, '')

  for (const linha of conteudo.split(/\r?\n/)) {
    const texto = linha.trim()
    if (!texto || texto.startsWith('#')) continue

    const igual = texto.indexOf('=')
    if (igual <= 0) continue

    const chave = texto.slice(0, igual).trim()
    let valor = texto.slice(igual + 1).trim()

    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1)
    }

    if (process.env[chave] === undefined) {
      process.env[chave] = valor
    }
  }

  return true
}

carregarEnv()
