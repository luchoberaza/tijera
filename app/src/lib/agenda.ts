import { differenceInCalendarDays } from 'date-fns'
import {
  aMinutos,
  addMinutes,
  claveDia,
  conHora,
  d,
  diaSemana,
  isSameDay,
  minutosDelDia,
  seSolapan,
  startOfDay,
} from './fecha'
import type {
  Bloqueo,
  Clienta,
  EstadoSalon,
  EstadoTurno,
  ID,
  Profesional,
  Servicio,
  Turno,
} from './tipos'

/* ------------------------------ Estados UI -------------------------------- */

export const ESTADO_TURNO: Record<
  EstadoTurno,
  { label: string; badge: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'; punto: string }
> = {
  pendiente: { label: 'Sin confirmar', badge: 'warning', punto: 'var(--warning)' },
  confirmado: { label: 'Confirmado', badge: 'info', punto: 'var(--info)' },
  en_curso: { label: 'En sillón', badge: 'primary', punto: 'var(--primary)' },
  completado: { label: 'Atendida', badge: 'success', punto: 'var(--success)' },
  no_asistio: { label: 'No vino', badge: 'danger', punto: 'var(--danger)' },
  cancelado: { label: 'Cancelado', badge: 'neutral', punto: 'var(--muted-fg)' },
}

export const ORIGEN_TURNO = {
  whatsapp: 'WhatsApp',
  manual: 'Cargado a mano',
  walkin: 'Sin turno previo',
} as const

export const METODO_PAGO = {
  efectivo: 'Efectivo',
  debito: 'Débito',
  credito: 'Crédito',
  transferencia: 'Transferencia',
} as const

/** Turnos que efectivamente ocupan lugar en la agenda. */
export const OCUPA_AGENDA: EstadoTurno[] = ['pendiente', 'confirmado', 'en_curso', 'completado']

export const esActivo = (t: Turno) => OCUPA_AGENDA.includes(t.estado)

/* --------------------------------- Lookups -------------------------------- */

export const buscarServicio = (e: EstadoSalon, id: ID) => e.servicios.find((s) => s.id === id)
export const buscarClienta = (e: EstadoSalon, id: ID) => e.clientas.find((c) => c.id === id)
export const buscarProfesional = (e: EstadoSalon, id: ID) => e.profesionales.find((p) => p.id === id)

export const serviciosDeTurno = (e: EstadoSalon, t: Turno): Servicio[] =>
  t.serviciosIds.map((id) => buscarServicio(e, id)).filter((s): s is Servicio => Boolean(s))

export const nombreServicios = (e: EstadoSalon, t: Turno) =>
  serviciosDeTurno(e, t)
    .map((s) => s.nombre)
    .join(' + ')

export const duracionTotal = (e: EstadoSalon, ids: ID[]) =>
  ids.reduce((s, id) => s + (buscarServicio(e, id)?.duracionMin ?? 0), 0)

export const precioTotal = (e: EstadoSalon, ids: ID[]) =>
  ids.reduce((s, id) => s + (buscarServicio(e, id)?.precio ?? 0), 0)

/** Minutos de procesado del servicio más largo: hueco aprovechable. */
export const procesadoTotal = (e: EstadoSalon, ids: ID[]) =>
  Math.max(0, ...ids.map((id) => buscarServicio(e, id)?.procesadoMin ?? 0))

/* ------------------------------- Consultas -------------------------------- */

export const turnosDelDia = (e: EstadoSalon, dia: Date, profesionalId?: ID) =>
  e.turnos
    .filter((t) => isSameDay(d(t.inicio), dia))
    .filter((t) => !profesionalId || t.profesionalId === profesionalId)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))

export const bloqueosDelDia = (e: EstadoSalon, dia: Date, profesionalId?: ID) =>
  e.bloqueos
    .filter((b) => isSameDay(d(b.inicio), dia))
    .filter((b) => !profesionalId || b.profesionalId === profesionalId || b.profesionalId === 'todos')

export const turnosDeClienta = (e: EstadoSalon, clientaId: ID) =>
  e.turnos.filter((t) => t.clientaId === clientaId).sort((a, b) => b.inicio.localeCompare(a.inicio))

/** Tramos de trabajo de una profesional en un día concreto. */
export const jornadaDe = (prof: Profesional, dia: Date) => prof.horario[diaSemana(dia)] ?? []

