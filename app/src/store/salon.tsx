import * as React from 'react'
import { generarEstado } from '@/data/generar'
import { claveDia } from '@/lib/fecha'
import type {
  Ajustes,
  Bloqueo,
  Clienta,
  Conversacion,
  EnEspera,
  EstadoSalon,
  EstadoTurno,
  FichaTecnica,
  ID,
  MensajeWA,
  Pago,
  Profesional,
  Servicio,
  Turno,
} from '@/lib/tipos'

const CLAVE = 'tijera:salon:v1'

/* --------------------------------- Acciones ------------------------------- */

type Accion =
  | { tipo: 'turno/crear'; turno: Turno }
  | { tipo: 'turno/actualizar'; id: ID; cambios: Partial<Turno> }
  | { tipo: 'turno/estado'; id: ID; estado: EstadoTurno }
  | { tipo: 'turno/cobrar'; id: ID; pago: Pago }
  | { tipo: 'turno/eliminar'; id: ID }
  | { tipo: 'clienta/crear'; clienta: Clienta }
  | { tipo: 'clienta/actualizar'; id: ID; cambios: Partial<Clienta> }
  | { tipo: 'clienta/ficha'; id: ID; ficha: FichaTecnica }
  | { tipo: 'bloqueo/crear'; bloqueo: Bloqueo }
  | { tipo: 'bloqueo/eliminar'; id: ID }
  | { tipo: 'servicio/actualizar'; id: ID; cambios: Partial<Servicio> }
  | { tipo: 'profesional/actualizar'; id: ID; cambios: Partial<Profesional> }
  | { tipo: 'ajustes/actualizar'; cambios: Partial<Ajustes> }
  | { tipo: 'wa/leida'; id: ID }
  | { tipo: 'wa/mensaje'; id: ID; mensaje: MensajeWA }
  | { tipo: 'wa/estado'; id: ID; estado: Conversacion['estado'] }
  | { tipo: 'espera/crear'; item: EnEspera }
  | { tipo: 'espera/eliminar'; id: ID }
  | { tipo: 'demo/reiniciar' }

function reducer(estado: EstadoSalon, accion: Accion): EstadoSalon {
  switch (accion.tipo) {
    case 'turno/crear':
      return { ...estado, turnos: [...estado.turnos, accion.turno] }

    case 'turno/actualizar':
      return {
        ...estado,
        turnos: estado.turnos.map((t) => (t.id === accion.id ? { ...t, ...accion.cambios } : t)),
      }

    case 'turno/estado':
      return {
        ...estado,
        turnos: estado.turnos.map((t) =>
          t.id === accion.id ? { ...t, estado: accion.estado } : t,
        ),
      }

    case 'turno/cobrar':
      return {
        ...estado,
        turnos: estado.turnos.map((t) =>
          t.id === accion.id ? { ...t, estado: 'completado', pago: accion.pago } : t,
        ),
      }

    case 'turno/eliminar':
      return { ...estado, turnos: estado.turnos.filter((t) => t.id !== accion.id) }

    case 'clienta/crear':
      return { ...estado, clientas: [accion.clienta, ...estado.clientas] }

    case 'clienta/actualizar':
      return {
        ...estado,
        clientas: estado.clientas.map((c) => (c.id === accion.id ? { ...c, ...accion.cambios } : c)),
      }

    case 'clienta/ficha':
      return {
        ...estado,
        clientas: estado.clientas.map((c) =>
          c.id === accion.id ? { ...c, fichaTecnica: [accion.ficha, ...c.fichaTecnica] } : c,
        ),
      }

    case 'bloqueo/crear':
      return { ...estado, bloqueos: [...estado.bloqueos, accion.bloqueo] }

    case 'bloqueo/eliminar':
      return { ...estado, bloqueos: estado.bloqueos.filter((b) => b.id !== accion.id) }

    case 'servicio/actualizar':
      return {
        ...estado,
        servicios: estado.servicios.map((s) =>
          s.id === accion.id ? { ...s, ...accion.cambios } : s,
        ),
      }

    case 'profesional/actualizar':
      return {
        ...estado,
        profesionales: estado.profesionales.map((p) =>
          p.id === accion.id ? { ...p, ...accion.cambios } : p,
        ),
      }

    case 'ajustes/actualizar':
      return { ...estado, ajustes: { ...estado.ajustes, ...accion.cambios } }

    case 'wa/leida':
      return {
        ...estado,
        conversaciones: estado.conversaciones.map((c) =>
          c.id === accion.id ? { ...c, sinLeer: 0 } : c,
        ),
      }

    case 'wa/mensaje':
      return {
        ...estado,
        conversaciones: estado.conversaciones.map((c) =>
          c.id === accion.id
            ? {
                ...c,
                mensajes: [...c.mensajes, accion.mensaje],
                ultimaActividad: accion.mensaje.hora,
                sinLeer: accion.mensaje.autor === 'clienta' ? c.sinLeer + 1 : 0,
              }
            : c,
        ),
      }

    case 'wa/estado':
      return {
        ...estado,
        conversaciones: estado.conversaciones.map((c) =>
          c.id === accion.id ? { ...c, estado: accion.estado } : c,
        ),
      }

    case 'espera/crear':
      return { ...estado, espera: [accion.item, ...estado.espera] }

    case 'espera/eliminar':
      return { ...estado, espera: estado.espera.filter((e) => e.id !== accion.id) }

    case 'demo/reiniciar':
      return generarEstado()
  }
}

/* ------------------------------ Persistencia ------------------------------ */

function cargar(): EstadoSalon {
  if (typeof window === 'undefined') return generarEstado()
  try {
    const crudo = window.localStorage.getItem(CLAVE)
    if (crudo) {
      const { dia, estado } = JSON.parse(crudo) as { dia: string; estado: EstadoSalon }
      // La demo se apoya en "hoy": si cambió el día, se regenera para que la
      // agenda siga teniendo sentido al abrirla.
      if (dia === claveDia(new Date()) && estado?.turnos?.length) return estado
    }
  } catch {
    // Datos corruptos o storage bloqueado: se regenera desde cero.
  }
  return generarEstado()
}

/* -------------------------------- Contexto -------------------------------- */

interface ContextoSalon {
  estado: EstadoSalon
  dispatch: React.Dispatch<Accion>
  reiniciar: () => void
}

const Ctx = React.createContext<ContextoSalon | null>(null)

export function ProveedorSalon({ children }: { children: React.ReactNode }) {
  const [estado, dispatch] = React.useReducer(reducer, undefined, cargar)

  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        CLAVE,
        JSON.stringify({ dia: claveDia(new Date()), estado }),
      )
    } catch {
      // Sin storage disponible la demo funciona igual, solo no persiste.
    }
  }, [estado])

  const reiniciar = React.useCallback(() => {
    try {
      window.localStorage.removeItem(CLAVE)
    } catch {
      /* noop */
    }
    dispatch({ tipo: 'demo/reiniciar' })
  }, [])

  const valor = React.useMemo(() => ({ estado, dispatch, reiniciar }), [estado, reiniciar])

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useSalon() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error('useSalon debe usarse dentro de <ProveedorSalon>')
  return ctx
}

/* ---------------------------------- IDs ----------------------------------- */

let contador = 0
export const nuevoId = (prefijo: string) =>
  `${prefijo}-${Date.now().toString(36)}${(contador++).toString(36)}`

const CODIGO_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const nuevoCodigo = () =>
  Array.from({ length: 4 }, () => CODIGO_CHARS[Math.floor(Math.random() * CODIGO_CHARS.length)]).join('')
