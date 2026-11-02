import * as React from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Bot,
  CalendarCheck,
  CheckCheck,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  UserRound,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Label, Textarea } from '@/components/ui/input'
import {
  Avatar,
  EmptyState,
  Separator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/misc'
import { ChipEstado } from '@/components/turnos/piezas'
import { useTurnos } from '@/components/turnos/proveedor-turnos'
import { buscarClienta, esActivo, nombreServicios, turnosDelDia } from '@/lib/agenda'
import {
  respuestaInicial,
  responder,
  type ContextoBot,
  type RespuestaBot,
} from '@/lib/bot'
import { addMinutes, fechaRelativa, haceCuanto, hhmm } from '@/lib/fecha'
import { moneda, telefonoLegible } from '@/lib/formato'
import type { Conversacion, MensajeWA, Turno } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { nuevoCodigo, nuevoId, useSalon } from '@/store/salon'

export function PaginaWhatsapp() {
  const { estado, dispatch } = useSalon()
  const sinLeer = estado.conversaciones.reduce((s, c) => s + c.sinLeer, 0)
  const reservasHoy = turnosDelDia(estado, new Date()).filter(
    (t) => t.origen === 'whatsapp' && esActivo(t),
  ).length
  const reservasTotales = estado.turnos.filter((t) => t.origen === 'whatsapp').length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl leading-tight font-bold">WhatsApp</h1>
          <p className="text-muted-foreground mt-1 text-[13px]">
            El asistente atiende solo las 24 h. Vos entrás únicamente cuando hace falta.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xs text-muted-foreground">Asistente</p>
            <p className="text-[13px] font-semibold">
              {estado.ajustes.bot.activo ? 'Encendido' : 'Pausado'}
            </p>
          </div>
          <Switch
            checked={estado.ajustes.bot.activo}
            onCheckedChange={(v) => {
              dispatch({
                tipo: 'ajustes/actualizar',
                cambios: { bot: { ...estado.ajustes.bot, activo: v } },
              })
              toast.success(v ? 'Asistente encendido' : 'Asistente pausado', {
                description: v
                  ? 'Vuelve a tomar reservas automáticamente.'
                  : 'Los mensajes quedan sin responder hasta que lo enciendas.',
              })
            }}
            aria-label="Encender o pausar el asistente"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-muted-foreground text-2xs font-semibold uppercase">Turnos hoy por bot</p>
          <p className="font-display tabular mt-1 text-2xl font-bold">{reservasHoy}</p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-2xs font-semibold uppercase">Reservas totales</p>
          <p className="font-display tabular mt-1 text-2xl font-bold">{reservasTotales}</p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-2xs font-semibold uppercase">Sin leer</p>
          <p className="font-display tabular mt-1 text-2xl font-bold">{sinLeer}</p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-2xs font-semibold uppercase">Costo mensual</p>
          <p className="font-display tabular mt-1 text-2xl font-bold">{moneda(0)}</p>
          <p className="text-muted-foreground text-2xs">responder es gratis</p>
        </Card>
      </div>

      <Tabs defaultValue="conversaciones">
        <TabsList>
          <TabsTrigger value="conversaciones">
            <MessageCircle />
            Conversaciones
          </TabsTrigger>
          <TabsTrigger value="probar">
            <Zap />
            Probar el asistente
          </TabsTrigger>
          <TabsTrigger value="plantillas">Mensajes automáticos</TabsTrigger>
        </TabsList>

        <TabsContent value="conversaciones" className="mt-4">
          <Conversaciones />
        </TabsContent>

        <TabsContent value="probar" className="mt-4">
          <Simulador />
        </TabsContent>

        <TabsContent value="plantillas" className="mt-4">
          <Plantillas />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ------------------------------ Conversaciones ---------------------------- */

function Conversaciones() {
  const { estado, dispatch } = useSalon()
  const { verTurno } = useTurnos()
  const [activaId, setActivaId] = React.useState(estado.conversaciones[0]?.id ?? '')
  const [texto, setTexto] = React.useState('')

  const activa = estado.conversaciones.find((c) => c.id === activaId)

  React.useEffect(() => {
    if (activa && activa.sinLeer > 0) dispatch({ tipo: 'wa/leida', id: activa.id })
  }, [activa, dispatch])

  const enviar = () => {
    if (!texto.trim() || !activa) return
    const mensaje: MensajeWA = {
      id: nuevoId('m'),
      autor: 'salon',
      texto: texto.trim(),
      hora: new Date().toISOString(),
    }
    dispatch({ tipo: 'wa/mensaje', id: activa.id, mensaje })
    dispatch({ tipo: 'wa/estado', id: activa.id, estado: 'humano' })
    setTexto('')
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[20rem_1fr]">
      {/* Lista */}
      <Card className="overflow-hidden lg:max-h-[38rem]">
        <div className="border-border border-b px-4 py-3">
          <h2 className="font-display text-[15px] font-semibold">Bandeja</h2>
          <p className="text-muted-foreground text-2xs">
            {estado.conversaciones.length} conversaciones
          </p>
        </div>
        <ul className="max-h-80 overflow-y-auto lg:max-h-[33rem]">
          {estado.conversaciones.map((c) => {
            const ultimo = c.mensajes.at(-1)
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setActivaId(c.id)}
                  className={cn(
                    'flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors duration-200',
                    activaId === c.id ? 'bg-primary-soft' : 'hover:bg-muted',
                  )}
                >
                  <Avatar name={c.nombreContacto} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-semibold">{c.nombreContacto}</span>
                      <span className="text-muted-foreground ml-auto shrink-0 text-2xs">
                        {haceCuanto(c.ultimaActividad)}
                      </span>
                    </span>
                    <span className="text-muted-foreground mt-0.5 block truncate text-2xs">
                      {ultimo?.autor !== 'clienta' && '✓ '}
                      {ultimo?.texto.replace(/\n/g, ' ')}
                    </span>
                    <span className="mt-1.5 flex items-center gap-1.5">
                      {c.estado === 'humano' ? (
                        <Badge variant="warning">
                          <UserRound />
                          Te necesita
                        </Badge>
                      ) : (
                        <Badge variant="whatsapp">
                          <Bot />
                          Bot
                        </Badge>
                      )}
                      {c.turnoId && (
                        <Badge variant="success">
                          <CalendarCheck />
                          Turno tomado
                        </Badge>
                      )}
                      {c.sinLeer > 0 && (
                        <span className="bg-whatsapp ml-auto grid size-5 place-items-center rounded-full text-[10px] font-bold text-white">
                          {c.sinLeer}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Card>

      {/* Chat */}
      <Card className="flex flex-col overflow-hidden lg:max-h-[38rem]">
        {!activa ? (
          <EmptyState
            icon={MessageCircle}
            title="Elegí una conversación"
            description="Acá vas a ver todo lo que el asistente respondió por vos."
          />
        ) : (
          <>
            <CabeceraChat conversacion={activa} onVerTurno={verTurno} />
            <HiloMensajes conversacion={activa} />
            <div className="border-border bg-surface-2/60 border-t p-3">
              <div className="flex items-end gap-2">
                <Textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      enviar()
                    }
                  }}
                  placeholder="Escribí para responder vos misma…"
                  aria-label="Responder"
                  className="max-h-28 min-h-11 flex-1 resize-none py-2.5"
                />
                <Button
                  variant="whatsapp"
                  size="icon"
                  onClick={enviar}
                  disabled={!texto.trim()}
                  aria-label="Enviar mensaje"
                >
                  <Send />
                </Button>
              </div>
              <p className="text-muted-foreground mt-2 text-2xs">
                Si respondés vos, el asistente se hace a un lado en esta conversación.
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

function CabeceraChat({
  conversacion,
  onVerTurno,
}: {
  conversacion: Conversacion
  onVerTurno: (id: string) => void
}) {
  const { estado, dispatch } = useSalon()
  const turno = estado.turnos.find((t) => t.id === conversacion.turnoId)
  const clienta = conversacion.clientaId ? buscarClienta(estado, conversacion.clientaId) : undefined

  return (
    <div className="border-border flex flex-wrap items-center gap-3 border-b px-4 py-3">
      <Avatar name={conversacion.nombreContacto} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{conversacion.nombreContacto}</p>
        <p className="text-muted-foreground text-2xs">{telefonoLegible(conversacion.telefono)}</p>
      </div>

      {turno && (
        <button
          type="button"
          onClick={() => onVerTurno(turno.id)}
          className="bg-success-soft text-success hover:bg-success-soft/70 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-2xs font-semibold transition-colors"
        >
          <CalendarCheck className="size-3.5" />
          {fechaRelativa(turno.inicio)} {hhmm(turno.inicio)}
        </button>
      )}

      {clienta && (
        <Button asChild variant="ghost" size="sm">
          <Link to={`/clientas/${clienta.id}`}>Ver ficha</Link>
        </Button>
      )}

      <Button
        variant={conversacion.estado === 'bot' ? 'ghost' : 'soft'}
        size="sm"
        onClick={() =>
          dispatch({
            tipo: 'wa/estado',
            id: conversacion.id,
            estado: conversacion.estado === 'bot' ? 'humano' : 'bot',
          })
        }
      >
        {conversacion.estado === 'bot' ? <Bot /> : <UserRound />}
        {conversacion.estado === 'bot' ? 'Atiende el bot' : 'Atendés vos'}
      </Button>
    </div>
  )
}

function HiloMensajes({ conversacion }: { conversacion: Conversacion }) {
  const finRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' })
  }, [conversacion.mensajes.length, conversacion.id])

  return (
    <div className="bg-surface-2/40 min-h-64 flex-1 space-y-3 overflow-y-auto p-4">
      {conversacion.mensajes.map((m) => (
        <Burbuja key={m.id} mensaje={m} />
      ))}
      <div ref={finRef} />
    </div>
  )
}

function Burbuja({ mensaje, onBoton }: { mensaje: MensajeWA; onBoton?: (b: string) => void }) {
  const propio = mensaje.autor !== 'clienta'

  return (
    <div className={cn('flex', propio ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[85%] sm:max-w-[75%]', propio && 'flex flex-col items-end')}>
        {mensaje.autor === 'bot' && (
          <p className="text-whatsapp mb-1 flex items-center gap-1 text-2xs font-semibold">
            <Bot className="size-3" />
            Asistente
          </p>
        )}
        {mensaje.autor === 'salon' && (
          <p className="text-muted-foreground mb-1 flex items-center gap-1 text-2xs font-semibold">
            <UserRound className="size-3" />
            Vos
          </p>
        )}

        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line shadow-xs',
            mensaje.autor === 'clienta' && 'bg-surface border-border rounded-tl-sm border',
            mensaje.autor === 'bot' && 'bg-whatsapp-soft text-foreground rounded-tr-sm',
            mensaje.autor === 'salon' && 'bg-primary-soft text-foreground rounded-tr-sm',
          )}
        >
          {mensaje.texto}
        </div>

        {mensaje.botones && mensaje.botones.length > 0 && (
          <div className={cn('mt-1.5 flex flex-wrap gap-1.5', propio && 'justify-end')}>
            {mensaje.botones.map((b) => (
              <button
                key={b}
                type="button"
                disabled={!onBoton}
                onClick={() => onBoton?.(b)}
                className={cn(
                  'border-border bg-surface rounded-full border px-3 py-1.5 text-2xs font-medium transition-colors duration-200',
                  onBoton
                    ? 'hover:border-whatsapp hover:bg-whatsapp-soft cursor-pointer'
                    : 'text-muted-foreground cursor-default',
                )}
              >
                {b}
              </button>
            ))}
          </div>
        )}

        <p
          className={cn(
            'text-muted-foreground mt-1 flex items-center gap-1 text-2xs',
            propio && 'justify-end',
          )}
        >
          {hhmm(mensaje.hora)}
          {propio && <CheckCheck className="text-info size-3" />}
        </p>
      </div>
    </div>
  )
}

/* -------------------------------- Simulador ------------------------------- */

function Simulador() {
  const { estado, dispatch } = useSalon()
  const { verTurno } = useTurnos()
  const [mensajes, setMensajes] = React.useState<MensajeWA[]>([])
  const [contexto, setContexto] = React.useState<ContextoBot>({ paso: 'inicio' })
  const [texto, setTexto] = React.useState('')
  const [turnoCreado, setTurnoCreado] = React.useState<Turno | null>(null)
  const finRef = React.useRef<HTMLDivElement>(null)
  const contador = React.useRef(0)

  const nuevoMensaje = (autor: MensajeWA['autor'], r: RespuestaBot): MensajeWA => ({
    id: `sim-${contador.current++}`,
    autor,
    texto: r.texto,
    botones: r.botones,
    hora: new Date().toISOString(),
  })

  const reiniciar = React.useCallback(() => {
    const inicial = respuestaInicial(estado)
    setMensajes(inicial.respuestas.map((r) => nuevoMensaje('bot', r)))
    setContexto(inicial.contexto)
    setTurnoCreado(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    reiniciar()
  }, [reiniciar])

  React.useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [mensajes.length])

  const enviar = (valor: string) => {
    const limpio = valor.trim()
    if (!limpio) return

    setMensajes((prev) => [...prev, nuevoMensaje('clienta', { texto: limpio })])
    setTexto('')

    const resultado = responder(estado, contexto, limpio)
    setContexto(resultado.contexto)

    // Pequeña demora para que se sienta como una conversación real
    window.setTimeout(() => {
      setMensajes((prev) => [...prev, ...resultado.respuestas.map((r) => nuevoMensaje('bot', r))])
    }, 420)

    if (resultado.reserva) {
      const servicio = estado.servicios.find((s) => s.id === resultado.reserva!.servicioId)!
      const inicio = new Date(resultado.reserva.inicio)
      const turno: Turno = {
        id: nuevoId('t'),
        codigo: nuevoCodigo(),
        // En la demo la reserva de prueba se asocia a una clienta de ejemplo.
        clientaId: estado.clientas[0].id,
        profesionalId: resultado.reserva.profesionalId,
        serviciosIds: [servicio.id],
        inicio: resultado.reserva.inicio,
        fin: addMinutes(inicio, servicio.duracionMin).toISOString(),
        estado: 'confirmado',
        origen: 'whatsapp',
        precioTotal: servicio.precio,
        senia: 0,
        recordatorioEnviado: false,
        creadoEn: new Date().toISOString(),
      }
      dispatch({ tipo: 'turno/crear', turno })
      setTurnoCreado(turno)
      window.setTimeout(() => {
        toast.success('El asistente agendó el turno', {
          description: `${fechaRelativa(turno.inicio)} ${hhmm(turno.inicio)} · ya está en la agenda`,
          action: { label: 'Ver', onClick: () => verTurno(turno.id) },
        })
      }, 500)
    }
  }

  const ultimoBot = [...mensajes].reverse().find((m) => m.autor === 'bot')

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_20rem]">
      <Card className="flex flex-col overflow-hidden">
        <div className="border-border flex items-center gap-3 border-b px-4 py-3">
          <div className="bg-whatsapp-soft text-whatsapp grid size-10 place-items-center rounded-full">
            <Bot className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{estado.ajustes.salon.nombre}</p>
            <p className="text-whatsapp flex items-center gap-1.5 text-2xs">
              <span className="bg-whatsapp animate-pulse-dot size-1.5 rounded-full" />
              en línea · responde al instante
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={reiniciar}>
            <RotateCcw />
            Reiniciar
          </Button>
        </div>

        <div className="bg-surface-2/40 h-[26rem] space-y-3 overflow-y-auto p-4">
          {mensajes.map((m) => (
            <Burbuja
              key={m.id}
              mensaje={m}
              onBoton={m.id === ultimoBot?.id ? enviar : undefined}
            />
          ))}
          <div ref={finRef} />
        </div>

        <div className="border-border bg-surface-2/60 border-t p-3">
          <div className="flex items-center gap-2">
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviar(texto)}
              placeholder="Escribí como si fueras la clienta…"
              aria-label="Mensaje de prueba"
            />
            <Button variant="whatsapp" size="icon" onClick={() => enviar(texto)} aria-label="Enviar">
              <Send />
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary size-4" />
            <h2 className="font-display text-[15px] font-semibold">Probalo vos</h2>
          </div>
          <p className="text-muted-foreground mt-1.5 text-[13px] leading-relaxed">
            Escribí como lo haría una clienta. El asistente te va a ofrecer{' '}
            <strong className="text-foreground">solo horarios realmente libres</strong> y, cuando
            elijas uno, el turno se carga en la agenda al instante.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['Hola', 'Quiero reservar un turno', 'Cuánto sale el color?', 'Dónde están?'].map(
              (s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  className="border-border hover:border-whatsapp hover:bg-whatsapp-soft cursor-pointer rounded-full border px-3 py-1.5 text-2xs font-medium transition-colors duration-200"
                >
                  {s}
                </button>
              ),
            )}
          </div>
        </Card>

        {turnoCreado && (
          <Card className="border-success/40 p-5">
            <Badge variant="success">
              <CalendarCheck />
              Turno creado
            </Badge>
            <p className="font-display mt-2 text-base font-bold">
              {fechaRelativa(turnoCreado.inicio)} · {hhmm(turnoCreado.inicio)}
            </p>
            <p className="text-muted-foreground mt-1 text-[13px]">
              {nombreServicios(estado, turnoCreado)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ChipEstado estado={turnoCreado.estado} />
              <span className="tabular text-[13px] font-semibold">
                {moneda(turnoCreado.precioTotal)}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => verTurno(turnoCreado.id)}>
                Ver turno
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link to="/agenda">Ver en la agenda</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

/* -------------------------------- Plantillas ------------------------------ */

function Plantillas() {
  const { estado, dispatch } = useSalon()
  const { recordatorios, bot } = estado.ajustes
  const [plantilla, setPlantilla] = React.useState(recordatorios.plantilla)
  const [bienvenida, setBienvenida] = React.useState(bot.bienvenida)

  const ejemplo = plantilla
    .replace('{nombre}', 'Lucía')
    .replace('{servicio}', 'Color raíz')
    .replace('{hora}', '15:30')
    .replace('{profesional}', 'Valeria')

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="font-display text-[15px] font-semibold">Recordatorio automático</h2>
        <p className="text-muted-foreground mt-1 mb-4 text-[13px]">
          Se manda solo antes de cada turno. Es lo que más baja las ausencias.
        </p>

        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium">Enviar recordatorios</p>
            <p className="text-muted-foreground text-2xs">
              {recordatorios.horasAntes} horas antes del turno
            </p>
          </div>
          <Switch
            checked={recordatorios.activo}
            onCheckedChange={(v) =>
              dispatch({
                tipo: 'ajustes/actualizar',
                cambios: { recordatorios: { ...recordatorios, activo: v } },
              })
            }
            aria-label="Activar recordatorios automáticos"
          />
        </div>

        <Label htmlFor="plantilla">Texto del mensaje</Label>
        <Textarea
          id="plantilla"
          value={plantilla}
          onChange={(e) => setPlantilla(e.target.value)}
          className="min-h-28"
        />
        <p className="text-muted-foreground mt-1.5 text-xs">
          Variables disponibles: {'{nombre}'}, {'{servicio}'}, {'{hora}'}, {'{profesional}'}
        </p>

        <Separator className="my-4" />

        <p className="text-muted-foreground mb-2 text-2xs font-semibold uppercase">Vista previa</p>
        <div className="bg-whatsapp-soft rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line">
          {ejemplo}
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => {
              dispatch({
                tipo: 'ajustes/actualizar',
                cambios: { recordatorios: { ...recordatorios, plantilla } },
              })
              toast.success('Recordatorio actualizado')
            }}
            disabled={plantilla === recordatorios.plantilla}
          >
            Guardar
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-[15px] font-semibold">Saludo del asistente</h2>
        <p className="text-muted-foreground mt-1 mb-4 text-[13px]">
          El primer mensaje que recibe alguien que escribe al salón.
        </p>

        <Label htmlFor="bienvenida">Mensaje de bienvenida</Label>
        <Textarea
          id="bienvenida"
          value={bienvenida}
          onChange={(e) => setBienvenida(e.target.value)}
          className="min-h-28"
        />

        <Separator className="my-4" />

        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium">Derivar consultas difíciles</p>
            <p className="text-muted-foreground text-2xs">
              Si el asistente no entiende, te avisa en vez de improvisar.
            </p>
          </div>
          <Switch
            checked={bot.derivarAHumano}
            onCheckedChange={(v) =>
              dispatch({
                tipo: 'ajustes/actualizar',
                cambios: { bot: { ...bot, derivarAHumano: v } },
              })
            }
            aria-label="Derivar consultas difíciles"
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => {
              dispatch({ tipo: 'ajustes/actualizar', cambios: { bot: { ...bot, bienvenida } } })
              toast.success('Saludo actualizado')
            }}
            disabled={bienvenida === bot.bienvenida}
          >
            Guardar
          </Button>
        </div>
      </Card>
    </div>
  )
}