export const trabajaEse = (prof: Profesional, dia: Date) => jornadaDe(prof, dia).length > 0

/* ------------------------------- Conflictos ------------------------------- */

export interface Conflicto {
  tipo: 'turno' | 'bloqueo' | 'horario'
  mensaje: string
}

/**
 * Verifica si una franja es válida para una profesional: que trabaje ese día,
 * que esté dentro de su horario y que no pise otro turno ni un bloqueo.
 */
export function verificarDisponibilidad(
  e: EstadoSalon,
  profesionalId: ID,
  inicio: Date,
  fin: Date,
  ignorarTurnoId?: ID,
): Conflicto | null {
  const prof = buscarProfesional(e, profesionalId)
  if (!prof) return { tipo: 'horario', mensaje: 'Profesional no encontrada.' }

  const tramos = jornadaDe(prof, inicio)
  if (!tramos.length) {
    return { tipo: 'horario', mensaje: `${prof.nombre.split(' ')[0]} no trabaja ese día.` }
  }

  const dentro = tramos.some((tramo) => {
    const ti = conHora(inicio, tramo.inicio)
    const tf = conHora(inicio, tramo.fin)
    return inicio >= ti && fin <= tf
  })
  if (!dentro) {
    const rango = tramos.map((t) => `${t.inicio}–${t.fin}`).join(' y ')
    return {
      tipo: 'horario',
      mensaje: `Queda fuera del horario de ${prof.nombre.split(' ')[0]} (${rango}).`,
    }
  }

  const choque = e.turnos.find(
    (t) =>
      t.id !== ignorarTurnoId &&
      t.profesionalId === profesionalId &&
      esActivo(t) &&
      seSolapan(inicio, fin, d(t.inicio), d(t.fin)),
  )
  if (choque) {
    const cli = buscarClienta(e, choque.clientaId)
    return {
      tipo: 'turno',
      mensaje: `Se superpone con el turno de ${cli?.nombre ?? 'otra clienta'} (${hora(choque.inicio)}–${hora(choque.fin)}).`,
    }
  }

  const bloqueo = e.bloqueos.find(
    (b) =>
      (b.profesionalId === profesionalId || b.profesionalId === 'todos') &&
      seSolapan(inicio, fin, d(b.inicio), d(b.fin)),
  )
  if (bloqueo) {
    return { tipo: 'bloqueo', mensaje: `Choca con un bloqueo: ${bloqueo.motivo}.` }
  }

  return null
}

const hora = (iso: string) => {
  const f = d(iso)
  return `${String(f.getHours()).padStart(2, '0')}:${String(f.getMinutes()).padStart(2, '0')}`
}

/* ------------------------------ Huecos libres ----------------------------- */

export interface Hueco {
  inicio: Date
  fin: Date
}

/**
 * Devuelve los horarios en los que una profesional puede tomar un servicio de
 * `duracionMin`. Es exactamente lo que el bot le ofrece a la clienta por
 * WhatsApp: nunca propone algo que ya está tomado.
 */
