import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BellRing,
  CakeSlice,
  CalendarClock,
  CircleAlert,
  Clock,
  Coffee,
  Hourglass,
  MessageCircle,
  Percent,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Kpi, Tile, TileHeader } from '@/components/bento'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, EmptyState, Progress } from '@/components/ui/misc'
import { ChipEstado, ChipOrigen, PuntoServicio } from '@/components/turnos/piezas'
import { useTurnos } from '@/components/turnos/proveedor-turnos'
import { CATEGORIAS } from '@/data/catalogo'
import {
  buscarClienta,
  buscarProfesional,
  esActivo,
  franjasLibres,
  huecosLibres,
  metricasDelDia,
  nombreServicios,
  resumenClienta,
  serviciosDeTurno,
  trabajaEse,
  turnosDelDia,
} from '@/lib/agenda'
import {
  DIAS_CORTOS,
  addDays,
  d,
  duracionLegible,
  fechaLarga,
  fechaRelativa,
  haceCuanto,
  hhmm,
  isSameDay,
  startOfDay,
} from '@/lib/fecha'
import { moneda, numero, porcentaje, primerNombre } from '@/lib/formato'
import type { Turno } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { useSalon } from '@/store/salon'

export function PaginaHoy() {
  const { estado } = useSalon()
  const { nuevoTurno, verTurno } = useTurnos()

  // Reloj vivo: la tarjeta "ahora" se mantiene al día sin recargar.
  const [ahora, setAhora] = React.useState(() => new Date())
  React.useEffect(() => {
    const id = window.setInterval(() => setAhora(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const hoy = startOfDay(ahora)
  const m = React.useMemo(() => metricasDelDia(estado, hoy), [estado, hoy])
  const turnosHoy = React.useMemo(() => turnosDelDia(estado, hoy).filter(esActivo), [estado, hoy])

  const enCurso = turnosHoy.find((t) => t.estado === 'en_curso')
  const proximo = turnosHoy.find((t) => d(t.inicio) > ahora)
  const destacado = enCurso ?? proximo
  const restantes = turnosHoy.filter((t) => d(t.fin) > ahora).length

  return (
    <div className="space-y-4">
      <Encabezado ahora={ahora} restantes={restantes} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
        {/* ------------------------- Hero: qué pasa ahora ------------------------ */}
        <Tile orden={0} className="md:col-span-2 lg:col-span-5 lg:row-span-2">
          <TarjetaAhora
            turno={destacado}
            siguientes={turnosHoy.filter((t) => destacado && t.inicio > destacado.inicio).slice(0, 3)}
            enCurso={Boolean(enCurso)}
            ahora={ahora}
            onVer={verTurno}
          />
        </Tile>

        {/* --------------------------------- KPIs -------------------------------- */}
        <Tile orden={1} className="lg:col-span-4">
          <Kpi
            etiqueta="Turnos de hoy"
            valor={m.activos}
            icono={Users}
            tono="primary"
            detalle={
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{m.completados} atendidas</span>
                <span className="text-muted-foreground/50">·</span>
                <span>{restantes} por venir</span>
                {m.pendientes > 0 && (
                  <Badge variant="warning">{m.pendientes} sin confirmar</Badge>
                )}
              </span>
            }
          />
        </Tile>

        <Tile orden={2} className="lg:col-span-3">
          <Kpi
            etiqueta="Caja del día"
            valor={moneda(m.facturado)}
            icono={Wallet}
            tono="success"
            detalle={
              <span>
                Se esperan <strong className="text-foreground">{moneda(m.esperado)}</strong> si vienen
                todas.
              </span>
            }
          />
        </Tile>

        <Tile orden={3} className="lg:col-span-4">
          <OcupacionPorProfesional hoy={hoy} />
        </Tile>

        <Tile orden={4} className="lg:col-span-3">
          <Kpi
            etiqueta="Ocupación"
            valor={porcentaje(m.ocupacion)}
            icono={Percent}
            tono={m.ocupacion > 0.75 ? 'success' : m.ocupacion > 0.45 ? 'primary' : 'warning'}
            detalle={
              <>
                <Progress
                  value={m.ocupacion * 100}
                  className="mb-2"
                  indicatorClassName={
                    m.ocupacion > 0.75 ? 'bg-success' : m.ocupacion > 0.45 ? 'bg-primary' : 'bg-warning'
                  }
                />
                <span>
                  {duracionLegible(Math.round(m.minutosOcupados))} ocupados de{' '}
                  {duracionLegible(Math.round(m.minutosDisponibles))}
                </span>
              </>
            }
          />
        </Tile>

        {/* ------------------------- Agenda del día ------------------------------ */}
        <Tile orden={5} className="md:col-span-2 lg:col-span-7 lg:row-span-2">
          <AgendaDelDia turnos={turnosHoy} ahora={ahora} onVer={verTurno} />
        </Tile>

        {/* ------------------------------ WhatsApp ------------------------------- */}
        <Tile orden={6} className="lg:col-span-5">
          <UltimosMensajes />
        </Tile>

        {/* ---------------------------- Para resolver ---------------------------- */}
        <Tile orden={7} className="lg:col-span-5">
          <ParaResolver ahora={ahora} onVer={verTurno} />
        </Tile>

        {/* ---------------------------- Huecos libres ---------------------------- */}
        <Tile orden={8} className="lg:col-span-5">
          <HuecosLibres hoy={hoy} ahora={ahora} onAgendar={nuevoTurno} />
        </Tile>

        {/* ------------------------------- Semana -------------------------------- */}
        <Tile orden={9} className="md:col-span-2 lg:col-span-7">
          <SemanaEnCurso hoy={hoy} />
        </Tile>

        {/* -------------------------- Servicios top ------------------------------ */}
        <Tile orden={10} className="lg:col-span-5">
          <ServiciosDelMes hoy={hoy} />
        </Tile>

        {/* --------------------------- Lista de espera --------------------------- */}
        <Tile orden={11} className="lg:col-span-7">
          <ListaDeEspera onAgendar={nuevoTurno} />
        </Tile>

        <Tile orden={12} className="lg:col-span-5">
          <Cumpleanos hoy={hoy} />
        </Tile>
      </div>
    </div>
  )
}

/* ------------------------------- Encabezado ------------------------------- */

function Encabezado({ ahora, restantes }: { ahora: Date; restantes: number }) {
  const hora = ahora.getHours()
  const saludo = hora < 12 ? 'Buen día' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div>
      <h1 className="font-display text-2xl leading-tight font-bold sm:text-3xl">
        {saludo}, Valeria
      </h1>
      <p className="text-muted-foreground mt-1 text-[13px]">
        {fechaLarga(ahora)} ·{' '}
        {restantes > 0 ? (
          <>
            te quedan <strong className="text-foreground">{restantes}</strong>{' '}
            {restantes === 1 ? 'clienta' : 'clientas'} por atender
          </>
        ) : (
          'no quedan turnos por delante hoy'
        )}
      </p>
    </div>
  )
}

/* ------------------------------ Tarjeta "ahora" --------------------------- */

function TarjetaAhora({
  turno,
  siguientes,
  enCurso,
  ahora,
  onVer,
}: {
  turno?: Turno
  siguientes: Turno[]
  enCurso: boolean
  ahora: Date
  onVer: (id: string) => void
}) {
  const { estado } = useSalon()

  if (!turno) {
    return (
      <EmptyState
        icon={Coffee}
        title="No hay más turnos por hoy"
        description="La agenda del día está cerrada. Buen momento para ordenar el salón o cargar los turnos de mañana."
        className="flex-1"
      />
    )
  }

  const clienta = buscarClienta(estado, turno.clientaId)
  const prof = buscarProfesional(estado, turno.profesionalId)
  const servicios = serviciosDeTurno(estado, turno)
  const resumen = clienta ? resumenClienta(estado, clienta.id, ahora) : null
  const minutosFaltan = Math.round((d(turno.inicio).getTime() - ahora.getTime()) / 60000)

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex items-center gap-2 px-5 pt-5 pb-3',
          enCurso ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        <span
          className={cn(
            'size-2 rounded-full',
            enCurso ? 'bg-primary animate-pulse-dot' : 'bg-muted-foreground/50',
          )}
        />
        <p className="text-2xs font-semibold tracking-wide uppercase">
          {enCurso
            ? 'En el sillón ahora'
            : minutosFaltan <= 60
              ? `Próxima clienta · en ${minutosFaltan} min`
              : 'Próxima clienta'}
        </p>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5">
        <div className="flex items-start gap-3.5">
          <Avatar name={clienta?.nombre ?? '?'} size="xl" />
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-xl leading-tight font-bold sm:text-2xl">
              {clienta?.nombre}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="tabular text-primary text-base font-bold">
                {hhmm(turno.inicio)} – {hhmm(turno.fin)}
              </span>
              <ChipOrigen origen={turno.origen} />
            </div>
          </div>
        </div>

        <ul className="mt-4 space-y-1.5">
          {servicios.map((s) => (
            <li key={s.id} className="flex items-center gap-2.5 text-sm">
              <PuntoServicio servicio={s} />
              <span className="flex-1 font-medium">{s.nombre}</span>
              <span className="text-muted-foreground text-2xs">
                {duracionLegible(s.duracionMin)}
              </span>
            </li>
          ))}
        </ul>

        {clienta && clienta.alertas.length > 0 && (
          <div className="bg-warning-soft text-warning mt-4 flex items-start gap-2 rounded-lg px-3 py-2 text-xs">
            <CircleAlert className="mt-px size-3.5 shrink-0" />
            <span>{clienta.alertas.join(' · ')}</span>
          </div>
        )}

        {turno.notas && !clienta?.alertas.includes(turno.notas) && (
          <p className="bg-surface-2 text-muted-foreground mt-3 rounded-lg px-3 py-2 text-xs leading-relaxed">
            “{turno.notas}”
          </p>
        )}

        {clienta && resumen && (
          <div className="border-border text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3.5 text-xs">
            <span>
              <strong className="text-foreground tabular">{resumen.visitas}</strong> visitas
            </span>
            {resumen.ultimaVisita && (
              <span>
                última visita{' '}
                <strong className="text-foreground">
                  {fechaRelativa(resumen.ultimaVisita.inicio).toLowerCase()}
                </strong>
              </span>
            )}
            {resumen.servicioHabitual && <span>habitual: {resumen.servicioHabitual}</span>}
            {clienta.etiquetas.includes('Nueva') && <Badge variant="primary">Primera vez</Badge>}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-4">
          <Button onClick={() => onVer(turno.id)}>
            {enCurso ? 'Cobrar y cerrar' : 'Abrir turno'}
            <ArrowRight />
          </Button>
          {prof && (
            <span className="text-muted-foreground ml-auto flex items-center gap-2 text-xs">
              <Avatar name={prof.nombre} color={prof.color} size="sm" />
              {primerNombre(prof.nombre)}
            </span>
          )}
        </div>

        {/* Lo que viene después, para anticiparse sin abrir la agenda */}
        {siguientes.length > 0 && (
          <div className="border-border mt-auto border-t pt-3.5">
            <p className="text-muted-foreground mb-2 text-2xs font-semibold tracking-wide uppercase">
              Después
            </p>
            <ul className="space-y-1">
              {siguientes.map((s) => {
                const c = buscarClienta(estado, s.clientaId)
                const p = buscarProfesional(estado, s.profesionalId)
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onVer(s.id)}
                      className="hover:bg-muted -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors"
                    >
                      <span className="tabular text-muted-foreground w-11 shrink-0 text-2xs font-semibold">
                        {hhmm(s.inicio)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                        {c?.nombre}
                      </span>
                      <span className="text-muted-foreground shrink-0 truncate text-2xs">
                        {nombreServicios(estado, s)}
                      </span>
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: p?.color }}
                        aria-hidden
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------- Ocupación por profesional ---------------------- */

function OcupacionPorProfesional({ hoy }: { hoy: Date }) {
  const { estado } = useSalon()

  const filas = estado.profesionales
    .filter((p) => p.activo && trabajaEse(p, hoy))
    .map((p) => {
      const turnos = turnosDelDia(estado, hoy, p.id).filter(esActivo)
      const ocupados = turnos.reduce(
        (s, t) => s + (d(t.fin).getTime() - d(t.inicio).getTime()) / 60000,
        0,
      )
      const jornada = p.horario[hoy.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6].reduce((s, tr) => {
        const [hi, mi] = tr.inicio.split(':').map(Number)
        const [hf, mf] = tr.fin.split(':').map(Number)
        return s + (hf * 60 + mf - (hi * 60 + mi))
      }, 0)
      return { prof: p, turnos: turnos.length, pct: jornada ? ocupados / jornada : 0 }
    })

  return (
    <>
      <TileHeader titulo="El equipo hoy" icono={Users} />
      <div className="space-y-3 px-5 pb-5">
        {filas.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-[13px]">
            Hoy no trabaja nadie del equipo.
          </p>
        )}
        {filas.map(({ prof, turnos, pct }) => (
          <div key={prof.id}>
            <div className="mb-1.5 flex items-center gap-2">
              <Avatar name={prof.nombre} color={prof.color} size="sm" />
              <span className="flex-1 truncate text-[13px] font-medium">
                {primerNombre(prof.nombre)}
              </span>
              <span className="text-muted-foreground tabular text-2xs">
                {turnos} {turnos === 1 ? 'turno' : 'turnos'}
              </span>
              <span className="tabular w-9 text-right text-[13px] font-semibold">
                {porcentaje(pct)}
              </span>
            </div>
            <div className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${Math.min(100, pct * 100)}%`, backgroundColor: prof.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ---------------------------- Agenda del día ------------------------------ */

function AgendaDelDia({
  turnos,
  ahora,
  onVer,
}: {
  turnos: Turno[]
  ahora: Date
  onVer: (id: string) => void
}) {
  const { estado } = useSalon()

  return (
    <>
      <TileHeader
        titulo="Agenda de hoy"
        descripcion={`${turnos.length} ${turnos.length === 1 ? 'turno' : 'turnos'} · de ${turnos[0] ? hhmm(turnos[0].inicio) : '—'} a ${turnos.at(-1) ? hhmm(turnos.at(-1)!.fin) : '—'}`}
        icono={CalendarClock}
        accion={{ label: 'Ver agenda', to: '/agenda' }}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {turnos.length === 0 ? (
          <EmptyState
            icon={Coffee}
            title="Día libre"
            description="Todavía no hay turnos cargados para hoy."
          />
        ) : (
          <ol className="space-y-0.5">
            {turnos.map((t, i) => {
              const clienta = buscarClienta(estado, t.clientaId)
              const prof = buscarProfesional(estado, t.profesionalId)
              const pasado = d(t.fin) < ahora
              const anterior = turnos[i - 1]
              const marcaAhora =
                anterior && d(anterior.fin) <= ahora && d(t.inicio) > ahora && isSameDay(ahora, d(t.inicio))

              return (
                <React.Fragment key={t.id}>
                  {marcaAhora && (
                    <li className="flex items-center gap-2 px-3 py-1.5" aria-hidden>
                      <span className="bg-primary size-1.5 shrink-0 rounded-full" />
                      <span className="text-primary tabular text-2xs font-bold">{hhmm(ahora)}</span>
                      <span className="bg-primary/25 h-px flex-1" />
                    </li>
                  )}
                  <li>
                    <button
                      type="button"
                      onClick={() => onVer(t.id)}
                      className={cn(
                        'hover:bg-muted flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200',
                        pasado && 'opacity-55',
                      )}
                    >
                      <span
                        className="h-9 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: prof?.color }}
                        aria-hidden
                      />
                      <span className="tabular w-11 shrink-0 text-[13px] font-semibold">
                        {hhmm(t.inicio)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{clienta?.nombre}</span>
                        <span className="text-muted-foreground block truncate text-2xs">
                          {nombreServicios(estado, t)} · {prof ? primerNombre(prof.nombre) : ''}
                        </span>
                      </span>
                      <ChipEstado estado={t.estado} className="hidden sm:inline-flex" />
                      <span className="tabular hidden w-16 text-right text-[13px] font-semibold sm:block">
                        {moneda(t.precioTotal)}
                      </span>
                    </button>
                  </li>
                </React.Fragment>
              )
            })}
          </ol>
        )}
      </div>
    </>
  )
}

/* ------------------------------- WhatsApp --------------------------------- */

function UltimosMensajes() {
  const { estado } = useSalon()
  const conversaciones = estado.conversaciones.slice(0, 4)
  const sinLeer = estado.conversaciones.reduce((s, c) => s + c.sinLeer, 0)
  const reservasHoy = turnosDelDia(estado, new Date()).filter(
    (t) => t.origen === 'whatsapp' && esActivo(t),
  ).length

  return (
    <>
      <TileHeader
        titulo="WhatsApp"
        descripcion={`${reservasHoy} de los turnos de hoy los tomó el asistente solo`}
        icono={MessageCircle}
        accion={{ label: 'Abrir', to: '/whatsapp' }}
      />
      <div className="flex-1 space-y-0.5 px-2 pb-3">
        {conversaciones.map((c) => {
          const ultimo = c.mensajes.at(-1)
          return (
            <Link
              key={c.id}
              to="/whatsapp"
              className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200"
            >
              <Avatar name={c.nombreContacto} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-medium">{c.nombreContacto}</span>
                  {c.estado === 'humano' && <Badge variant="warning">Te necesita</Badge>}
                </span>
                <span className="text-muted-foreground block truncate text-2xs">
                  {ultimo?.autor === 'clienta' ? '' : '✓ '}
                  {ultimo?.texto.replace(/\n/g, ' ')}
                </span>
              </span>
              <span className="text-muted-foreground shrink-0 text-2xs">
                {haceCuanto(c.ultimaActividad)}
              </span>
              {c.sinLeer > 0 && (
                <span className="bg-whatsapp grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white">
                  {c.sinLeer}
                </span>
              )}
            </Link>
          )
        })}
      </div>
      {sinLeer > 0 && (
        <div className="bg-whatsapp-soft text-whatsapp mx-5 mb-5 rounded-lg px-3 py-2 text-xs">
          Hay {sinLeer} {sinLeer === 1 ? 'mensaje' : 'mensajes'} que el asistente derivó para que los
          contestes vos.
        </div>
      )}
    </>
  )
}

/* ------------------------------ Para resolver ----------------------------- */

function ParaResolver({ ahora, onVer }: { ahora: Date; onVer: (id: string) => void }) {
  const { estado } = useSalon()

  const manana = addDays(startOfDay(ahora), 1)
  const sinConfirmar = estado.turnos
    .filter(
      (t) =>
        t.estado === 'pendiente' &&
        d(t.inicio) > ahora &&
        d(t.inicio) < addDays(ahora, 2),
    )
    .sort((a, b) => a.inicio.localeCompare(b.inicio))

  const seniasPendientes = estado.turnos.filter(
    (t) => t.senia > 0 && esActivo(t) && d(t.inicio) > ahora && !t.pago,
  )

  const aRecuperar = estado.clientas
    .map((c) => ({ c, r: resumenClienta(estado, c.id, ahora) }))
    .filter(({ r }) => r.visitas >= 3 && (r.diasDesdeUltima ?? 0) > 75 && !r.proximoTurno)
    .sort((a, b) => (b.r.diasDesdeUltima ?? 0) - (a.r.diasDesdeUltima ?? 0))
    .slice(0, 3)

  const hayAlgo = sinConfirmar.length > 0 || seniasPendientes.length > 0 || aRecuperar.length > 0

  return (
    <>
      <TileHeader
        titulo="Para resolver"
        descripcion="Lo que conviene mirar antes de que se convierta en un problema"
        icono={BellRing}
      />
      <div className="flex-1 px-5 pb-5">
        {!hayAlgo ? (
          <EmptyState
            icon={Sparkles}
            title="Todo en orden"
            description="No hay confirmaciones pendientes ni señas sin cobrar."
            className="py-8"
          />
        ) : (
          <ul className="space-y-2.5">
            {sinConfirmar.slice(0, 3).map((t) => {
              const clienta = buscarClienta(estado, t.clientaId)
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onVer(t.id)}
                    className="hover:bg-muted -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors"
                  >
                    <span className="bg-warning-soft text-warning grid size-8 shrink-0 place-items-center rounded-lg">
                      <Clock className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">
                        {clienta?.nombre} sin confirmar
                      </span>
                      <span className="text-muted-foreground block text-2xs">
                        {isSameDay(d(t.inicio), manana) ? 'Mañana' : 'Hoy'} {hhmm(t.inicio)} ·{' '}
                        {nombreServicios(estado, t)}
                      </span>
                    </span>
                    <ArrowRight className="text-muted-foreground size-4 shrink-0" />
                  </button>
                </li>
              )
            })}

            {seniasPendientes.slice(0, 2).map((t) => {
              const clienta = buscarClienta(estado, t.clientaId)
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onVer(t.id)}
                    className="hover:bg-muted -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors"
                  >
                    <span className="bg-info-soft text-info grid size-8 shrink-0 place-items-center rounded-lg">
                      <Wallet className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">
                        Seña de {moneda(t.senia)} · {clienta?.nombre}
                      </span>
                      <span className="text-muted-foreground block text-2xs">
                        Turno del {hhmm(t.inicio)} · {nombreServicios(estado, t)}
                      </span>
                    </span>
                    <ArrowRight className="text-muted-foreground size-4 shrink-0" />
                  </button>
                </li>
              )
            })}

            {aRecuperar.map(({ c, r }) => (
              <li key={c.id}>
                <Link
                  to={`/clientas/${c.id}`}
                  className="hover:bg-muted -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <span className="bg-primary-soft text-primary grid size-8 shrink-0 place-items-center rounded-lg">
                    <UserPlus className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">
                      {c.nombre} hace {r.diasDesdeUltima} días que no viene
                    </span>
                    <span className="text-muted-foreground block text-2xs">
                      {r.visitas} visitas · {moneda(r.gastoTotal)} históricos
                    </span>
                  </span>
                  <ArrowRight className="text-muted-foreground size-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

/* ------------------------------ Huecos libres ----------------------------- */

function HuecosLibres({
  hoy,
  ahora,
  onAgendar,
}: {
  hoy: Date
  ahora: Date
  onAgendar: (p: { profesionalId: string; inicio: Date }) => void
}) {
  const { estado } = useSalon()

  const porProfesional = estado.profesionales
    .filter((p) => p.activo && trabajaEse(p, hoy))
    .map((p) => {
      const franjas = franjasLibres(estado, p.id, hoy, 45).filter((f) => f.fin > ahora)
      return {
        prof: p,
        minutos: franjas.reduce((s, f) => s + (f.fin.getTime() - f.inicio.getTime()) / 60000, 0),
        huecos: huecosLibres(estado, p.id, hoy, 45, { desde: ahora })
          .filter((_, i) => i % 3 === 0)
          .slice(0, 6),
      }
    })
    .filter((x) => x.huecos.length > 0)

  return (
    <>
      <TileHeader
        titulo="Huecos libres hoy"
        descripcion="Espacios de 45 min o más que todavía podés vender"
        icono={Hourglass}
      />
      <div className="flex-1 space-y-3 px-5 pb-5">
        {porProfesional.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Día completo"
            description="No quedan huecos libres. Buen trabajo."
            className="py-8"
          />
        ) : (
          porProfesional.map(({ prof, huecos, minutos }) => (
            <div key={prof.id}>
              <p className="text-muted-foreground mb-1.5 flex items-center gap-2 text-2xs font-semibold">
                <span className="size-2 rounded-full" style={{ backgroundColor: prof.color }} />
                {primerNombre(prof.nombre)}
                <span className="ml-auto font-normal">
                  {duracionLegible(Math.round(minutos))} sin vender
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {huecos.map((h) => (
                  <button
                    key={h.inicio.toISOString()}
                    type="button"
                    onClick={() => onAgendar({ profesionalId: prof.id, inicio: h.inicio })}
                    className="border-border hover:border-primary/50 hover:bg-primary-soft tabular cursor-pointer rounded-lg border px-2.5 py-1.5 text-2xs font-semibold transition-colors duration-200"
                  >
                    {hhmm(h.inicio)}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}

/* -------------------------------- Semana ---------------------------------- */

function SemanaEnCurso({ hoy }: { hoy: Date }) {
  const { estado } = useSalon()

  const datos = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const dia = addDays(hoy, i - 3)
        const turnos = turnosDelDia(estado, dia).filter(esActivo)
        return {
          dia: DIAS_CORTOS[dia.getDay()],
          fecha: dia.getDate(),
          turnos: turnos.length,
          ingresos: turnos.reduce((s, t) => s + t.precioTotal, 0),
          esHoy: isSameDay(dia, hoy),
        }
      }),
    [estado, hoy],
  )

  return (
    <>
      <TileHeader
        titulo="Cómo viene la semana"
        descripcion="Turnos e ingresos previstos por día"
        icono={TrendingUp}
        accion={{ label: 'Ver caja', to: '/caja' }}
      />
      <div className="flex-1 px-3 pb-4">
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={datos} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.32} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="dia"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted-fg)', fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted-fg)', fontSize: 11 }}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
            />
            <RTooltip
              cursor={{ stroke: 'var(--border)' }}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                fontSize: 12,
                boxShadow: 'var(--shadow-lift)',
                color: 'var(--fg)',
              }}
              labelStyle={{ color: 'var(--fg)', fontWeight: 600 }}
              formatter={(valor, nombre) =>
                nombre === 'ingresos'
                  ? [moneda(Number(valor)), 'Ingresos']
                  : [numero(Number(valor)), 'Turnos']
              }
            />
            <Area
              type="monotone"
              dataKey="ingresos"
              stroke="var(--primary)"
              strokeWidth={2.5}
              fill="url(#gradIngresos)"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-2 grid grid-cols-7 gap-1 px-2">
          {datos.map((dd) => (
            <div
              key={`${dd.dia}-${dd.fecha}`}
              className={cn(
                'rounded-lg py-1.5 text-center',
                dd.esHoy && 'bg-primary-soft text-primary',
              )}
            >
              <p className="tabular text-[13px] font-bold">{dd.turnos}</p>
              <p className="text-muted-foreground text-2xs">turnos</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/* ----------------------------- Servicios top ------------------------------ */

function ServiciosDelMes({ hoy }: { hoy: Date }) {
  const { estado } = useSalon()

  const datos = React.useMemo(() => {
    const desde = addDays(hoy, -30)
    const conteo = new Map<string, { nombre: string; cantidad: number; color: string }>()
    for (const t of estado.turnos) {
      if (t.estado !== 'completado' || d(t.inicio) < desde) continue
      for (const s of serviciosDeTurno(estado, t)) {
        const actual = conteo.get(s.id) ?? {
          nombre: s.nombre,
          cantidad: 0,
          color: CATEGORIAS[s.categoria].color,
        }
        actual.cantidad += 1
        conteo.set(s.id, actual)
      }
    }
    return [...conteo.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 6)
  }, [estado, hoy])

  return (
    <>
      <TileHeader
        titulo="Lo más pedido"
        descripcion="Servicios realizados en los últimos 30 días"
        icono={Sparkles}
        accion={{ label: 'Servicios', to: '/servicios' }}
      />
      <div className="flex-1 px-3 pb-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={datos} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="nombre"
              width={132}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted-fg)', fontSize: 11 }}
            />
            <RTooltip
              cursor={{ fill: 'var(--muted)' }}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                fontSize: 12,
                boxShadow: 'var(--shadow-lift)',
                color: 'var(--fg)',
              }}
              formatter={(v) => [`${Number(v)} servicios`, '']}
            />
            <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} barSize={16}>
              {datos.map((entrada) => (
                <Cell key={entrada.nombre} fill={entrada.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}

/* ---------------------------- Lista de espera ----------------------------- */

function ListaDeEspera({
  onAgendar,
}: {
  onAgendar: (p: { clientaId: string; servicioId: string; profesionalId?: string }) => void
}) {
  const { estado } = useSalon()

  return (
    <>
      <TileHeader
        titulo="Lista de espera"
        descripcion="Clientas esperando que se libere un lugar"
        icono={Hourglass}
      />
      <div className="flex-1 px-5 pb-5">
        {estado.espera.length === 0 ? (
          <EmptyState icon={Sparkles} title="Nadie esperando" className="py-8" />
        ) : (
          <ul className="space-y-2.5">
            {estado.espera.map((e) => {
              const clienta = buscarClienta(estado, e.clientaId)
              const servicio = estado.servicios.find((s) => s.id === e.servicioId)
              return (
                <li key={e.id} className="flex items-center gap-3">
                  <Avatar name={clienta?.nombre ?? '?'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{clienta?.nombre}</p>
                    <p className="text-muted-foreground truncate text-2xs">
                      {servicio?.nombre} · {e.preferencia}
                    </p>
                  </div>
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() =>
                      onAgendar({
                        clientaId: e.clientaId,
                        servicioId: e.servicioId,
                        profesionalId: e.profesionalId,
                      })
                    }
                  >
                    Agendar
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}

/* ------------------------------ Cumpleaños -------------------------------- */

function Cumpleanos({ hoy }: { hoy: Date }) {
  const { estado } = useSalon()

  const proximos = React.useMemo(() => {
    const hoyMD = `${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
    return estado.clientas
      .filter((c) => c.cumple)
      .map((c) => {
        const [mes, dia] = c.cumple!.split('-').map(Number)
        let fecha = new Date(hoy.getFullYear(), mes - 1, dia)
        if (c.cumple! < hoyMD) fecha = new Date(hoy.getFullYear() + 1, mes - 1, dia)
        return { c, fecha, dias: Math.round((fecha.getTime() - hoy.getTime()) / 86400000) }
      })
      .filter((x) => x.dias <= 30)
      .sort((a, b) => a.dias - b.dias)
      .slice(0, 4)
  }, [estado.clientas, hoy])

  return (
    <>
      <TileHeader
        titulo="Cumpleaños del mes"
        descripcion="Una excusa perfecta para escribirles"
        icono={CakeSlice}
      />
      <div className="flex-1 px-5 pb-5">
        {proximos.length === 0 ? (
          <EmptyState icon={CakeSlice} title="Sin cumpleaños próximos" className="py-8" />
        ) : (
          <ul className="space-y-2.5">
            {proximos.map(({ c, dias }) => (
              <li key={c.id}>
                <Link
                  to={`/clientas/${c.id}`}
                  className="hover:bg-muted -mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <Avatar name={c.nombre} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{c.nombre}</span>
                  <Badge variant={dias === 0 ? 'primary' : 'neutral'}>
                    {dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : `En ${dias} días`}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
