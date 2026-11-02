import {
  addDays,
  addMinutes,
  aMinutos,
  claveDia,
  conHora,
  diaSemana,
  hhmm,
  startOfDay,
} from '@/lib/fecha'
import type {
  Bloqueo,
  Clienta,
  Conversacion,
  EnEspera,
  EstadoSalon,
  EstadoTurno,
  MensajeWA,
  MetodoPago,
  OrigenTurno,
  Profesional,
  Servicio,
  Turno,
} from '@/lib/tipos'
import { AJUSTES, PROFESIONALES, SERVICIOS } from './catalogo'
import { CLIENTAS } from './clientas'

/* ------------------------- Aleatoriedad reproducible ---------------------- */

/** PRNG con semilla: la demo se ve igual en cada recarga del mismo día. */
function crearRandom(semilla: number) {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CODIGO_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/* --------------------------------- Ayudas -------------------------------- */

const elegir = <T,>(rnd: () => number, arr: T[]): T => arr[Math.floor(rnd() * arr.length)]

const elegirPeso = <T,>(rnd: () => number, opciones: [T, number][]): T => {
  const total = opciones.reduce((s, [, p]) => s + p, 0)
  let r = rnd() * total
  for (const [valor, peso] of opciones) {
    r -= peso
    if (r <= 0) return valor
  }
  return opciones[opciones.length - 1][0]
}

const serviciosDe = (prof: Profesional, servicios: Servicio[]) =>
  servicios.filter((s) => s.activo && prof.categorias.includes(s.categoria))

/** Clientas que encajan con lo que hace esa profesional. */
const clientasDe = (prof: Profesional, clientas: Clienta[]) => {
  const propias = clientas.filter((c) => c.profesionalPreferidoId === prof.id)
  const sinPreferencia = clientas.filter((c) => !c.profesionalPreferidoId)
  const barberia = prof.categorias.includes('barberia')
  const soloBarberia = (c: Clienta) => c.etiquetas.includes('Barbería')
  const pool = [...propias, ...propias, ...sinPreferencia] // el doble de peso a las propias
  return barberia
    ? pool.filter(soloBarberia).concat(propias)
    : pool.filter((c) => !soloBarberia(c))
}

/* ----------------------------- Generación core ---------------------------- */

interface Cita {
  prof: Profesional
  inicio: Date
  servicios: Servicio[]
}

/** Llena el día de una profesional respetando su horario y una tasa de ocupación. */
function citasDelDia(
  rnd: () => number,
  prof: Profesional,
  dia: Date,
  ocupacion: number,
  servicios: Servicio[],
): Cita[] {
  const tramos = prof.horario[diaSemana(dia)]
  if (!tramos.length) return []

  const disponibles = serviciosDe(prof, servicios)
  if (!disponibles.length) return []

  const citas: Cita[] = []

  for (const tramo of tramos) {
    let cursor = aMinutos(tramo.inicio)
    const cierre = aMinutos(tramo.fin)

    while (cursor < cierre - 25) {
      // Hueco vacío antes del próximo turno (agenda real: nunca está 100% llena)
      if (rnd() > ocupacion) {
        cursor += 15 + Math.floor(rnd() * 3) * 15
        continue
      }

      // 1 servicio, o 2 combinados (color + corte, manicura + pedicura…)
      const principal = elegir(rnd, disponibles)
      const combo: Servicio[] = [principal]
      if (rnd() < 0.18) {
        const extra = disponibles.find(
          (s) => s.id !== principal.id && s.duracionMin <= 45 && s.categoria !== principal.categoria,
        )
        if (extra) combo.push(extra)
      }

      const total = combo.reduce((s, x) => s + x.duracionMin, 0)
      if (cursor + total > cierre) break

      citas.push({ prof, inicio: conHora(dia, `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`), servicios: combo })

      // Colchón corto entre clientas
      cursor += total + (rnd() < 0.5 ? 0 : 15)
    }
  }

  return citas
}

/** Ocupación esperada según cuán lejos está el día respecto de hoy. */
function ocupacionPara(offset: number, rnd: () => number): number {
  if (offset < -30) return 0.5
  if (offset < 0) return 0.62 + rnd() * 0.2 // pasado: la agenda quedó bastante llena
  if (offset === 0) return 0.78
  if (offset <= 3) return 0.6 + rnd() * 0.12
  if (offset <= 7) return 0.42 + rnd() * 0.14
  if (offset <= 14) return 0.24 + rnd() * 0.12
  if (offset <= 21) return 0.12 + rnd() * 0.08
  return 0.05 + rnd() * 0.05
}

function estadoPara(offset: number, inicio: Date, ahora: Date, rnd: () => number): EstadoTurno {
  if (offset < 0) {
    return elegirPeso(rnd, [
      ['completado', 86],
      ['no_asistio', 6],
      ['cancelado', 8],
    ])
  }
  if (offset === 0) {
    const fin = addMinutes(inicio, 30)
    if (fin < ahora) {
      return elegirPeso(rnd, [
        ['completado', 92],
        ['no_asistio', 8],
      ])
    }
    if (inicio <= ahora && ahora < fin) return 'en_curso'
    return elegirPeso(rnd, [
      ['confirmado', 80],
      ['pendiente', 20],
    ])
  }
  if (offset <= 2) {
    return elegirPeso(rnd, [
      ['confirmado', 72],
      ['pendiente', 24],
      ['cancelado', 4],
    ])
  }
  return elegirPeso(rnd, [
    ['confirmado', 55],
    ['pendiente', 43],
    ['cancelado', 2],
  ])
}

/* -------------------------------- Principal ------------------------------- */

export function generarEstado(hoy = new Date()): EstadoSalon {
  const base = startOfDay(hoy)
  // Semilla estable por día: mismos datos durante toda la jornada.
  const semilla = Number(claveDia(base).replace(/-/g, ''))
  const rnd = crearRandom(semilla)

  const servicios = SERVICIOS
  const profesionales = PROFESIONALES
  const clientas = CLIENTAS.map((c) => ({ ...c }))
  const turnos: Turno[] = []

  const DESDE = -42 // seis semanas atrás
  const HASTA = 28 // cuatro semanas adelante

  let n = 0

  for (let offset = DESDE; offset <= HASTA; offset++) {
    const dia = addDays(base, offset)
    if (diaSemana(dia) === 0) continue // domingo cerrado

    for (const prof of profesionales) {
      const ocupacion = ocupacionPara(offset, rnd)
      const citas = citasDelDia(rnd, prof, dia, ocupacion, servicios)
      const pool = clientasDe(prof, clientas)
      if (!pool.length) continue

      for (const cita of citas) {
        const clienta = elegir(rnd, pool)
        const duracion = cita.servicios.reduce((s, x) => s + x.duracionMin, 0)
        const precioTotal = cita.servicios.reduce((s, x) => s + x.precio, 0)
        const fin = addMinutes(cita.inicio, duracion)
        const estado = estadoPara(offset, cita.inicio, hoy, rnd)

        const origen: OrigenTurno = elegirPeso(rnd, [
          ['whatsapp', offset >= 0 ? 68 : 55],
          ['manual', 26],
          ['walkin', 8],
        ])

        const requiereSenia =
          precioTotal >= AJUSTES.politicas.seniaDesdeMonto || clienta.etiquetas.includes('Riesgo')
        const senia =
          requiereSenia && rnd() < 0.7
            ? Math.round((precioTotal * AJUSTES.politicas.seniaPorcentaje) / 100 / 50) * 50
            : 0

        const codigo = Array.from({ length: 4 }, () => CODIGO_CHARS[Math.floor(rnd() * CODIGO_CHARS.length)]).join('')

        const turno: Turno = {
          id: `t-${++n}`,
          codigo,
          clientaId: clienta.id,
          profesionalId: prof.id,
          serviciosIds: cita.servicios.map((s) => s.id),
          inicio: cita.inicio.toISOString(),
          fin: fin.toISOString(),
          estado,
          origen,
          precioTotal,
          senia,
          recordatorioEnviado: offset <= 1 && offset >= -1,
          creadoEn: addDays(cita.inicio, -(3 + Math.floor(rnd() * 20))).toISOString(),
        }

        if (estado === 'completado') {
          const metodo: MetodoPago = elegirPeso(rnd, [
            ['efectivo', 34],
            ['debito', 30],
            ['credito', 22],
            ['transferencia', 14],
          ])
          const propina = rnd() < 0.32 ? Math.round((precioTotal * (0.05 + rnd() * 0.07)) / 10) * 10 : 0
          turno.pago = {
            metodo,
            monto: precioTotal,
            propina,
            fecha: fin.toISOString(),
          }
        }

        if (clienta.alertas.length && rnd() < 0.4) {
          turno.notas = clienta.alertas[0]
        }

        turnos.push(turno)
      }
    }
  }

  return {
    servicios,
    profesionales,
    clientas,
    turnos,
    bloqueos: generarBloqueos(base),
    conversaciones: generarConversaciones(base, turnos, clientas, servicios, profesionales, hoy),
    espera: generarEspera(base),
    ajustes: AJUSTES,
  }
}

/* -------------------------------- Bloqueos -------------------------------- */

function generarBloqueos(base: Date): Bloqueo[] {
  const bloqueos: Bloqueo[] = []
  let i = 0

  // Almuerzo de Valeria de lunes a viernes durante las próximas 3 semanas
  for (let offset = 0; offset <= 21; offset++) {
    const dia = addDays(base, offset)
    const ds = diaSemana(dia)
    if (ds === 0 || ds === 6) continue
    bloqueos.push({
      id: `b-${++i}`,
      profesionalId: 'p-valeria',
      inicio: conHora(dia, '13:00').toISOString(),
      fin: conHora(dia, '14:00').toISOString(),
      motivo: 'Almuerzo',
    })
  }

  // Capacitación de producto: el salón entero cierra medio día
  const capacitacion = addDays(base, 11)
  bloqueos.push({
    id: `b-${++i}`,
    profesionalId: 'todos',
    inicio: conHora(capacitacion, '09:00').toISOString(),
    fin: conHora(capacitacion, '13:00').toISOString(),
    motivo: 'Capacitación de coloración',
  })

  // Sofía se toma la tarde
  const licencia = addDays(base, 4)
  bloqueos.push({
    id: `b-${++i}`,
    profesionalId: 'p-sofia',
    inicio: conHora(licencia, '16:00').toISOString(),
    fin: conHora(licencia, '20:00').toISOString(),
    motivo: 'Trámite personal',
  })

  return bloqueos
}

/* ------------------------------ Lista de espera --------------------------- */

function generarEspera(base: Date): EnEspera[] {
  return [
    {
      id: 'e-1',
      clientaId: 'c-03',
      servicioId: 's-balayage',
      profesionalId: 'p-valeria',
      preferencia: 'Cualquier día de mañana, avisar si se libera algo esta semana',
      creadoEn: addDays(base, -2).toISOString(),
    },
    {
      id: 'e-2',
      clientaId: 'c-15',
      servicioId: 's-color-completo',
      profesionalId: 'p-valeria',
      preferencia: 'Después de las 18:30',
      creadoEn: addDays(base, -1).toISOString(),
    },
    {
      id: 'e-3',
      clientaId: 'c-29',
      servicioId: 's-semi',
      preferencia: 'Sábado a la mañana',
      creadoEn: addDays(base, -4).toISOString(),
    },
  ]
}

/* -------------------------------- WhatsApp -------------------------------- */

function generarConversaciones(
  base: Date,
  turnos: Turno[],
  clientas: Clienta[],
  servicios: Servicio[],
  profesionales: Profesional[],
  ahora: Date,
): Conversacion[] {
  const svc = (id: string) => servicios.find((s) => s.id === id)!
  const prof = (id: string) => profesionales.find((p) => p.id === id)!
  const cli = (id: string) => clientas.find((c) => c.id === id)!

  const futuros = turnos
    .filter((t) => new Date(t.inicio) > ahora && t.origen === 'whatsapp' && t.estado !== 'cancelado')
    .sort((a, b) => a.inicio.localeCompare(b.inicio))

  const conversaciones: Conversacion[] = []
  let n = 0

  const mensaje = (
    autor: MensajeWA['autor'],
    texto: string,
    hora: Date,
    botones?: string[],
  ): MensajeWA => ({
    id: `m-${++n}`,
    autor,
    texto,
    hora: hora.toISOString(),
    botones,
  })

  /* --- 1. Reserva completa hecha por el bot, terminada hace un rato --- */
  const t1 = futuros[0]
  if (t1) {
    const c = cli(t1.clientaId)
    const s = svc(t1.serviciosIds[0])
    const p = prof(t1.profesionalId)
    const t0 = addMinutes(ahora, -47)
    conversaciones.push({
      id: 'w-1',
      clientaId: c.id,
      nombreContacto: c.nombre,
      telefono: c.telefono,
      estado: 'bot',
      turnoId: t1.id,
      sinLeer: 0,
      ultimaActividad: addMinutes(t0, 4).toISOString(),
      mensajes: [
        mensaje('clienta', 'Hola! Tenés lugar para esta semana?', t0),
        mensaje(
          'bot',
          `Hola ${c.nombre.split(' ')[0]}! Soy el asistente de Salón Marié 💇‍♀️ Te ayudo a reservar. ¿Qué servicio querés?`,
          addMinutes(t0, 0),
          ['Corte', 'Color', 'Tratamiento', 'Ver todos'],
        ),
        mensaje('clienta', s.nombre, addMinutes(t0, 1)),
        mensaje(
          'bot',
          `${s.nombre} — ${s.duracionMin} min · $ ${s.precio}\n\n¿Con quién preferís atenderte?`,
          addMinutes(t0, 1),
          [p.nombre.split(' ')[0], 'Me da igual'],
        ),
        mensaje('clienta', p.nombre.split(' ')[0], addMinutes(t0, 2)),
        mensaje(
          'bot',
          `Estos son los horarios libres de ${p.nombre.split(' ')[0]}:`,
          addMinutes(t0, 2),
          [`${hhmm(t1.inicio)} · ${diaTexto(t1.inicio, base)}`, 'Ver más horarios'],
        ),
        mensaje('clienta', `${hhmm(t1.inicio)} · ${diaTexto(t1.inicio, base)}`, addMinutes(t0, 3)),
        mensaje(
          'bot',
          `¡Listo ${c.nombre.split(' ')[0]}! Tu turno quedó agendado ✅\n\n📅 ${diaTexto(t1.inicio, base)} a las ${hhmm(t1.inicio)}\n✂️ ${s.nombre}\n👩 ${p.nombre}\n💵 $ ${t1.precioTotal}\n📍 Av. Brasil 2570\n\nCódigo: ${t1.codigo}\nSi necesitás cambiarlo, escribime *CAMBIAR*.`,
          addMinutes(t0, 4),
        ),
      ],
    })
  }

  /* --- 2. Consulta de precio sin reserva, esperando respuesta humana --- */
  const c2 = cli('c-13')
  const t2 = addMinutes(ahora, -12)
  conversaciones.push({
    id: 'w-2',
    clientaId: c2.id,
    nombreContacto: c2.nombre,
    telefono: c2.telefono,
    estado: 'humano',
    sinLeer: 2,
    ultimaActividad: addMinutes(t2, 3).toISOString(),
    mensajes: [
      mensaje('clienta', 'Buenas! Cuánto sale el balayage?', t2),
      mensaje(
        'bot',
        'Hola! El balayage sale $ 5.200 e incluye la matización. Dura unas 3 horas ✨\n\n¿Querés que te muestre los horarios libres?',
        addMinutes(t2, 0),
        ['Sí, ver horarios', 'Tengo otra consulta'],
      ),
      mensaje('clienta', 'Tengo otra consulta', addMinutes(t2, 2)),
      mensaje(
        'clienta',
        'Tengo el pelo teñido de negro hace años, igual me pueden hacer el balayage? No quiero que se me arruine',
        addMinutes(t2, 2),
      ),
      mensaje(
        'bot',
        'Esa te la paso a una estilista para que la vea bien 👩‍🎨 En un ratito te responden.',
        addMinutes(t2, 3),
      ),
    ],
  })

  /* --- 3. Recordatorio automático confirmado por la clienta --- */
  const manana = turnos.find(
    (t) => claveDia(t.inicio) === claveDia(addDays(base, 1)) && t.estado === 'confirmado',
  )
  if (manana) {
    const c = cli(manana.clientaId)
    const s = svc(manana.serviciosIds[0])
    const p = prof(manana.profesionalId)
    const t3 = addMinutes(ahora, -180)
    conversaciones.push({
      id: 'w-3',
      clientaId: c.id,
      nombreContacto: c.nombre,
      telefono: c.telefono,
      estado: 'bot',
      turnoId: manana.id,
      sinLeer: 0,
      ultimaActividad: addMinutes(t3, 26).toISOString(),
      mensajes: [
        mensaje(
          'bot',
          `Hola ${c.nombre.split(' ')[0]}! Te recordamos tu turno de ${s.nombre} mañana a las ${hhmm(manana.inicio)} con ${p.nombre.split(' ')[0]} en Salón Marié.\n\nRespondé *1* para confirmar o *2* si no vas a poder venir.`,
          t3,
          ['1 · Confirmar', '2 · No puedo ir'],
        ),
        mensaje('clienta', '1', addMinutes(t3, 26)),
        mensaje('bot', '¡Genial! Turno confirmado ✅ Te esperamos mañana.', addMinutes(t3, 26)),
      ],
    })
  }

  /* --- 4. Cancelación por WhatsApp que liberó un hueco --- */
  const c4 = cli('c-06')
  const t4 = addMinutes(ahora, -320)
  conversaciones.push({
    id: 'w-4',
    clientaId: c4.id,
    nombreContacto: c4.nombre,
    telefono: c4.telefono,
    estado: 'bot',
    sinLeer: 0,
    ultimaActividad: addMinutes(t4, 2).toISOString(),
    mensajes: [
      mensaje('clienta', 'Hola, necesito cancelar el turno de mañana', t4),
      mensaje(
        'bot',
        'Sin problema. Tenés este turno agendado:\n\n📅 Mañana 16:30 · Corte + brushing\n\n¿Querés cancelarlo o reprogramarlo?',
        addMinutes(t4, 1),
        ['Reprogramar', 'Cancelar', 'Volver'],
      ),
      mensaje('clienta', 'Cancelar', addMinutes(t4, 2)),
      mensaje(
        'bot',
        'Listo, tu turno fue cancelado. Cuando quieras volver, escribime y lo agendamos en un minuto 💛',
        addMinutes(t4, 2),
      ),
    ],
  })

  /* --- 5. Fuera de horario: el bot toma el turno igual --- */
  const c5 = cli('c-19')
  const t5 = addMinutes(ahora, -60 * 14)
  conversaciones.push({
    id: 'w-5',
    clientaId: c5.id,
    nombreContacto: c5.nombre,
    telefono: c5.telefono,
    estado: 'bot',
    sinLeer: 0,
    ultimaActividad: addMinutes(t5, 5).toISOString(),
    mensajes: [
      mensaje('clienta', 'Hola, atienden?', t5),
      mensaje(
        'bot',
        'Ahora el salón está cerrado, pero podés reservar igual 🌙 Elegí el servicio y te muestro los horarios libres.',
        addMinutes(t5, 0),
        ['Corte', 'Color', 'Uñas', 'Ver todos'],
      ),
      mensaje('clienta', 'Uñas', addMinutes(t5, 3)),
      mensaje(
        'bot',
        'Perfecto. Estas son las opciones de uñas:',
        addMinutes(t5, 3),
        ['Manicura común · $ 750', 'Semipermanente · $ 1.150', 'Kapping · $ 1.900'],
      ),
      mensaje('clienta', 'Semipermanente', addMinutes(t5, 4)),
      mensaje(
        'bot',
        'Estos son los horarios libres de Camila para esta semana:',
        addMinutes(t5, 5),
        ['Jue 10:00', 'Jue 15:30', 'Vie 11:00', 'Ver más'],
      ),
    ],
  })

  /* --- 6. Contacto nuevo que todavía no está en la base --- */
  const t6 = addMinutes(ahora, -25)
  conversaciones.push({
    id: 'w-6',
    nombreContacto: 'Número nuevo',
    telefono: '+59893117420',
    estado: 'bot',
    sinLeer: 1,
    ultimaActividad: addMinutes(t6, 1).toISOString(),
    mensajes: [
      mensaje('clienta', 'Buenas, hacen alisado?', t6),
      mensaje(
        'bot',
        'Sí! Hacemos alisado progresivo sin formol 💫 Dura 3 horas y sale $ 5.400.\n\nAntes de reservar necesitamos una prueba de mecha rápida (10 min, sin costo). ¿Te agendo la prueba?',
        addMinutes(t6, 1),
        ['Sí, agendar prueba', 'Más información'],
      ),
    ],
  })

  return conversaciones.sort((a, b) => b.ultimaActividad.localeCompare(a.ultimaActividad))
}

function diaTexto(iso: string, base: Date) {
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const f = new Date(iso)
  const diff = Math.round((startOfDay(f).getTime() - base.getTime()) / 86400000)
  if (diff === 0) return 'hoy'
  if (diff === 1) return 'mañana'
  return dias[f.getDay()]
}