export function huecosLibres(
  e: EstadoSalon,
  profesionalId: ID,
  dia: Date,
  duracionMin: number,
  opciones: { desde?: Date; ignorarTurnoId?: ID } = {},
): Hueco[] {
  const prof = buscarProfesional(e, profesionalId)
  if (!prof || duracionMin <= 0) return []

  const tramos = jornadaDe(prof, dia)
  if (!tramos.length) return []

  const paso = e.ajustes.agenda.intervaloMin
  const minimo = opciones.desde && isSameDay(opciones.desde, dia) ? opciones.desde : startOfDay(dia)

  const ocupados: [Date, Date][] = [
    ...e.turnos
      .filter(
        (t) =>
          t.profesionalId === profesionalId &&
          esActivo(t) &&
          t.id !== opciones.ignorarTurnoId &&
          isSameDay(d(t.inicio), dia),
      )
      .map((t) => [d(t.inicio), d(t.fin)] as [Date, Date]),
    ...e.bloqueos
      .filter(
        (b) =>
          (b.profesionalId === profesionalId || b.profesionalId === 'todos') &&
          isSameDay(d(b.inicio), dia),
      )
      .map((b) => [d(b.inicio), d(b.fin)] as [Date, Date]),
  ]

  const huecos: Hueco[] = []

  for (const tramo of tramos) {
    const abre = aMinutos(tramo.inicio)
    const cierra = aMinutos(tramo.fin)

    for (let m = abre; m + duracionMin <= cierra; m += paso) {
      const inicio = conHora(dia, `${pad(Math.floor(m / 60))}:${pad(m % 60)}`)
      const fin = addMinutes(inicio, duracionMin)
      if (inicio < minimo) continue
      const libre = !ocupados.some(([oi, of_]) => seSolapan(inicio, fin, oi, of_))
      if (libre) huecos.push({ inicio, fin })
    }
  }

  return huecos
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Primeros huecos disponibles en los próximos días, sin importar el día
 * concreto. Es lo que se usa para "el próximo lugar libre".
 */
export function proximosHuecos(
  e: EstadoSalon,
  profesionalId: ID,
  duracionMin: number,
  desde: Date,
  cantidad = 6,
  diasAdelante = 14,
): Hueco[] {
  const encontrados: Hueco[] = []
  for (let i = 0; i < diasAdelante && encontrados.length < cantidad; i++) {
    const dia = new Date(desde)
    dia.setDate(dia.getDate() + i)
    const huecos = huecosLibres(e, profesionalId, dia, duracionMin, { desde })
    // Un par por día para no saturar con opciones casi idénticas
    for (const h of huecos.filter((_, idx) => idx % 4 === 0)) {
      if (encontrados.length >= cantidad) break
      encontrados.push(h)
    }
  }
  return encontrados
}

/**
 * Franjas contiguas libres dentro de la jornada de una profesional: lo que en
 * la grilla se dibuja como "hueco" y en la práctica es tiempo sin vender.
 */
export function franjasLibres(e: EstadoSalon, profesionalId: ID, dia: Date, minimoMin = 20): Hueco[] {
  const prof = buscarProfesional(e, profesionalId)
  if (!prof) return []

  const ocupados = [
    ...e.turnos
      .filter((t) => t.profesionalId === profesionalId && esActivo(t) && isSameDay(d(t.inicio), dia))
      .map((t) => [d(t.inicio), d(t.fin)] as [Date, Date]),
    ...e.bloqueos
      .filter(
        (b) =>
          (b.profesionalId === profesionalId || b.profesionalId === 'todos') &&
          isSameDay(d(b.inicio), dia),
      )
      .map((b) => [d(b.inicio), d(b.fin)] as [Date, Date]),
  ].sort((a, b) => a[0].getTime() - b[0].getTime())

  const libres: Hueco[] = []

  for (const tramo of jornadaDe(prof, dia)) {
    let cursor = conHora(dia, tramo.inicio)
    const cierre = conHora(dia, tramo.fin)

    for (const [oi, of_] of ocupados) {
      if (of_ <= cursor || oi >= cierre) continue
      if (oi > cursor && (oi.getTime() - cursor.getTime()) / 60000 >= minimoMin) {
        libres.push({ inicio: cursor, fin: oi })
      }
      if (of_ > cursor) cursor = of_
    }

    if (cierre > cursor && (cierre.getTime() - cursor.getTime()) / 60000 >= minimoMin) {
      libres.push({ inicio: cursor, fin: cierre })
    }
  }

  return libres
}

/* -------------------------------- Métricas -------------------------------- */

export interface MetricasDia {
  total: number
  activos: number
  completados: number
  pendientes: number
  confirmados: number
  noAsistio: number
  cancelados: number
  facturado: number
  esperado: number
  minutosOcupados: number
  minutosDisponibles: number
  ocupacion: number
  clientasNuevas: number
  porWhatsapp: number
  huecosLibres: number
}

export function metricasDelDia(e: EstadoSalon, dia: Date): MetricasDia {
  const turnos = turnosDelDia(e, dia)
  const activos = turnos.filter(esActivo)

  const minutosOcupados = activos.reduce(
    (s, t) => s + (d(t.fin).getTime() - d(t.inicio).getTime()) / 60000,
    0,
  )

  let minutosDisponibles = 0
  for (const prof of e.profesionales.filter((p) => p.activo)) {
    for (const tramo of jornadaDe(prof, dia)) {
      minutosDisponibles += aMinutos(tramo.fin) - aMinutos(tramo.inicio)
    }
  }
  for (const b of bloqueosDelDia(e, dia)) {
    const mins = (d(b.fin).getTime() - d(b.inicio).getTime()) / 60000
    minutosDisponibles -= b.profesionalId === 'todos' ? mins * e.profesionales.length : mins
  }
  minutosDisponibles = Math.max(0, minutosDisponibles)

  const completados = turnos.filter((t) => t.estado === 'completado')
  const facturado = completados.reduce((s, t) => s + (t.pago?.monto ?? 0) + (t.pago?.propina ?? 0), 0)
  const esperado = activos.reduce((s, t) => s + t.precioTotal, 0)

  const clientasNuevas = new Set(
    activos
      .map((t) => buscarClienta(e, t.clientaId))
      .filter((c): c is Clienta => Boolean(c))
      .filter((c) => c.etiquetas.includes('Nueva'))
      .map((c) => c.id),
  ).size

  const librePorProf = e.profesionales
    .filter((p) => p.activo && trabajaEse(p, dia))
    .reduce((s, p) => s + huecosLibres(e, p.id, dia, 45, { desde: new Date() }).length, 0)

  return {
    total: turnos.length,
    activos: activos.length,
    completados: completados.length,
    pendientes: turnos.filter((t) => t.estado === 'pendiente').length,
    confirmados: turnos.filter((t) => t.estado === 'confirmado').length,
    noAsistio: turnos.filter((t) => t.estado === 'no_asistio').length,
    cancelados: turnos.filter((t) => t.estado === 'cancelado').length,
    facturado,
    esperado,
    minutosOcupados,
    minutosDisponibles,
    ocupacion: minutosDisponibles > 0 ? minutosOcupados / minutosDisponibles : 0,
    clientasNuevas,
    porWhatsapp: activos.filter((t) => t.origen === 'whatsapp').length,
    huecosLibres: librePorProf,
  }
}

/* ------------------------- Estadísticas de clienta ------------------------ */

export interface ResumenClienta {
  visitas: number
  gastoTotal: number
  ticketPromedio: number
  ausencias: number
  ultimaVisita?: Turno
  proximoTurno?: Turno
  servicioHabitual?: string
  profesionalHabitual?: Profesional
  diasDesdeUltima?: number
}

export function resumenClienta(e: EstadoSalon, clientaId: ID, ahora = new Date()): ResumenClienta {
  const turnos = turnosDeClienta(e, clientaId)
  const completados = turnos.filter((t) => t.estado === 'completado')
  const gastoTotal = completados.reduce((s, t) => s + (t.pago?.monto ?? t.precioTotal), 0)

  const conteoServicio = new Map<string, number>()
  const conteoProf = new Map<string, number>()
  for (const t of completados) {
    for (const id of t.serviciosIds) conteoServicio.set(id, (conteoServicio.get(id) ?? 0) + 1)
    conteoProf.set(t.profesionalId, (conteoProf.get(t.profesionalId) ?? 0) + 1)
  }

  const top = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]

  const ultimaVisita = completados.find((t) => d(t.inicio) <= ahora)
  const proximoTurno = [...turnos]
    .reverse()
    .find((t) => d(t.inicio) > ahora && esActivo(t))

  return {
    visitas: completados.length,
    gastoTotal,
    ticketPromedio: completados.length ? Math.round(gastoTotal / completados.length) : 0,
    ausencias: turnos.filter((t) => t.estado === 'no_asistio').length,
    ultimaVisita,
    proximoTurno,
    servicioHabitual: (() => {
      const id = top(conteoServicio)
      return id ? buscarServicio(e, id)?.nombre : undefined
    })(),
    profesionalHabitual: (() => {
      const id = top(conteoProf)
      return id ? buscarProfesional(e, id) : undefined
    })(),
    // Días de calendario, no de 24 h: una visita de ayer a la tarde es "1",
    // aunque hayan pasado menos de 24 horas.
    diasDesdeUltima: ultimaVisita
      ? differenceInCalendarDays(startOfDay(ahora), startOfDay(d(ultimaVisita.inicio)))
      : undefined,
  }
}

/* ------------------------------ Posicionamiento --------------------------- */

/** Convierte un turno en coordenadas verticales dentro de la grilla horaria. */
export function posicionEnGrilla(
  inicio: string | Date,
  fin: string | Date,
  aperturaMin: number,
  pxPorMinuto: number,
) {
  const top = (minutosDelDia(inicio) - aperturaMin) * pxPorMinuto
  const alto = ((d(fin).getTime() - d(inicio).getTime()) / 60000) * pxPorMinuto
  return { top, alto }
}

export const claveDeDia = claveDia

export type { Bloqueo, Turno }
