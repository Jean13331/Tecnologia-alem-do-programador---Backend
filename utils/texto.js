const SUBSTITUICOES_MOJIBAKE = [
  ['Ã¡', 'á'],
  ['Ã©', 'é'],
  ['Ã­', 'í'],
  ['Ã³', 'ó'],
  ['Ãº', 'ú'],
  ['Ã£', 'ã'],
  ['Ãµ', 'õ'],
  ['Ã§', 'ç'],
  ['Ã€', 'À'],
  ['Ã‰', 'É'],
  ['Ã', 'Á'],
  ['Ã"', 'Ó'],
  ['Ãš', 'Ú'],
  ['Ãƒ', 'Ã'],
  ['Ã•', 'Õ'],
  ['Ã‡', 'Ç'],
  ['â€™', "'"],
  ['â€œ', '"'],
  ['â€', '"'],
]

/**
 * Corrige texto com acentos quebrados (UTF-8 lido como Latin-1, etc.).
 */
export function normalizarTexto(texto) {
  if (texto == null) return ''
  let resultado = String(texto).normalize('NFC')

  if (resultado.includes('')) {
    try {
      const reparado = Buffer.from(resultado, 'latin1').toString('utf8')
      if (!reparado.includes('')) {
        resultado = reparado
      }
    } catch {
      /* mantém original */
    }
  }

  for (const [errado, certo] of SUBSTITUICOES_MOJIBAKE) {
    if (resultado.includes(errado)) {
      resultado = resultado.split(errado).join(certo)
    }
  }

  return resultado.normalize('NFC')
}
