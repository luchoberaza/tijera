import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  CalendarPlus,
  CircleAlert,
  FlaskConical,
  MessageCircle,
  Phone,
  Plus,
  Repeat,
  Wallet,
} from 'lucide-react'
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
import { Input, Label, Textarea } from '@/components/ui/input'
import {
  Avatar,
  EmptyState,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/misc'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Kpi } from '@/components/bento'
import { ChipEstado, ChipOrigen, PuntoServicio } from '@/components/turnos/piezas'
import { useTurnos } from '@/components/turnos/proveedor-turnos'
import {
  METODO_PAGO,
  buscarProfesional,
  esActivo,
  nombreServicios,
  resumenClienta,
  serviciosDeTurno,
  turnosDeClienta,
} from '@/lib/agenda'
import { d, fechaConAnio, fechaCorta, fechaLarga, fechaRelativa, hhmm } from '@/lib/fecha'
import { moneda, telefonoLegible } from '@/lib/formato'
import type { FichaTecnica } from '@/lib/tipos'
import { useSalon } from '@/store/salon'

export function PaginaFichaClienta() {
  const { id } = useParams<{ id: string }>()
  const navegar = useNavigate()
  const { estado, dispatch } = useSalon()
  const { nuevoTurno, verTurno } = useTurnos()
  const [fichaAbierta, setFichaAbierta] = React.useState(false)
  const [notas, setNotas] = React.useState('')

  const clienta = estado.clientas.find((c) => c.id === id)

  React.useEffect(() => {
    setNotas(clienta?.notas ?? '')
  }, [clienta?.notas])

  if (!clienta) {
    return (
      <Card>
        <EmptyState
          icon={CircleAlert}
          title="No encontramos esa clienta"
          description="Puede que se haya eliminado o que el enlace esté mal."
          action={
            <Button onClick={() => navegar('/clientas')}>
              <ArrowLeft />
              Volver a clientas
            </Button>
          }
        />
      </Card>
    )
  }

  const resumen = resumenClienta(estado, clienta.id)
  const historial = turnosDeClienta(estado, clienta.id)
  const proximos = historial.filter((t) => d(t.inicio) > new Date() && esActivo(t)).reverse()
  const pasados = historial.filter((t) => d(t.inicio) <= new Date())

  const guardarNotas = () => {
    dispatch({ tipo: 'clienta/actualizar', id: clienta.id, cambios: { notas: notas.trim() } })
    toast.success('Notas guardadas')
  }

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/clientas">
          <ArrowLeft />
          Clientas
        </Link>
      </Button>

      {/* ------------------------------ Encabezado ---------------------------- */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={clienta.nombre} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl leading-tight font-bold">{clienta.nombre}</h1>
            <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
              <a
                href={`tel:${clienta.telefono}`}
                className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
              >
                <Phone className="size-3.5" />
                {telefonoLegible(clienta.telefono)}
              </a>
              {clienta.email && <span className="truncate">{clienta.email}</span>}
              <span>Clienta desde {fechaConAnio(clienta.desde)}</span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {clienta.etiquetas.map((e) => (
                <Badge
                  key={e}
                  variant={
                    e === 'VIP' ? 'primary' : e === 'Nueva' ? 'info' : e === 'Riesgo' ? 'danger' : 'neutral'
                  }
                >
                  {e === 'Riesgo' ? 'Con ausencias' : e}
                </Badge>
              ))}
              {resumen.profesionalHabitual && (
                <Badge variant="outline">
                  Se atiende con {resumen.profesionalHabitual.nombre.split(' ')[0]}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" asChild>
              <a
                href={`https://wa.me/${clienta.telefono.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle />
                WhatsApp
              </a>
            </Button>
            <Button onClick={() => nuevoTurno({ clientaId: clienta.id })}>
              <CalendarPlus />
              Agendar turno
            </Button>
          </div>
        </div>

        {clienta.alertas.length > 0 && (
          <div className="bg-warning-soft text-warning mt-4 flex items-start gap-2.5 rounded-xl px-3.5 py-3">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <div className="text-[13px] leading-relaxed">
              <p className="font-semibold">Tener en cuenta</p>
              {clienta.alertas.map((a) => (
                <p key={a}>{a}</p>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* --------------------------------- KPIs ------------------------------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <Kpi etiqueta="Visitas" valor={resumen.visitas} detalle="turnos completados" />
        </Card>
        <Card>
          <Kpi
            etiqueta="Gastado"
            valor={moneda(resumen.gastoTotal)}
            icono={Wallet}
            tono="success"
            detalle={`Ticket promedio ${moneda(resumen.ticketPromedio)}`}
          />
        </Card>
        <Card>
          <Kpi
            etiqueta="Última visita"
            valor={resumen.diasDesdeUltima !== undefined ? `${resumen.diasDesdeUltima} d` : '—'}
            detalle={
              resumen.ultimaVisita ? fechaCorta(resumen.ultimaVisita.inicio) : 'Todavía no vino'
            }
          />
        </Card>
        <Card>
          <Kpi
            etiqueta="Ausencias"
            valor={resumen.ausencias}
            tono={resumen.ausencias > 0 ? 'warning' : 'neutral'}
            detalle={resumen.ausencias > 0 ? 'conviene pedirle seña' : 'siempre vino'}
          />
        </Card>
      </div>

      {/* -------------------------------- Detalle ----------------------------- */}
      <Tabs defaultValue="historial">
        <TabsList>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="ficha">
            <FlaskConical />
            Ficha técnica
          </TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
        </TabsList>

        {/* Historial */}
        <TabsContent value="historial" className="mt-4 space-y-4">
          {proximos.length > 0 && (
            <Card>
              <div className="px-5 pt-5 pb-2">
                <h2 className="font-display text-[15px] font-semibold">Turnos agendados</h2>
              </div>
              <ul className="px-2 pb-3">
                {proximos.map((t) => (
                  <li key={t.id}>
                    <FilaTurno turno={t} onVer={verTurno} />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <div className="px-5 pt-5 pb-2">
              <h2 className="font-display text-[15px] font-semibold">Visitas anteriores</h2>
              <p className="text-muted-foreground text-2xs">
                {pasados.length} {pasados.length === 1 ? 'registro' : 'registros'}
              </p>
            </div>
            {pasados.length === 0 ? (
              <EmptyState
                icon={CalendarPlus}
                title="Todavía no vino"
                description="Cuando la atiendas, el turno queda registrado acá."
              />
            ) : (
              <ul className="px-2 pb-3">
                {pasados.slice(0, 25).map((t) => (
                  <li key={t.id}>
                    <FilaTurno turno={t} onVer={verTurno} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        {/* Ficha técnica */}
        <TabsContent value="ficha" className="mt-4">
          <Card>
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
              <div>
                <h2 className="font-display text-[15px] font-semibold">Fórmulas de color</h2>
                <p className="text-muted-foreground mt-0.5 text-2xs">
                  El dato que no se puede perder: con qué se logró cada resultado.
                </p>
              </div>
              <Button variant="soft" size="sm" onClick={() => setFichaAbierta(true)}>
                <Plus />
                Agregar
              </Button>
            </div>

            {clienta.fichaTecnica.length === 0 ? (
              <EmptyState
                icon={FlaskConical}
                title="Sin fórmulas registradas"
                description="Anotá la fórmula al terminar el servicio y la próxima vez repetir el tono es inmediato."
                action={
                  <Button variant="secondary" onClick={() => setFichaAbierta(true)}>
                    <Plus />
                    Cargar la primera
                  </Button>
                }
              />
            ) : (
              <ol className="space-y-3 px-5 pb-5">
                {clienta.fichaTecnica.map((f, i) => {
                  const prof = buscarProfesional(estado, f.profesionalId)
                  return (
                    <li
                      key={`${f.fecha}-${i}`}
                      className="border-border bg-surface-2 rounded-xl border p-3.5"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant={i === 0 ? 'primary' : 'neutral'}>
                          {i === 0 ? 'Última aplicada' : fechaCorta(f.fecha)}
                        </Badge>
                        {i === 0 && (
                          <span className="text-muted-foreground text-2xs">
                            {fechaLarga(f.fecha)}
                          </span>
                        )}
                        {prof && (
                          <span className="text-muted-foreground ml-auto text-2xs">
                            {prof.nombre}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[13px] leading-relaxed font-medium">{f.formula}</p>
                      {f.observacion && (
                        <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                          {f.observacion}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
          </Card>
        </TabsContent>

        {/* Notas */}
        <TabsContent value="notas" className="mt-4">
          <Card className="p-5">
            <Label htmlFor="notas-clienta">Notas internas</Label>
            <Textarea
              id="notas-clienta"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Gustos, cómo le gusta el café, de qué hablan, referencias…"
              className="min-h-32"
            />
            <p className="text-muted-foreground mt-1.5 text-xs">
              Solo las ve el equipo. La clienta nunca accede a esta información.
            </p>
            <div className="mt-3 flex justify-end">
              <Button onClick={guardarNotas} disabled={notas === (clienta.notas ?? '')}>
                Guardar notas
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <DialogoFicha
        abierto={fichaAbierta}
        onAbrir={setFichaAbierta}
        clientaId={clienta.id}
        nombre={clienta.nombre}
      />
    </div>
  )
}

/* ------------------------------- Fila de turno ---------------------------- */

function FilaTurno({ turno, onVer }: { turno: ReturnType<typeof turnosDeClienta>[number]; onVer: (id: string) => void }) {
  const { estado } = useSalon()
  const prof = buscarProfesional(estado, turno.profesionalId)
  const servicios = serviciosDeTurno(estado, turno)

  return (
    <button
      type="button"
      onClick={() => onVer(turno.id)}
      className="hover:bg-muted flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200"
    >
      <span className="w-24 shrink-0">
        <span className="block text-[13px] font-semibold">{fechaRelativa(turno.inicio)}</span>
        <span className="text-muted-foreground tabular block text-2xs">{hhmm(turno.inicio)}</span>
      </span>
      <PuntoServicio servicio={servicios[0]} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">
          {nombreServicios(estado, turno)}
        </span>
        <span className="text-muted-foreground flex items-center gap-2 text-2xs">
          {prof?.nombre.split(' ')[0]}
          <ChipOrigen origen={turno.origen} corto />
          {turno.pago && <span>· {METODO_PAGO[turno.pago.metodo]}</span>}
        </span>
      </span>
      <ChipEstado estado={turno.estado} className="hidden sm:inline-flex" />
      <span className="tabular w-16 shrink-0 text-right text-[13px] font-semibold">
        {moneda(turno.pago ? turno.pago.monto + turno.pago.propina : turno.precioTotal)}
      </span>
    </button>
  )
}

/* --------------------------- Alta de ficha técnica ------------------------ */

function DialogoFicha({
  abierto,
  onAbrir,
  clientaId,
  nombre,
}: {
  abierto: boolean
  onAbrir: (v: boolean) => void
  clientaId: string
  nombre: string
}) {
  const { estado, dispatch } = useSalon()
  const [formula, setFormula] = React.useState('')
  const [observacion, setObservacion] = React.useState('')
  const [profesionalId, setProfesionalId] = React.useState(estado.profesionales[0]?.id ?? '')
  const [fecha, setFecha] = React.useState(() => new Date().toISOString().slice(0, 10))

  React.useEffect(() => {
    if (abierto) {
      setFormula('')
      setObservacion('')
      setFecha(new Date().toISOString().slice(0, 10))
    }
  }, [abierto])

  const guardar = () => {
    if (!formula.trim()) return
    const ficha: FichaTecnica = {
      fecha,
      formula: formula.trim(),
      observacion: observacion.trim() || undefined,
      profesionalId,
    }
    dispatch({ tipo: 'clienta/ficha', id: clientaId, ficha })
    toast.success('Fórmula guardada', { description: nombre })
    onAbrir(false)
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbrir}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva fórmula</DialogTitle>
          <DialogDescription>
            Anotala tal cual la aplicaste: tono, oxidante y tiempo de exposición.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="f-formula">
              Fórmula <span className="text-danger">*</span>
            </Label>
            <Textarea
              id="f-formula"
              autoFocus
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="Ej.: Raíz 6.0 + 6.34 (1:1) · Ox 20 vol · 35 min"
              className="min-h-20 font-mono"
            />
          </div>

          <div>
            <Label htmlFor="f-obs">Observaciones</Label>
            <Input
              id="f-obs"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Ej.: canas resistentes en la sien, empezar por ahí"
            />
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="f-fecha">Fecha</Label>
              <Input
                id="f-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="f-prof">Quién la aplicó</Label>
              <Select value={profesionalId} onValueChange={setProfesionalId}>
                <SelectTrigger id="f-prof">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {estado.profesionales.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onAbrir(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={!formula.trim()}>
            <Repeat />
            Guardar fórmula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
