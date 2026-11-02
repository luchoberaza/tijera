import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowRight,
  Ban,
  CalendarClock,
  Check,
  CircleAlert,
  Clock,
  ExternalLink,
  Hourglass,
  MessageCircle,
  Phone,
  Repeat,
  UserRound,
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
import { Avatar, Separator } from '@/components/ui/misc'
import { ChipEstado, ChipOrigen, PuntoServicio } from '@/components/turnos/piezas'
import {
  METODO_PAGO,
  buscarClienta,
  buscarProfesional,
  procesadoTotal,
  resumenClienta,
  serviciosDeTurno,
} from '@/lib/agenda'
import { d, duracionLegible, fechaLarga, hhmm } from '@/lib/fecha'
import { moneda, primerNombre, telefonoLegible } from '@/lib/formato'
import type { Turno } from '@/lib/tipos'
import { useSalon } from '@/store/salon'

export function DialogoDetalleTurno({
  turnoId,
  abierto,
  onAbrir,
  onReprogramar,
  onCobrar,
}: {
  turnoId: string | null
  abierto: boolean
  onAbrir: (v: boolean) => void
  onReprogramar: (turno: Turno) => void
  onCobrar: (turno: Turno) => void
}) {
  const { estado, dispatch } = useSalon()
  const turno = estado.turnos.find((t) => t.id === turnoId)

  if (!turno) return null

  const clienta = buscarClienta(estado, turno.clientaId)
  const prof = buscarProfesional(estado, turno.profesionalId)
  const servicios = serviciosDeTurno(estado, turno)
  const procesado = procesadoTotal(estado, turno.serviciosIds)
  const resumen = clienta ? resumenClienta(estado, clienta.id) : null
  const duracion = (d(turno.fin).getTime() - d(turno.inicio).getTime()) / 60000

  const cambiarEstado = (nuevo: Turno['estado'], mensaje: string) => {
    dispatch({ tipo: 'turno/estado', id: turno.id, estado: nuevo })
    toast.success(mensaje, { description: `${clienta?.nombre} · ${hhmm(turno.inicio)}` })
    if (nuevo === 'cancelado' || nuevo === 'no_asistio') onAbrir(false)
  }

  const enviarRecordatorio = () => {
    dispatch({ tipo: 'turno/actualizar', id: turno.id, cambios: { recordatorioEnviado: true } })
    toast.success('Recordatorio enviado por WhatsApp', {
      description: `A ${clienta?.nombre} · ${telefonoLegible(clienta?.telefono ?? '')}`,
    })
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbrir}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{clienta?.nombre ?? 'Turno'}</DialogTitle>
            <ChipEstado estado={turno.estado} />
          </div>
          <DialogDescription>
            {fechaLarga(turno.inicio)} · {hhmm(turno.inicio)} a {hhmm(turno.fin)} ·{' '}
            {duracionLegible(duracion)}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* Alertas de la clienta: lo primero que hay que ver */}
          {clienta && clienta.alertas.length > 0 && (
            <div className="bg-warning-soft text-warning flex items-start gap-2.5 rounded-xl px-3.5 py-3">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <div className="text-[13px] leading-relaxed">
                <p className="font-semibold">Atención antes de empezar</p>
                {clienta.alertas.map((a) => (
                  <p key={a}>{a}</p>
                ))}
              </div>
            </div>
          )}

          {/* Servicios */}
          <div>
            <p className="text-muted-foreground mb-2 text-2xs font-semibold tracking-wide uppercase">
              Servicios
            </p>
            <ul className="space-y-2">
              {servicios.map((s) => (
                <li key={s.id} className="flex items-center gap-2.5">
                  <PuntoServicio servicio={s} />
                  <span className="flex-1 text-sm font-medium">{s.nombre}</span>
                  <span className="text-muted-foreground text-2xs">
                    {duracionLegible(s.duracionMin)}
                  </span>
                  <span className="tabular text-sm font-semibold">{moneda(s.precio)}</span>
                </li>
              ))}
            </ul>

            {procesado > 0 && (
              <div className="bg-info-soft text-info mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs">
                <Hourglass className="mt-px size-3.5 shrink-0" />
                <span>
                  Hay {procesado} min de procesado: {prof ? primerNombre(prof.nombre) : 'la profesional'}{' '}
                  queda libre en el medio y puede atender a otra clienta.
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Datos operativos */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2.5">
              {prof && <Avatar name={prof.nombre} color={prof.color} size="sm" />}
              <div className="leading-tight">
                <p className="text-muted-foreground text-2xs">Atiende</p>
                <p className="text-[13px] font-medium">{prof?.nombre}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-full">
                <Clock className="size-4" />
              </div>
              <div className="leading-tight">
                <p className="text-muted-foreground text-2xs">Horario</p>
                <p className="tabular text-[13px] font-medium">
                  {hhmm(turno.inicio)} – {hhmm(turno.fin)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-full">
                <Wallet className="size-4" />
              </div>
              <div className="leading-tight">
                <p className="text-muted-foreground text-2xs">Total</p>
                <p className="tabular text-[13px] font-medium">
                  {moneda(turno.precioTotal)}
                  {turno.senia > 0 && (
                    <span className="text-success"> · seña {moneda(turno.senia)}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-full">
                <MessageCircle className="size-4" />
              </div>
              <div className="leading-tight">
                <p className="text-muted-foreground text-2xs">Origen · código {turno.codigo}</p>
                <ChipOrigen origen={turno.origen} />
              </div>
            </div>
          </div>

          {turno.notas && (
            <div className="bg-surface-2 border-border rounded-xl border px-3.5 py-3">
              <p className="text-muted-foreground mb-1 text-2xs font-semibold tracking-wide uppercase">
                Nota
              </p>
              <p className="text-[13px] leading-relaxed">{turno.notas}</p>
            </div>
          )}

          {turno.pago && (
            <div className="bg-success-soft text-success rounded-xl px-3.5 py-3">
              <p className="text-2xs font-semibold tracking-wide uppercase">Cobrado</p>
              <p className="tabular mt-1 text-sm font-semibold">
                {moneda(turno.pago.monto + turno.pago.propina)} · {METODO_PAGO[turno.pago.metodo]}
                {turno.pago.propina > 0 && ` · propina ${moneda(turno.pago.propina)}`}
              </p>
            </div>
          )}

          <Separator />

          {/* Contexto de la clienta */}
          {clienta && resumen && (
            <div>
              <p className="text-muted-foreground mb-2 text-2xs font-semibold tracking-wide uppercase">
                La clienta
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="text-muted-foreground size-3.5" />
                  <span className="tabular font-medium">{resumen.visitas}</span>
                  <span className="text-muted-foreground">visitas</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Wallet className="text-muted-foreground size-3.5" />
                  <span className="tabular font-medium">{moneda(resumen.gastoTotal)}</span>
                  <span className="text-muted-foreground">históricos</span>
                </span>
                {resumen.ausencias > 0 && (
                  <Badge variant="danger">
                    {resumen.ausencias} {resumen.ausencias === 1 ? 'ausencia' : 'ausencias'}
                  </Badge>
                )}
                <a
                  href={`tel:${clienta.telefono}`}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="size-3.5" />
                  {telefonoLegible(clienta.telefono)}
                </a>
                <Button asChild variant="ghost" size="sm" className="ml-auto">
                  <Link to={`/clientas/${clienta.id}`} onClick={() => onAbrir(false)}>
                    Ver ficha completa
                    <ExternalLink />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {turno.estado !== 'completado' && turno.estado !== 'cancelado' && (
              <Button variant="ghost" size="sm" onClick={() => onReprogramar(turno)}>
                <Repeat />
                Reprogramar
              </Button>
            )}
            {(turno.estado === 'pendiente' || turno.estado === 'confirmado') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={enviarRecordatorio}
                disabled={turno.recordatorioEnviado}
              >
                <MessageCircle />
                {turno.recordatorioEnviado ? 'Recordatorio enviado' : 'Enviar recordatorio'}
              </Button>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {turno.estado === 'pendiente' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cambiarEstado('cancelado', 'Turno cancelado')}
                >
                  <Ban />
                  Cancelar
                </Button>
                <Button size="sm" onClick={() => cambiarEstado('confirmado', 'Turno confirmado')}>
                  <Check />
                  Confirmar
                </Button>
              </>
            )}

            {turno.estado === 'confirmado' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cambiarEstado('no_asistio', 'Marcada como ausente')}
                >
                  <Ban />
                  No vino
                </Button>
                <Button size="sm" onClick={() => cambiarEstado('en_curso', 'Clienta en el sillón')}>
                  <ArrowRight />
                  Llegó
                </Button>
              </>
            )}

            {turno.estado === 'en_curso' && (
              <Button variant="success" size="sm" onClick={() => onCobrar(turno)}>
                <Wallet />
                Cobrar y cerrar
              </Button>
            )}

            {(turno.estado === 'cancelado' || turno.estado === 'no_asistio') && (
              <Button size="sm" onClick={() => onReprogramar(turno)}>
                <CalendarClock />
                Reagendar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
