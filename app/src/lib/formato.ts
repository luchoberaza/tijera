const fmtMoneda = new Intl.NumberFormat('es-UY', {
  style: 'currency',
  currency: 'UYU',
  maximumFractionDigits: 0,
})

const fmtNumero = new Intl.NumberFormat('es-UY', { maximumFractionDigits: 0 })

/** 2400 → "$ 2.400" */
export const moneda = (n: number) => fmtMoneda.format(n).replace(/\s/g, ' ')

/** 2400 → "2.400" */
export const numero = (n: number) => fmtNumero.format(n)

/** 0.732 → "73%" */
export const porcentaje = (n: number, decimales = 0) =>
  `${(n * 100).toFixed(decimales).replace('.', ',')}%`

/** "+59899123456" → "099 123 456" */
export const telefonoLegible = (tel: string) => {
  const limpio = tel.replace(/\D/g, '')
  const nac = limpio.startsWith('598') ? `0${limpio.slice(3)}` : limpio
  if (nac.length !== 9) return tel
  return `${nac.slice(0, 3)} ${nac.slice(3, 6)} ${nac.slice(6)}`
}

/** Primer nombre, para saludos y columnas angostas. */
export const primerNombre = (nombre: string) => nombre.split(' ')[0]

/** "Valeria Núñez" → "V. Núñez" */
export const nombreCorto = (nombre: string) => {
  const partes = nombre.split(' ').filter(Boolean)
  if (partes.length < 2) return nombre
  return `${partes[0][0]}. ${partes[partes.length - 1]}`
}
