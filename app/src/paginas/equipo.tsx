import * as React from 'react'
import { toast } from 'sonner'
import { CalendarOff, Clock, Percent, Phone, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input, Label } from '@/components/ui/input'
import { Avatar, EmptyState, Separator } from '@/components/ui/misc'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATEGORIAS } from '@/data/catalogo'
import { esActivo, turnosDelDia } from '@/lib/agenda'
import { DIAS_LARGOS, addDays, conHora, d, fechaLarga, hhmm, startOfDay } from '@/lib/fecha'
import { moneda, telefonoLegible } from '@/lib/formato'
import type { Bloqueo, DiaSemana } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { nuevoId, useSalon } from '@/store/salon'

export function PaginaEquipo() {
  const { estado } = useSalon()
  const [bloqueoAbierto, setBloqueoAbierto] = React.useState(false)
  const hoy = startOfDay(new Date())

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl leading-tight font-bold">Equipo</h1>
          <p className="text-muted-foreground mt-1 text-[13px]">
            Horarios, especialidades y comisiones. El asistente solo ofrece horarios dentro de estas
            jornadas.
          </p>
        </div>
        <Button onClick={() => setBloqueoAbierto(true)} variant="secondary">
          <CalendarOff />
          Bloquear horario
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {estado.profesionales.map((prof) => {
          const turnosHoy = turnosDelDia(estado, hoy, prof.id).filter(esActivo)
          const desde = addDays(hoy, -30)
          const completados = estado.turnos.filter(
            (t) => t.profesionalId === prof.id && t.estado === 'completado' && d(t.inicio) >= desde,
          )
          const generado = completados.reduce((s, t) => s + (t.pago?.monto ?? 0), 0)

          return (
            <Card key={prof.id} className="p-5">
              <div className="flex items-start gap-3.5">
                <Avatar name={prof.nombre} color={prof.color} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-bold">{prof.nombre}</p>
                  <p className="text-muted-foreground text-[13px]">{prof.rol}</p>
                  <a
                    href={`tel:${prof.telefono}`}
                    className="text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1.5 text-2xs transition-colors"
                  >
                    <Phone className="size-3" />
                    {telefonoLegible(prof.telefono)}
                  </a>
                </div>
                <Badge variant={prof.activo ? 'success' : 'neutral'}>
                  {prof.activo ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {prof.categorias.map((c) => (
                  <Badge key={c} variant="outline">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: CATEGORIAS[c].color }}
                    />
                    {CATEGORIAS[c].nombre}
                  </Badge>
                ))}
              </div>

              <Separator className="my-4" />

              <div>
                <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-2xs font-semibold uppercase">
                  <Clock className="size-3" />
                  Horario semanal
                </p>
                <ul className="space-y-1">
                  {([1, 2, 3, 4, 5, 6, 0] as DiaSemana[]).map((dia) => {
                    const tramos = prof.horario[dia]
                    return (
                      <li key={dia} className="flex items-center gap-3 text-[13px]">
                        <span className="text-muted-foreground w-20 shrink-0">
                          {DIAS_LARGOS[dia]}
                        </span>
                        {tramos.length === 0 ? (
                          <span className="text-muted-foreground/70 text-2xs">Libre</span>
                        ) : (
                          <span className="tabular flex flex-wrap gap-1.5">
                            {tramos.map((t) => (
                              <span
                                key={`${t.inicio}-${t.fin}`}
                                className="bg-muted rounded-md px-2 py-0.5 text-2xs font-medium"
                              >
                                {t.inicio} – {t.fin}
                              </span>
                            ))}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>

              <Separator className="my-4" />

              <dl className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <dt className="text-muted-foreground text-2xs">Hoy</dt>
                  <dd className="tabular font-display text-lg font-bold">{turnosHoy.length}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-2xs">30 días</dt>
                  <dd className="tabular font-display text-lg font-bold">{moneda(generado)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground flex items-center justify-center gap-1 text-2xs">
                    <Percent className="size-3" />
                    Comisión
                  </dt>
                  <dd className="tabular font-display text-lg font-bold">
                    {prof.comision > 0 ? `${prof.comision}%` : '—'}
                  </dd>
                </div>
              </dl>

              <p className="bg-surface-2 text-muted-foreground mt-3 rounded-lg px-3 py-2 text-center text-2xs">
                {prof.comision > 0 ? (
                  <>
                    A liquidar por los últimos 30 días:{' '}
                    <strong className="text-foreground tabular">
                      {moneda(Math.round((generado * prof.comision) / 100))}
                    </strong>
                  </>
                ) : (
                  'Sin comisión: lo que factura queda en el salón.'
                )}
              </p>
            </Card>
          )
        })}
      </div>

      <BloqueosVigentes />

      <DialogoBloqueo abierto={bloqueoAbierto} onAbrir={setBloqueoAbierto} />
    </div>
  )
}

/* ------------------------------- Bloqueos --------------------------------- */

function BloqueosVigentes() {
  const { estado, dispatch } = useSalon()
  const ahora = new Date()
  const vigentes = estado.bloqueos
    .filter((b) => d(b.fin) >= ahora)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))

  // El almuerzo diario se repite: se agrupa para no llenar la lista.
  const agrupados = React.useMemo(() => {
    const mapa = new Map<string, { bloqueo: Bloqueo; veces: number }>()
    for (const b of vigentes) {
      const clave = `${b.profesionalId}-${b.motivo}-${hhmm(b.inicio)}`
      const actual = mapa.get(clave)
      if (actual) actual.veces += 1
      else mapa.set(clave, { bloqueo: b, veces: 1 })
    }
    return [...mapa.values()]
  }, [vigentes])

  return (
    <Card>
      <div className="px-5 pt-5 pb-3">
        <h2 className="font-display text-[15px] font-semibold">Horarios bloqueados</h2>
        <p className="text-muted-foreground text-2xs">
          Ratos en los que la agenda no acepta turnos: almuerzos, licencias, feriados.
        </p>
      </div>

      {agrupados.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title="Sin bloqueos vigentes"
          description="Toda la jornada del equipo está disponible para agendar."
        />
      ) : (
        <ul className="space-y-2 px-5 pb-5">
          {agrupados.map(({ bloqueo, veces }) => {
            const prof =
              bloqueo.profesionalId === 'todos'
                ? null
                : estado.profesionales.find((p) => p.id === bloqueo.profesionalId)
            return (
              <li
                key={bloqueo.id}
                className="border-border flex flex-wrap items-center gap-3 rounded-xl border px-3.5 py-3"
              >
                <span
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-lg',
                    bloqueo.profesionalId === 'todos'
                      ? 'bg-danger-soft text-danger'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <CalendarOff className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">{bloqueo.motivo}</p>
                  <p className="text-muted-foreground text-2xs">
                    {prof ? prof.nombre : 'Todo el salón'} · {fechaLarga(bloqueo.inicio)} ·{' '}
                    <span className="tabular">
                      {hhmm(bloqueo.inicio)}–{hhmm(bloqueo.fin)}
                    </span>
                    {veces > 1 && ` · se repite ${veces} días`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Quitar bloqueo ${bloqueo.motivo}`}
                  onClick={() => {
                    dispatch({ tipo: 'bloqueo/eliminar', id: bloqueo.id })
                    toast.success('Bloqueo eliminado')
                  }}
                >
                  <Trash2 />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function DialogoBloqueo({
  abierto,
  onAbrir,
}: {
  abierto: boolean
  onAbrir: (v: boolean) => void
}) {
  const { estado, dispatch } = useSalon()
  const [profesionalId, setProfesionalId] = React.useState<string>('todos')
  const [dia, setDia] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [desde, setDesde] = React.useState('13:00')
  const [hasta, setHasta] = React.useState('14:00')
  const [motivo, setMotivo] = React.useState('')

  React.useEffect(() => {
    if (abierto) {
      setProfesionalId('todos')
      setDia(new Date().toISOString().slice(0, 10))
      setDesde('13:00')
      setHasta('14:00')
      setMotivo('')
    }
  }, [abierto])

  const fecha = startOfDay(new Date(`${dia}T12:00:00`))
  const inicio = conHora(fecha, desde)
  const fin = conHora(fecha, hasta)
  const valido = motivo.trim().length > 0 && fin > inicio

  const afectados = React.useMemo(() => {
    if (!valido) return []
    return estado.turnos.filter(
      (t) =>
        esActivo(t) &&
        (profesionalId === 'todos' || t.profesionalId === profesionalId) &&
        d(t.inicio) < fin &&
        inicio < d(t.fin),
    )
  }, [estado.turnos, profesionalId, inicio, fin, valido])

  const guardar = () => {
    if (!valido) return
    const bloqueo: Bloqueo = {
      id: nuevoId('b'),
      profesionalId,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      motivo: motivo.trim(),
    }
    dispatch({ tipo: 'bloqueo/crear', bloqueo })
    toast.success('Horario bloqueado', {
      description: `${fechaLarga(inicio)} · ${desde}–${hasta}`,
    })
    onAbrir(false)
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbrir}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bloquear un horario</DialogTitle>
          <DialogDescription>
            Ni el asistente ni vos van a poder agendar turnos en esa franja.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="b-prof">A quién afecta</Label>
            <Select value={profesionalId} onValueChange={setProfesionalId}>
              <SelectTrigger id="b-prof">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todo el salón</SelectItem>
                {estado.profesionales.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="b-dia">Día</Label>
              <Input id="b-dia" type="date" value={dia} onChange={(e) => setDia(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="b-desde">Desde</Label>
              <Input
                id="b-desde"
                type="time"
                step={900}
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="tabular"
              />
            </div>
            <div>
              <Label htmlFor="b-hasta">Hasta</Label>
              <Input
                id="b-hasta"
                type="time"
                step={900}
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="tabular"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="b-motivo">
              Motivo <span className="text-danger">*</span>
            </Label>
            <Input
              id="b-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej.: almuerzo, capacitación, feriado"
            />
          </div>

          {afectados.length > 0 && (
            <div className="bg-warning-soft text-warning rounded-xl px-3.5 py-3 text-[13px]">
              <p className="font-semibold">
                Hay {afectados.length} {afectados.length === 1 ? 'turno' : 'turnos'} en esa franja
              </p>
              <p className="mt-1 text-xs leading-relaxed">
                El bloqueo no los borra, pero conviene reprogramarlos: {' '}
                {afectados
                  .slice(0, 3)
                  .map((t) => `${hhmm(t.inicio)}`)
                  .join(', ')}
                {afectados.length > 3 && '…'}
              </p>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onAbrir(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={!valido}>
            <Plus />
            Bloquear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
