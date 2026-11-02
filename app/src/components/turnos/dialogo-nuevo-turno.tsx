import * as React from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  CalendarDays,
  CircleAlert,
  Clock,
  Info,
  Scissors,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldHint, Input, Label, Textarea } from '@/components/ui/input'
import { Avatar, Separator } from '@/components/ui/misc'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SelectorClienta, SelectorServicios } from '@/components/turnos/piezas'
import {
  duracionTotal,
  huecosLibres,
  precioTotal,
  procesadoTotal,
  proximosHuecos,
  verificarDisponibilidad,
} from '@/lib/agenda'
import {
  addMinutes,
  claveDia,
  conHora,
  duracionLegible,
  fechaLarga,
  fechaRelativa,
  hhmm,
  startOfDay,
} from '@/lib/fecha'
import { moneda, primerNombre } from '@/lib/formato'
import type { Clienta, Turno } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { nuevoCodigo, nuevoId, useSalon } from '@/store/salon'

export interface PrefillTurno {
  clientaId?: string
  profesionalId?: string
  servicioId?: string
  inicio?: Date
  /** Cuando viene, el diálogo reprograma ese turno en lugar de crear uno. */
  turnoId?: string
}

export function DialogoNuevoTurno({
  abierto,
  onAbrir,
  prefill,
}: {
  abierto: boolean
  onAbrir: (v: boolean) => void
  prefill?: PrefillTurno
}) {
  const { estado, dispatch } = useSalon()
  const turnoEditado = prefill?.turnoId
    ? estado.turnos.find((t) => t.id === prefill.turnoId)
    : undefined

  const [clientaId, setClientaId] = React.useState('')
  const [serviciosIds, setServiciosIds] = React.useState<string[]>([])
  const [profesionalId, setProfesionalId] = React.useState('')
  const [dia, setDia] = React.useState(() => claveDia(new Date()))
  const [horaElegida, setHoraElegida] = React.useState('')
  const [notas, setNotas] = React.useState('')
  const [conSenia, setConSenia] = React.useState(false)
  const [nuevaClienta, setNuevaClienta] = React.useState<{ nombre: string; telefono: string } | null>(
    null,
  )

  /* Precarga al abrir */
  React.useEffect(() => {
    if (!abierto) return
    const base = turnoEditado
    setClientaId(base?.clientaId ?? prefill?.clientaId ?? '')
    setServiciosIds(base?.serviciosIds ?? (prefill?.servicioId ? [prefill.servicioId] : []))
    setProfesionalId(base?.profesionalId ?? prefill?.profesionalId ?? '')
    const fecha = base ? new Date(base.inicio) : (prefill?.inicio ?? new Date())
    setDia(claveDia(fecha))
    setHoraElegida(base ? hhmm(base.inicio) : prefill?.inicio ? hhmm(prefill.inicio) : '')
    setNotas(base?.notas ?? '')
    setConSenia(Boolean(base?.senia))
    setNuevaClienta(null)
  }, [abierto, prefill, turnoEditado])

  const duracion = duracionTotal(estado, serviciosIds)
  const precio = precioTotal(estado, serviciosIds)
  const procesado = procesadoTotal(estado, serviciosIds)
  const diaDate = React.useMemo(() => startOfDay(new Date(`${dia}T12:00:00`)), [dia])

  const clienta = estado.clientas.find((c) => c.id === clientaId)

  /* Profesionales que pueden hacer todos los servicios elegidos */
  const categorias = React.useMemo(
    () =>
      new Set(
        serviciosIds
          .map((id) => estado.servicios.find((s) => s.id === id)?.categoria)
          .filter(Boolean) as string[],
      ),
    [serviciosIds, estado.servicios],
  )

  const profesionalesPosibles = React.useMemo(
    () =>
      estado.profesionales.filter(
        (p) => p.activo && [...categorias].every((c) => p.categorias.includes(c as never)),
      ),
    [estado.profesionales, categorias],
  )

  /* Si la profesional elegida no cubre los servicios, se limpia */
  React.useEffect(() => {
    if (profesionalId && !profesionalesPosibles.some((p) => p.id === profesionalId)) {
      setProfesionalId('')
      setHoraElegida('')
    }
  }, [profesionalesPosibles, profesionalId])

  const huecos = React.useMemo(() => {
    if (!profesionalId || !duracion) return []
    return huecosLibres(estado, profesionalId, diaDate, duracion, {
      desde: new Date(),
      ignorarTurnoId: turnoEditado?.id,
    })
  }, [estado, profesionalId, diaDate, duracion, turnoEditado])

  const alternativas = React.useMemo(() => {
    if (!profesionalId || !duracion || huecos.length) return []
    return proximosHuecos(estado, profesionalId, duracion, new Date(), 4)
  }, [estado, profesionalId, duracion, huecos.length])

  const inicio = horaElegida ? conHora(diaDate, horaElegida) : null
  const fin = inicio ? addMinutes(inicio, duracion) : null

  const conflicto = React.useMemo(() => {
    if (!inicio || !fin || !profesionalId) return null
    return verificarDisponibilidad(estado, profesionalId, inicio, fin, turnoEditado?.id)
  }, [estado, inicio, fin, profesionalId, turnoEditado])

  const requiereTest = serviciosIds.some(
    (id) => estado.servicios.find((s) => s.id === id)?.requiereTest,
  )

  const seniaSugerida = Math.round((precio * estado.ajustes.politicas.seniaPorcentaje) / 100 / 50) * 50
  const seniaRecomendada =
    precio >= estado.ajustes.politicas.seniaDesdeMonto || Boolean(clienta?.etiquetas.includes('Riesgo'))

  React.useEffect(() => {
    if (seniaRecomendada) setConSenia(true)
  }, [seniaRecomendada])

  const listo =
    (Boolean(clientaId) || Boolean(nuevaClienta?.nombre)) &&
    serviciosIds.length > 0 &&
    Boolean(profesionalId) &&
    Boolean(inicio) &&
    !conflicto

  const guardar = () => {
    if (!listo || !inicio || !fin) return

    let idClienta = clientaId
    if (nuevaClienta?.nombre) {
      const creada: Clienta = {
        id: nuevoId('c'),
        nombre: nuevaClienta.nombre,
        telefono: nuevaClienta.telefono || '+598',
        etiquetas: ['Nueva'],
        alertas: [],
        desde: new Date().toISOString().slice(0, 10),
        fichaTecnica: [],
      }
      dispatch({ tipo: 'clienta/crear', clienta: creada })
      idClienta = creada.id
    }

    if (turnoEditado) {
      dispatch({
        tipo: 'turno/actualizar',
        id: turnoEditado.id,
        cambios: {
          clientaId: idClienta,
          profesionalId,
          serviciosIds,
          inicio: inicio.toISOString(),
          fin: fin.toISOString(),
          precioTotal: precio,
          senia: conSenia ? seniaSugerida : 0,
          notas: notas.trim() || undefined,
        },
      })
      toast.success('Turno actualizado', {
        description: `${fechaRelativa(inicio)} a las ${hhmm(inicio)}`,
      })
    } else {
      const turno: Turno = {
        id: nuevoId('t'),
        codigo: nuevoCodigo(),
        clientaId: idClienta,
        profesionalId,
        serviciosIds,
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
        estado: 'confirmado',
        origen: 'manual',
        precioTotal: precio,
        senia: conSenia ? seniaSugerida : 0,
        notas: notas.trim() || undefined,
        recordatorioEnviado: false,
        creadoEn: new Date().toISOString(),
      }
      dispatch({ tipo: 'turno/crear', turno })
      toast.success('Turno agendado', {
        description: `${fechaRelativa(inicio)} a las ${hhmm(inicio)} · ${duracionLegible(duracion)}`,
      })
    }

    onAbrir(false)
  }

  const prof = estado.profesionales.find((p) => p.id === profesionalId)

  return (
    <Dialog open={abierto} onOpenChange={onAbrir}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{turnoEditado ? 'Reprogramar turno' : 'Nuevo turno'}</DialogTitle>
          <DialogDescription>
            {turnoEditado
              ? 'Cambiá el horario, la profesional o los servicios.'
              : 'Se avisa solo si el horario ya está ocupado.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* Clienta */}
          <div>
            <Label htmlFor="clienta">Clienta</Label>
            {nuevaClienta ? (
              <div className="border-primary bg-primary-soft/40 space-y-3 rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary size-4" />
                  <p className="text-[13px] font-medium">Clienta nueva</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7"
                    onClick={() => setNuevaClienta(null)}
                  >
                    Cancelar
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="nc-nombre">Nombre y apellido</Label>
                    <Input
                      id="nc-nombre"
                      autoFocus
                      value={nuevaClienta.nombre}
                      onChange={(e) => setNuevaClienta({ ...nuevaClienta, nombre: e.target.value })}
                      placeholder="Ej.: Ana Pérez"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nc-tel">Teléfono</Label>
                    <Input
                      id="nc-tel"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={nuevaClienta.telefono}
                      onChange={(e) => setNuevaClienta({ ...nuevaClienta, telefono: e.target.value })}
                      placeholder="099 123 456"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <SelectorClienta
                clientas={estado.clientas}
                valor={clientaId}
                onCambio={setClientaId}
                onCrearNueva={(nombre) => {
                  setClientaId('')
                  setNuevaClienta({ nombre, telefono: '' })
                }}
              />
            )}

            {clienta && clienta.alertas.length > 0 && (
              <div className="bg-warning-soft text-warning mt-2 flex items-start gap-2 rounded-lg px-3 py-2 text-xs">
                <CircleAlert className="mt-px size-3.5 shrink-0" />
                <span>{clienta.alertas.join(' · ')}</span>
              </div>
            )}
            {clienta?.etiquetas.includes('Riesgo') && (
              <FieldHint className="text-danger">
                Tiene ausencias registradas. Conviene pedirle seña.
              </FieldHint>
            )}
          </div>

          <Separator />

          {/* Servicios */}
          <div>
            <Label>Servicios</Label>
            <SelectorServicios
              servicios={estado.servicios}
              seleccionados={serviciosIds}
              onCambio={(ids) => {
                setServiciosIds(ids)
                setHoraElegida('')
              }}
            />
            {serviciosIds.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span className="tabular text-foreground font-medium">
                    {duracionLegible(duracion)}
                  </span>
                </span>
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <Wallet className="size-3.5" />
                  <span className="tabular text-foreground font-medium">{moneda(precio)}</span>
                </span>
                {procesado > 0 && (
                  <Badge variant="info">
                    <Info />
                    {procesado} min de procesado libres
                  </Badge>
                )}
                {requiereTest && (
                  <Badge variant="warning">
                    <AlertTriangle />
                    Requiere prueba de mecha
                  </Badge>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Profesional + fecha */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="prof">Profesional</Label>
              <Select
                value={profesionalId}
                onValueChange={(v) => {
                  setProfesionalId(v)
                  setHoraElegida('')
                }}
                disabled={!serviciosIds.length}
              >
                <SelectTrigger id="prof">
                  <SelectValue
                    placeholder={serviciosIds.length ? 'Elegir profesional' : 'Elegí primero el servicio'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {profesionalesPosibles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.nombre}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {serviciosIds.length > 0 && profesionalesPosibles.length === 0 && (
                <FieldHint className="text-danger">
                  Ninguna profesional hace toda esa combinación de servicios.
                </FieldHint>
              )}
            </div>

            <div>
              <Label htmlFor="dia">Día</Label>
              <Input
                id="dia"
                type="date"
                value={dia}
                min={claveDia(new Date())}
                onChange={(e) => {
                  setDia(e.target.value)
                  setHoraElegida('')
                }}
              />
            </div>
          </div>

          {/* Horarios libres */}
          <div>
            <Label>
              <CalendarDays className="size-3.5" />
              Horarios libres · {fechaLarga(diaDate)}
            </Label>

            {!profesionalId || !duracion ? (
              <p className="text-muted-foreground border-border rounded-xl border border-dashed px-4 py-6 text-center text-[13px]">
                Elegí servicio y profesional para ver los horarios disponibles.
              </p>
            ) : huecos.length ? (
              <div className="flex flex-wrap gap-1.5">
                {huecos.map((h) => {
                  const hm = hhmm(h.inicio)
                  const activo = hm === horaElegida
                  return (
                    <button
                      key={hm}
                      type="button"
                      onClick={() => setHoraElegida(hm)}
                      aria-pressed={activo}
                      className={cn(
                        'tabular cursor-pointer rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors duration-200',
                        activo
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50 hover:bg-primary-soft',
                      )}
                    >
                      {hm}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="border-border rounded-xl border border-dashed p-4">
                <p className="text-[13px] font-medium">
                  {prof ? `${primerNombre(prof.nombre)} no tiene lugar ese día.` : 'Sin lugar ese día.'}
                </p>
                {alternativas.length > 0 && (
                  <>
                    <p className="text-muted-foreground mt-1 mb-2.5 text-xs">
                      Próximos horarios libres:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {alternativas.map((h) => (
                        <button
                          key={h.inicio.toISOString()}
                          type="button"
                          onClick={() => {
                            setDia(claveDia(h.inicio))
                            setHoraElegida(hhmm(h.inicio))
                          }}
                          className="border-border hover:border-primary/50 hover:bg-primary-soft cursor-pointer rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors"
                        >
                          {fechaRelativa(h.inicio)} · <span className="tabular">{hhmm(h.inicio)}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {conflicto && (
              <div className="bg-danger-soft text-danger mt-2 flex items-start gap-2 rounded-lg px-3 py-2 text-xs">
                <AlertTriangle className="mt-px size-3.5 shrink-0" />
                <span>{conflicto.mensaje}</span>
              </div>
            )}
          </div>

          {/* Seña */}
          {precio > 0 && (
            <div
              className={cn(
                'flex items-start gap-3 rounded-xl border p-3',
                seniaRecomendada ? 'border-warning/40 bg-warning-soft/40' : 'border-border',
              )}
            >
              <input
                id="senia"
                type="checkbox"
                checked={conSenia}
                onChange={(e) => setConSenia(e.target.checked)}
                className="accent-primary mt-0.5 size-4 cursor-pointer"
              />
              <label htmlFor="senia" className="flex-1 cursor-pointer">
                <span className="block text-[13px] font-medium">
                  Pedir seña de {moneda(seniaSugerida)}
                </span>
                <span className="text-muted-foreground block text-xs">
                  {seniaRecomendada
                    ? `Recomendado: son ${estado.ajustes.politicas.seniaPorcentaje}% de un servicio de ${moneda(precio)}.`
                    : 'Opcional para este monto.'}
                </span>
              </label>
            </div>
          )}

          {/* Notas */}
          <div>
            <Label htmlFor="notas">Notas para el equipo</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej.: quiere subir medio tono, viene con la nena."
              className="min-h-20"
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <div className="mr-auto hidden items-center gap-2.5 sm:flex">
            {prof && inicio && (
              <>
                <Avatar name={prof.nombre} color={prof.color} size="sm" />
                <div className="leading-tight">
                  <p className="text-[13px] font-medium">
                    {fechaRelativa(inicio)} · <span className="tabular">{hhmm(inicio)}</span>
                    {fin && <span className="tabular text-muted-foreground"> – {hhmm(fin)}</span>}
                  </p>
                  <p className="text-muted-foreground text-2xs">
                    {primerNombre(prof.nombre)} · {moneda(precio)}
                  </p>
                </div>
              </>
            )}
          </div>
          <Button variant="secondary" onClick={() => onAbrir(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={!listo}>
            <Scissors />
            {turnoEditado ? 'Guardar cambios' : 'Agendar turno'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
