import { huecosLibres, proximosHuecos } from './agenda'
import { addDays, claveDia, fechaRelativa, hhmm, startOfDay } from './fecha'
import { moneda } from './formato'
import type { EstadoSalon, Servicio } from './tipos'

/**
 * Motor del asistente de WhatsApp. Es una máquina de estados chiquita: cada
 * respuesta de la clienta hace avanzar un paso, y los horarios que ofrece son
 * los huecos reales de la agenda — nunca propone algo ya ocupado.
 */

export type PasoBot = 'inicio' | 'servicio' | 'profesional' | 'dia' | 'horario' | 'listo'

export interface ContextoBot {
  paso: PasoBot
  servicioId?: string
  profesionalId?: string
  dia?: string
  inicio?: string
}

export interface RespuestaBot {
  texto: string
  botones?: string[]
}

export interface ResultadoBot {
  respuestas: RespuestaBot[]
  contexto: ContextoBot
  /** Cuando el flujo termina, trae los datos listos para crear el turno. */
  reserva?: { servicioId: string; profesionalId: string; inicio: string }
}

const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const SALUDOS = ['hola', 'buenas', 'buen dia', 'buenas tardes', 'buenas noches', 'hi', 'holaa']

/** Servicios que el bot ofrece, agrupados para no abrumar con 26 opciones. */
export const serviciosOfrecidos = (e: EstadoSalon): Servicio[] =>
  e.servicios.filter((s) => s.activo && s.online)

function buscarServicio(e: EstadoSalon, texto: string): Servicio | undefined {
  const t = normalizar(texto)
  const candidatos = serviciosOfrecidos(e)
  return (
    candidatos.find((s) => normalizar(s.nombre) === t) ??
    candidatos.find((s) => t.includes(normalizar(s.nombre))) ??
    candidatos.find((s) => normalizar(s.nombre).includes(t) && t.length >= 4) ??
    candidatos.find((s) => normalizar(s.categoria) === t)
  )
}

const dentroDelHorario = (e: EstadoSalon, ahora: Date) => {
  const tramos = e.ajustes.horario[ahora.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6]
  const min = ahora.getHours() * 60 + ahora.getMinutes()
  return tramos.some((tr) => {
    const [hi, mi] = tr.inicio.split(':').map(Number)
    const [hf, mf] = tr.fin.split(':').map(Number)
    return min >= hi * 60 + mi && min <= hf * 60 + mf
  })
}

export function respuestaInicial(e: EstadoSalon, ahora = new Date()): ResultadoBot {
  const abierto = dentroDelHorario(e, ahora)
  return {
    contexto: { paso: 'servicio' },
    respuestas: [
      {
        texto: abierto ? e.ajustes.bot.bienvenida : e.ajustes.bot.fueraDeHora,
        botones: ['Reservar un turno', 'Ver precios', 'Dónde están'],
      },
    ],
  }
}

