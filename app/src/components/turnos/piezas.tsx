import * as React from 'react'
import { Check, MessageCircle, Search, Store, UserPlus, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, Popover, PopoverContent, PopoverTrigger } from '@/components/ui/misc'
import { CATEGORIAS } from '@/data/catalogo'
import { ESTADO_TURNO } from '@/lib/agenda'
import { duracionLegible } from '@/lib/fecha'
import { moneda, telefonoLegible } from '@/lib/formato'
import type { Clienta, EstadoTurno, OrigenTurno, Servicio } from '@/lib/tipos'
import { cn } from '@/lib/utils'

/* ------------------------------ Chip de estado ---------------------------- */

export function ChipEstado({ estado, className }: { estado: EstadoTurno; className?: string }) {
  const cfg = ESTADO_TURNO[estado]
  return (
    <Badge variant={cfg.badge} className={className}>
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ backgroundColor: 'currentColor' }}
      />
      {cfg.label}
    </Badge>
  )
}

/* ------------------------------ Origen del turno -------------------------- */

const ICONO_ORIGEN = {
  whatsapp: MessageCircle,
  manual: UserRound,
  walkin: Store,
} as const

const TEXTO_ORIGEN = {
  whatsapp: 'Reservó por WhatsApp',
  manual: 'Cargado a mano',
  walkin: 'Llegó sin turno',
} as const

export function ChipOrigen({ origen, corto }: { origen: OrigenTurno; corto?: boolean }) {
  const Icono = ICONO_ORIGEN[origen]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-2xs font-medium',
        origen === 'whatsapp' ? 'text-whatsapp' : 'text-muted-foreground',
      )}
      title={TEXTO_ORIGEN[origen]}
    >
      <Icono className="size-3.5 shrink-0" />
      {!corto && TEXTO_ORIGEN[origen]}
    </span>
  )
}

/* --------------------------- Selector de clienta -------------------------- */

export function SelectorClienta({
  clientas,
  valor,
  onCambio,
  onCrearNueva,
}: {
  clientas: Clienta[]
  valor?: string
  onCambio: (id: string) => void
  onCrearNueva?: (nombre: string) => void
}) {
  const [abierto, setAbierto] = React.useState(false)
  const [busqueda, setBusqueda] = React.useState('')
  const seleccionada = clientas.find((c) => c.id === valor)

  const filtradas = React.useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const base = [...clientas].sort((a, b) => a.nombre.localeCompare(b.nombre))
    if (!q) return base.slice(0, 40)
    return base
      .filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) || c.telefono.replace(/\D/g, '').includes(q.replace(/\D/g, '')),
      )
      .slice(0, 40)
  }, [clientas, busqueda])

  const sinResultados = busqueda.trim().length > 2 && filtradas.length === 0

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="border-border bg-surface hover:border-primary/40 focus-visible:border-primary focus-visible:ring-primary/25 flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-left transition-[border-color,box-shadow] duration-200 outline-none focus-visible:ring-2"
        >
          {seleccionada ? (
            <>
              <Avatar name={seleccionada.nombre} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{seleccionada.nombre}</span>
                <span className="text-muted-foreground block truncate text-2xs">
                  {telefonoLegible(seleccionada.telefono)}
                </span>
              </span>
            </>
          ) : (
            <>
              <Search className="text-muted-foreground size-4 shrink-0" />
              <span className="text-muted-foreground/70 text-sm">Buscar clienta por nombre o teléfono</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="border-border border-b p-2">
          <Input
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre o teléfono…"
            className="h-10"
            aria-label="Buscar clienta"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1.5">
          {filtradas.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onCambio(c.id)
                setAbierto(false)
                setBusqueda('')
              }}
              className="hover:bg-muted flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors"
            >
              <Avatar name={c.nombre} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{c.nombre}</span>
                <span className="text-muted-foreground block truncate text-2xs">
                  {telefonoLegible(c.telefono)}
                </span>
              </span>
              {c.etiquetas.includes('VIP') && <Badge variant="primary">VIP</Badge>}
              {c.etiquetas.includes('Riesgo') && <Badge variant="danger">Ausencias</Badge>}
              {valor === c.id && <Check className="text-primary size-4 shrink-0" />}
            </button>
          ))}

          {sinResultados && (
            <p className="text-muted-foreground px-2 py-3 text-center text-[13px]">
              No hay ninguna clienta con ese nombre.
            </p>
          )}
        </div>
        {onCrearNueva && (
          <div className="border-border border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                onCrearNueva(busqueda.trim())
                setAbierto(false)
                setBusqueda('')
              }}
            >
              <UserPlus />
              {busqueda.trim() ? `Crear a “${busqueda.trim()}”` : 'Crear clienta nueva'}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

/* -------------------------- Selector de servicios ------------------------- */

export function SelectorServicios({
  servicios,
  seleccionados,
  onCambio,
}: {
  servicios: Servicio[]
  seleccionados: string[]
  onCambio: (ids: string[]) => void
}) {
  const porCategoria = React.useMemo(() => {
    const mapa = new Map<string, Servicio[]>()
    for (const s of servicios.filter((x) => x.activo)) {
      const lista = mapa.get(s.categoria) ?? []
      lista.push(s)
      mapa.set(s.categoria, lista)
    }
    return [...mapa.entries()]
  }, [servicios])

  const alternar = (id: string) =>
    onCambio(
      seleccionados.includes(id) ? seleccionados.filter((x) => x !== id) : [...seleccionados, id],
    )

  return (
    <div className="border-border max-h-64 space-y-3 overflow-y-auto rounded-xl border p-3">
      {porCategoria.map(([cat, lista]) => {
        const info = CATEGORIAS[cat as keyof typeof CATEGORIAS]
        return (
          <div key={cat}>
            <p className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-2xs font-semibold tracking-wide uppercase">
              <span className="size-2 rounded-full" style={{ backgroundColor: info.color }} />
              {info.plural}
            </p>
            <div className="grid gap-1">
              {lista.map((s) => {
                const activo = seleccionados.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => alternar(s.id)}
                    aria-pressed={activo}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors duration-200',
                      activo
                        ? 'border-primary bg-primary-soft'
                        : 'border-transparent hover:bg-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-4 shrink-0 place-items-center rounded border transition-colors',
                        activo ? 'border-primary bg-primary' : 'border-border',
                      )}
                    >
                      {activo && <Check className="text-primary-foreground size-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{s.nombre}</span>
                      <span className="text-muted-foreground text-2xs">
                        {duracionLegible(s.duracionMin)}
                        {s.procesadoMin > 0 && ` · ${s.procesadoMin} min de procesado`}
                      </span>
                    </span>
                    <span className="tabular text-[13px] font-semibold">{moneda(s.precio)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ---------------------------- Punto de categoría -------------------------- */

export function PuntoServicio({ servicio }: { servicio?: Servicio }) {
  if (!servicio) return null
  return (
    <span
      aria-hidden
      className="size-2 shrink-0 rounded-full"
      style={{ backgroundColor: CATEGORIAS[servicio.categoria].color }}
    />
  )
}
