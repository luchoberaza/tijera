import {
  addDays,
  addMinutes,
  differenceInMinutes,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { DiaSemana, Tramo } from './tipos'

export const LOCALE = { locale: es }

export const DIAS_LARGOS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const

export const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const

export const d = (iso: string | Date) => (typeof iso === 'string' ? parseISO(iso) : iso)

/** "14:30" */
export const hhmm = (iso: string | Date) => format(d(iso), 'HH:mm')

/** "lun 14 de julio" */
export const fechaCorta = (iso: string | Date) => format(d(iso), "EEE d 'de' MMMM", LOCALE)

/** "Lunes 14 de julio" con mayúscula inicial */
export const fechaLarga = (iso: string | Date) => {
  const s = format(d(iso), "EEEE d 'de' MMMM", LOCALE)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "14 jul" */
export const fechaMini = (iso: string | Date) => format(d(iso), 'd MMM', LOCALE)

/** "3 de septiembre de 2021" — agrega el año solo si no es el actual. */
export const fechaConAnio = (iso: string | Date) => {
  const f = d(iso)
  const patron =
    f.getFullYear() === new Date().getFullYear() ? "d 'de' MMMM" : "d 'de' MMMM 'de' yyyy"
  return format(f, patron, LOCALE)
}

/** Clave de día para agrupar: "2026-07-30" */
export const claveDia = (iso: string | Date) => format(d(iso), 'yyyy-MM-dd')

/** "Hoy" / "Mañana" / "Ayer" / "mar 12 de agosto" */
export const fechaRelativa = (iso: string | Date) => {
  const f = d(iso)
  if (isToday(f)) return 'Hoy'
  if (isTomorrow(f)) return 'Mañana'
  if (isYesterday(f)) return 'Ayer'
  return fechaCorta(f)
}

/** "hace 5 min" / "hace 2 h" / "12 jul" */
export const haceCuanto = (iso: string | Date, ahora = new Date()) => {
  const min = differenceInMinutes(ahora, d(iso))
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  if (min < 60 * 24) return `hace ${Math.floor(min / 60)} h`
  const dias = Math.floor(min / (60 * 24))
  if (dias < 7) return `hace ${dias} d`
  return fechaMini(iso)
}

/** Minutos desde medianoche. */
export const minutosDelDia = (iso: string | Date) => {
  const f = d(iso)
  return f.getHours() * 60 + f.getMinutes()
}

/** "09:30" → 570 */
export const aMinutos = (hm: string) => {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

/** 570 → "09:30" */
export const aHora = (min: number) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Duración legible: 95 → "1 h 35 min" */
export const duracionLegible = (min: number) => {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/** Combina un día con "HH:mm" y devuelve un Date. */
export const conHora = (dia: Date, hm: string) => {
  const [h, m] = hm.split(':').map(Number)
  const f = startOfDay(dia)
  f.setHours(h, m, 0, 0)
  return f
}

export const diaSemana = (fecha: Date): DiaSemana => fecha.getDay() as DiaSemana

/** Lunes de la semana de `fecha`. */
export const inicioSemana = (fecha: Date) => startOfWeek(fecha, { weekStartsOn: 1 })
export const finSemana = (fecha: Date) => endOfWeek(fecha, { weekStartsOn: 1 })

/** Los 6 días laborables (lun–sáb) de la semana de `fecha`. */
export const diasDeSemana = (fecha: Date, cantidad = 6) =>
  Array.from({ length: cantidad }, (_, i) => addDays(inicioSemana(fecha), i))

/** ¿Se solapan dos rangos? */
export const seSolapan = (aIni: Date, aFin: Date, bIni: Date, bFin: Date) =>
  aIni < bFin && bIni < aFin

/** Rango de un tramo horario aplicado a un día concreto. */
export const tramoADate = (dia: Date, tramo: Tramo) => ({
  inicio: conHora(dia, tramo.inicio),
  fin: conHora(dia, tramo.fin),
})

export { addDays, addMinutes, differenceInMinutes, format, isSameDay, isToday, startOfDay }