export function responder(
  e: EstadoSalon,
  contexto: ContextoBot,
  texto: string,
  ahora = new Date(),
): ResultadoBot {
  const t = normalizar(texto)

  /* Atajos disponibles en cualquier momento */
  if (SALUDOS.some((s) => t === s) || t === 'menu' || t === 'volver') {
    return respuestaInicial(e, ahora)
  }

  if (t.includes('donde') || t.includes('direccion')) {
    return {
      contexto,
      respuestas: [
        {
          texto: `Estamos en ${e.ajustes.salon.direccion} 📍\n\n¿Querés que te agende un turno?`,
          botones: ['Reservar un turno'],
        },
      ],
    }
  }

  if (t.includes('precio') || t.includes('cuanto')) {
    const lista = serviciosOfrecidos(e)
      .slice(0, 8)
      .map((s) => `• ${s.nombre} — ${moneda(s.precio)}`)
      .join('\n')
    return {
      contexto: { ...contexto, paso: 'servicio' },
      respuestas: [
        {
          texto: `Estos son algunos de nuestros precios:\n\n${lista}\n\n¿Te agendo alguno?`,
          botones: ['Reservar un turno'],
        },
      ],
    }
  }

  if (t.includes('cancelar')) {
    return {
      contexto: { paso: 'inicio' },
      respuestas: [
        {
          texto: e.ajustes.politicas.permitirCancelarPorWhatsapp
            ? 'Sin problema. Decime el código de tu turno y lo cancelo, o si preferís lo reprogramamos.'
            : 'Para cancelar te paso con el salón, en un ratito te responden.',
          botones: ['Reprogramar', 'Cancelar igual'],
        },
      ],
    }
  }

  /* ------------------------------ Flujo normal ---------------------------- */

  switch (contexto.paso) {
    case 'inicio':
    case 'servicio': {
      if (t.includes('reservar') || t.includes('turno')) {
        const destacados = serviciosOfrecidos(e).filter((s) =>
          ['s-corte-dama', 's-color-raiz', 's-brushing', 's-semi', 's-corte-caballero'].includes(s.id),
        )
        return {
          contexto: { paso: 'servicio' },
          respuestas: [
            {
              texto: '¡Genial! ¿Qué servicio querés hacerte?',
              botones: [...destacados.map((s) => s.nombre), 'Ver todos'],
            },
          ],
        }
      }

      if (t.includes('ver todos')) {
        return {
          contexto: { paso: 'servicio' },
          respuestas: [
            {
              texto: 'Estos son todos los servicios que podés reservar:',
              botones: serviciosOfrecidos(e)
                .slice(0, 12)
                .map((s) => s.nombre),
            },
          ],
        }
      }

      const servicio = buscarServicio(e, texto)
      if (!servicio) {
        return {
          contexto: { paso: 'servicio' },
          respuestas: [
            {
              texto:
                'Esa no la tengo identificada. Elegí una de estas opciones y seguimos, o escribime *menú* para volver al principio.',
              botones: serviciosOfrecidos(e)
                .slice(0, 6)
                .map((s) => s.nombre),
            },
          ],
        }
      }

      const posibles = e.profesionales.filter(
        (p) => p.activo && p.categorias.includes(servicio.categoria),
      )

      const aviso = servicio.requiereTest
        ? '\n\n⚠️ Este servicio necesita una prueba de mecha previa, sin costo. Te la coordinamos el mismo día.'
        : ''

      return {
        contexto: { paso: 'profesional', servicioId: servicio.id },
        respuestas: [
          {
            texto: `${servicio.nombre} — ${moneda(servicio.precio)} · dura ${servicio.duracionMin} min.${aviso}\n\n¿Con quién te gustaría atenderte?`,
            botones: [...posibles.map((p) => p.nombre.split(' ')[0]), 'Me da igual'],
          },
        ],
      }
    }

    case 'profesional': {
      const servicio = e.servicios.find((s) => s.id === contexto.servicioId)
      if (!servicio) return respuestaInicial(e, ahora)

      const posibles = e.profesionales.filter(
        (p) => p.activo && p.categorias.includes(servicio.categoria),
      )

      const elegida =
        posibles.find((p) => normalizar(p.nombre).startsWith(t)) ??
        posibles.find((p) => normalizar(p.nombre).includes(t)) ??
        (t.includes('igual') || t.includes('cualquiera') ? posibles[0] : undefined)

      if (!elegida) {
        return {
          contexto,
          respuestas: [
            {
              texto: 'No la ubico. Elegí una de estas:',
              botones: [...posibles.map((p) => p.nombre.split(' ')[0]), 'Me da igual'],
            },
          ],
        }
      }

      const huecos = proximosHuecos(e, elegida.id, servicio.duracionMin, ahora, 6)
      if (!huecos.length) {
        return {
          contexto: { paso: 'servicio' },
          respuestas: [
            {
              texto: `${elegida.nombre.split(' ')[0]} no tiene lugar en las próximas semanas 😥 ¿Querés que te anote en la lista de espera o probamos con otra profesional?`,
              botones: ['Lista de espera', 'Otra profesional'],
            },
          ],
        }
      }

      return {
        contexto: { ...contexto, paso: 'horario', profesionalId: elegida.id },
        respuestas: [
          {
            texto: `Estos son los horarios libres de ${elegida.nombre.split(' ')[0]}:`,
            botones: [
              ...huecos.map((h) => `${fechaRelativa(h.inicio)} ${hhmm(h.inicio)}`),
              'Ver otros días',
            ],
          },
        ],
      }
    }

    case 'dia':
    case 'horario': {
      const servicio = e.servicios.find((s) => s.id === contexto.servicioId)
      const prof = e.profesionales.find((p) => p.id === contexto.profesionalId)
      if (!servicio || !prof) return respuestaInicial(e, ahora)

      if (t.includes('otros dias') || t.includes('ver otros')) {
        const masAdelante = proximosHuecos(
          e,
          prof.id,
          servicio.duracionMin,
          addDays(startOfDay(ahora), 7),
          6,
        )
        return {
          contexto,
          respuestas: [
            {
              texto: 'Estos son los horarios de las semanas siguientes:',
              botones: masAdelante.map((h) => `${fechaRelativa(h.inicio)} ${hhmm(h.inicio)}`),
            },
          ],
        }
      }

      // Buscar el hueco que coincide con lo que respondió la clienta
      const hora = texto.match(/\d{1,2}:\d{2}/)?.[0]
      if (!hora) {
        return {
          contexto,
          respuestas: [
            {
              texto: 'Decime el horario tal como aparece en los botones y lo agendo 🙂',
            },
          ],
        }
      }

      const candidatos: { inicio: Date }[] = []
      for (let i = 0; i < 21; i++) {
        const dia = addDays(startOfDay(ahora), i)
        candidatos.push(
          ...huecosLibres(e, prof.id, dia, servicio.duracionMin, { desde: ahora }).filter(
            (h) => hhmm(h.inicio) === hora,
          ),
        )
      }

      const mencionaDia = candidatos.find((c) => {
        const etiqueta = normalizar(fechaRelativa(c.inicio))
        return t.includes(etiqueta) || t.includes(claveDia(c.inicio))
      })

      const elegido = mencionaDia ?? candidatos[0]

      if (!elegido) {
        return {
          contexto,
          respuestas: [
            {
              texto:
                'Justo ese horario se acaba de ocupar 😕 Estos siguen libres:',
              botones: proximosHuecos(e, prof.id, servicio.duracionMin, ahora, 5).map(
                (h) => `${fechaRelativa(h.inicio)} ${hhmm(h.inicio)}`,
              ),
            },
          ],
        }
      }

      const necesitaSenia =
        servicio.precio >= e.ajustes.politicas.seniaDesdeMonto
          ? `\n\n💳 Para este servicio pedimos una seña de ${moneda(Math.round((servicio.precio * e.ajustes.politicas.seniaPorcentaje) / 100 / 50) * 50)}. Te paso el link de pago.`
          : ''

      return {
        contexto: {
          paso: 'listo',
          servicioId: servicio.id,
          profesionalId: prof.id,
          inicio: elegido.inicio.toISOString(),
        },
        reserva: {
          servicioId: servicio.id,
          profesionalId: prof.id,
          inicio: elegido.inicio.toISOString(),
        },
        respuestas: [
          {
            texto: `¡Listo! Tu turno quedó agendado ✅\n\n📅 ${fechaRelativa(elegido.inicio)} a las ${hhmm(elegido.inicio)}\n✂️ ${servicio.nombre}\n👩 ${prof.nombre}\n💵 ${moneda(servicio.precio)}\n📍 ${e.ajustes.salon.direccion}${necesitaSenia}\n\nTe voy a mandar un recordatorio ${e.ajustes.recordatorios.horasAntes} h antes. Si necesitás cambiarlo, escribime *CAMBIAR*.`,
          },
        ],
      }
    }

    case 'listo':
    default:
      return {
        contexto: { paso: 'inicio' },
        respuestas: [
          {
            texto: '¿Querés hacer algo más?',
            botones: ['Reservar otro turno', 'Ver precios'],
          },
        ],
      }
  }
}
