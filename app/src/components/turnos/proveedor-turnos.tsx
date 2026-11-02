import * as React from 'react'
import { DialogoCobro } from './dialogo-cobro'
import { DialogoDetalleTurno } from './dialogo-detalle-turno'
import { DialogoNuevoTurno, type PrefillTurno } from './dialogo-nuevo-turno'
import type { Turno } from '@/lib/tipos'

interface ContextoTurnos {
  /** Abre el formulario de alta con datos precargados (día, hora, profesional…). */
  nuevoTurno: (prefill?: PrefillTurno) => void
  /** Abre la ficha de un turno existente. */
  verTurno: (id: string) => void
  /** Abre el formulario en modo reprogramación. */
  reprogramar: (turno: Turno) => void
  /** Abre la pantalla de cobro. */
  cobrar: (turno: Turno) => void
}

const Ctx = React.createContext<ContextoTurnos | null>(null)

export function ProveedorTurnos({ children }: { children: React.ReactNode }) {
  const [prefill, setPrefill] = React.useState<PrefillTurno | undefined>()
  const [nuevoAbierto, setNuevoAbierto] = React.useState(false)
  const [detalleId, setDetalleId] = React.useState<string | null>(null)
  const [detalleAbierto, setDetalleAbierto] = React.useState(false)
  const [turnoCobro, setTurnoCobro] = React.useState<Turno | null>(null)
  const [cobroAbierto, setCobroAbierto] = React.useState(false)

  const valor = React.useMemo<ContextoTurnos>(
    () => ({
      nuevoTurno: (p) => {
        setPrefill(p)
        setNuevoAbierto(true)
      },
      verTurno: (id) => {
        setDetalleId(id)
        setDetalleAbierto(true)
      },
      reprogramar: (turno) => {
        setDetalleAbierto(false)
        setPrefill({ turnoId: turno.id })
        setNuevoAbierto(true)
      },
      cobrar: (turno) => {
        setDetalleAbierto(false)
        setTurnoCobro(turno)
        setCobroAbierto(true)
      },
    }),
    [],
  )

  return (
    <Ctx.Provider value={valor}>
      {children}

      <DialogoNuevoTurno abierto={nuevoAbierto} onAbrir={setNuevoAbierto} prefill={prefill} />
      <DialogoDetalleTurno
        turnoId={detalleId}
        abierto={detalleAbierto}
        onAbrir={setDetalleAbierto}
        onReprogramar={valor.reprogramar}
        onCobrar={valor.cobrar}
      />
      <DialogoCobro turno={turnoCobro} abierto={cobroAbierto} onAbrir={setCobroAbierto} />
    </Ctx.Provider>
  )
}

export function useTurnos() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error('useTurnos debe usarse dentro de <ProveedorTurnos>')
  return ctx
}
