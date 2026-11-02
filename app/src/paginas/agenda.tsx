import * as React from 'react'
import { ChevronLeft, ChevronRight, Lock, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Avatar,
  Tabs,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/misc'
import { ChipOrigen } from '@/components/turnos/piezas'
import { useTurnos } from '@/components/turnos/proveedor-turnos'
import { CATEGORIAS } from '@/data/catalogo'
import {
  ESTADO_TURNO,
  bloqueosDelDia,
  buscarClienta,
  esActivo,
  franjasLibres,
  jornadaDe,
  metricasDelDia,
  nombreServicios,
  serviciosDeTurno,
  trabajaEse,
  turnosDelDia,
} from '@/lib/agenda'
import {
  DIAS_CORTOS,
  aHora,
  aMinutos,
  addDays,
  d,
  diasDeSemana,
  duracionLegible,
  fechaLarga,
  hhmm,
  isToday,
  minutosDelDia,
  startOfDay,
} from '@/lib/fecha'
import { moneda, porcentaje, primerNombre } from '@/lib/formato'
import type { Profesional, Turno } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { useSalon } from '@/store/salon'

const PX_POR_MINUTO = 1.35

export function PaginaAgenda() {
  const { estado } = useSalon()
  const [vista, setVista] = React.useState<'dia' | 'semana'>('dia')
  const [dia, setDia] = React.useState(() => startOfDay(new Date()))
  const [filtroProf, setFiltroProf] = React.useState<string>('todas')

  const apertura = aMinutos(estado.ajustes.agenda.horaApertura)
  const cierre = aMinutos(estado.ajustes.agenda.horaCierre)
  const alto = (cierre - apertura) * PX_POR_MINUTO

  const profesionales = estado.profesionales.filter(
    (p) => p.activo && (filtroProf === 'todas' || p.id === filtroProf),
  )

  const metricas = metricasDelDia(estado, dia)
  const semana = diasDeSemana(dia)

  return (
    <div className="space-y-4">
      {/* ------------------------------ Controles ----------------------------- */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="icon"
            aria-label={vista === 'dia' ? 'Día anterior' : 'Semana anterior'}
            onClick={() => setDia((f) => addDays(f, vista === 'dia' ? -1 : -7))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label={vista === 'dia' ? 'Día siguiente' : 'Semana siguiente'}
            onClick={() => setDia((f) => addDays(f, vista === 'dia' ? 1 : 7))}
          >
            <ChevronRight />
          </Button>
          <Button variant="ghost" onClick={() => setDia(startOfDay(new Date()))} className="ml-1">
            Hoy
          </Button>
        </div>

        <div className="min-w-0">
          <h1 className="font-display truncate text-lg leading-tight font-bold sm:text-xl">
            {vista === 'dia'
              ? fechaLarga(dia)
              : `Semana del ${semana[0].getDate()} al ${semana[5].getDate()}`}
          </h1>
          {vista === 'dia' && (
            <p className="text-muted-foreground text-2xs">
              {metricas.activos} turnos · {porcentaje(metricas.ocupacion)} de ocupación ·{' '}
              {moneda(metricas.esperado)} previstos
            </p>
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select value={filtroProf} onValueChange={setFiltroProf}>
            <SelectTrigger className="h-10 w-44" aria-label="Filtrar por profesional">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todo el equipo</SelectItem>
              {estado.profesionales
                .filter((p) => p.activo)
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.nombre}
                    </span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Tabs value={vista} onValueChange={(v) => setVista(v as 'dia' | 'semana')}>
            <TabsList>
              <TabsTrigger value="dia">Día</TabsTrigger>
              <TabsTrigger value="semana">Semana</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* ------------------------------- Leyenda ------------------------------ */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {Object.entries(CATEGORIAS).map(([id, c]) => (
          <span key={id} className="text-muted-foreground flex items-center gap-1.5 text-2xs">
            <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
            {c.nombre}
          </span>
        ))}
        {(vista === 'dia' || filtroProf !== 'todas') && (
          <span className="text-muted-foreground ml-auto hidden items-center gap-1.5 text-2xs sm:flex">
            <span className="border-border bg-muted size-2.5 rounded-sm border border-dashed" />
            Hueco libre · tocalo para agendar
          </span>
        )}
      </div>

      {vista === 'dia' ? (
        <VistaDia
          dia={dia}
          profesionales={profesionales}
          apertura={apertura}
          cierre={cierre}
          alto={alto}
        />
      ) : (
        <VistaSemana
          dias={semana}
          apertura={apertura}
          cierre={cierre}
          alto={alto}
          filtro={filtroProf}
        />
      )}
    </div>
  )
}

/* --------------------------------- Vista día ------------------------------ */

function VistaDia({
  dia,
  profesionales,
  apertura,
  cierre,
  alto,
}: {
  dia: Date
  profesionales: Profesional[]
  apertura: number
  cierre: number
  alto: number
}) {
  const { estado } = useSalon()
  const { nuevoTurno } = useTurnos()
  const trabajan = profesionales.filter((p) => trabajaEse(p, dia))

  if (trabajan.length === 0) {
    return (
      <Card className="px-6 py-16 text-center">
        <p className="font-display text-base font-semibold">Nadie trabaja este día</p>
        <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-[13px]">
          El salón está cerrado o la profesional filtrada no atiende. Los horarios se cambian desde
          Equipo.
        </p>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <div className="flex min-w-max">
          <ReglaHoras apertura={apertura} cierre={cierre} />

          {trabajan.map((prof) => (
            <ColumnaAgenda
              key={prof.id}
              dia={dia}
              soloProfesionalId={prof.id}
              apertura={apertura}
              alto={alto}
              onNuevo={(inicio) => nuevoTurno({ profesionalId: prof.id, inicio })}
              ancho="w-56 shrink-0 lg:w-auto lg:min-w-56 lg:flex-1"
              cabecera={
                <div className="flex items-center gap-2.5 px-3 py-3">
                  <Avatar name={prof.nombre} color={prof.color} size="sm" />
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-[13px] font-semibold">{prof.nombre}</p>
                    <p className="text-muted-foreground truncate text-2xs">
                      {jornadaDe(prof, dia)
                        .map((t) => `${t.inicio}–${t.fin}`)
                        .join(' · ')}
                    </p>
                  </div>
                  <Badge variant="neutral" className="ml-auto">
                    {turnosDelDia(estado, dia, prof.id).filter(esActivo).length}
                  </Badge>
                </div>
              }
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

/* ------------------------------- Vista semana ----------------------------- */

function VistaSemana({
  dias,
  apertura,
  cierre,
  alto,
  filtro,
}: {
  dias: Date[]
  apertura: number
  cierre: number
  alto: number
  filtro: string
}) {
  const { nuevoTurno } = useTurnos()
  const soloProfesionalId = filtro === 'todas' ? undefined : filtro

  // Con todo el equipo, cuatro agendas superpuestas en una columna de día no se
  // leen. Para esa vista conviene el resumen por día; la grilla horaria queda
  // para cuando se mira a una sola profesional.
  if (!soloProfesionalId) return <ResumenSemana dias={dias} />

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <div className="flex min-w-max">
          <ReglaHoras apertura={apertura} cierre={cierre} />

          {dias.map((f) => (
            <ColumnaAgenda
              key={f.toISOString()}
              dia={f}
              soloProfesionalId={soloProfesionalId}
              apertura={apertura}
              alto={alto}
              onNuevo={(inicio) => nuevoTurno({ profesionalId: soloProfesionalId, inicio })}
              ancho="w-40 shrink-0 lg:w-auto lg:min-w-36 lg:flex-1"
              cabecera={
                <div className={cn('px-3 py-3 text-center', isToday(f) && 'bg-primary-soft')}>
                  <p
                    className={cn(
                      'text-2xs font-semibold tracking-wide uppercase',
                      isToday(f) ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {DIAS_CORTOS[f.getDay()]}
                  </p>
                  <p
                    className={cn(
                      'font-display tabular text-lg leading-tight font-bold',
                      isToday(f) && 'text-primary',
                    )}
                  >
                    {f.getDate()}
                  </p>
                </div>
              }
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

/* --------------------------- Resumen de la semana ------------------------- */

function ResumenSemana({ dias }: { dias: Date[] }) {
  const { estado } = useSalon()
  const { nuevoTurno, verTurno } = useTurnos()

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {dias.map((dia) => {
        const turnos = turnosDelDia(estado, dia).filter(esActivo)
        const m = metricasDelDia(estado, dia)
        const abierto = estado.profesionales.some((p) => p.activo && trabajaEse(p, dia))

        return (
          <Card key={dia.toISOString()} className="flex flex-col">
            <div
              className={cn(
                'border-border border-b px-4 py-3',
                isToday(dia) && 'bg-primary-soft',
              )}
            >
              <div className="flex items-baseline gap-2">
                <p
                  className={cn(
                    'text-2xs font-semibold tracking-wide uppercase',
                    isToday(dia) ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {DIAS_CORTOS[dia.getDay()]}
                </p>
                <p
                  className={cn(
                    'font-display tabular text-xl leading-none font-bold',
                    isToday(dia) && 'text-primary',
                  )}
                >
                  {dia.getDate()}
                </p>
                <span className="text-muted-foreground ml-auto tabular text-2xs">
                  {turnos.length} {turnos.length === 1 ? 'turno' : 'turnos'}
                </span>
              </div>

              {abierto && (
                <>
                  <div className="bg-muted mt-2.5 h-1.5 overflow-hidden rounded-full">
                    <div
                      className={cn(
                        'h-full rounded-full transition-[width] duration-500',
                        m.ocupacion > 0.75
                          ? 'bg-success'
                          : m.ocupacion > 0.45
                            ? 'bg-primary'
                            : 'bg-warning',
                      )}
                      style={{ width: `${Math.min(100, m.ocupacion * 100)}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground mt-1.5 flex justify-between text-2xs">
                    <span>{porcentaje(m.ocupacion)} ocupado</span>
                    <span className="tabular font-medium">{moneda(m.esperado)}</span>
                  </p>
                </>
              )}
            </div>

            <div className="min-h-32 flex-1 space-y-0.5 overflow-y-auto p-1.5 lg:max-h-96">
              {!abierto ? (
                <p className="text-muted-foreground px-2 py-6 text-center text-2xs">Cerrado</p>
              ) : turnos.length === 0 ? (
                <p className="text-muted-foreground px-2 py-6 text-center text-2xs">
                  Sin turnos todavía
                </p>
              ) : (
                turnos.map((t) => {
                  const clienta = buscarClienta(estado, t.clientaId)
                  const prof = estado.profesionales.find((p) => p.id === t.profesionalId)
                  const servicios = serviciosDeTurno(estado, t)
                  const color = servicios[0]
                    ? CATEGORIAS[servicios[0].categoria].color
                    : 'var(--primary)'
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => verTurno(t.id)}
                      className="hover:bg-muted flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors duration-200"
                    >
                      <span
                        className="h-7 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-1.5">
                          <span className="tabular text-2xs font-bold">{hhmm(t.inicio)}</span>
                          <span className="truncate text-2xs font-medium">{clienta?.nombre}</span>
                        </span>
                        <span className="text-muted-foreground block truncate text-2xs">
                          {servicios.map((s) => s.nombre).join(' + ')}
                        </span>
                      </span>
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: prof?.color }}
                        title={prof?.nombre}
                        aria-hidden
                      />
                    </button>
                  )
                })
              )}
            </div>

            {abierto && (
              <button
                type="button"
                onClick={() => nuevoTurno({ inicio: dia })}
                className="border-border text-muted-foreground hover:bg-muted hover:text-foreground flex cursor-pointer items-center justify-center gap-1.5 border-t py-2.5 text-2xs font-medium transition-colors duration-200"
              >
                <Plus className="size-3.5" />
                Agendar este día
              </button>
            )}
          </Card>
        )
      })}
    </div>
  )
}

/* -------------------------------- Regla horaria --------------------------- */

function ReglaHoras({ apertura, cierre }: { apertura: number; cierre: number }) {
  const horas: number[] = []
  for (let m = apertura; m <= cierre; m += 60) horas.push(m)

  return (
    <div className="border-border bg-surface sticky left-0 z-10 w-14 shrink-0 border-r">
      <div className="border-border h-[62px] border-b" />
      <div className="relative">
        {horas.map((m) => (
          <div
            key={m}
            className="text-muted-foreground tabular absolute right-2 -translate-y-1/2 text-2xs font-medium"
            style={{ top: (m - apertura) * PX_POR_MINUTO }}
          >
            {aHora(m)}
          </div>
        ))}
        <div style={{ height: (cierre - apertura) * PX_POR_MINUTO }} />
      </div>
    </div>
  )
}

/* ----------------------------- Columna de agenda -------------------------- */

/**
 * Una columna vertical de la grilla. Sirve tanto para "una profesional en un
 * día" (vista día) como para "un día con todo el equipo" (vista semana). En el
 * segundo caso los turnos se reparten en sub-columnas para que no se pisen.
 */
function ColumnaAgenda({
  dia,
  soloProfesionalId,
  apertura,
  alto,
  cabecera,
  ancho,
  onNuevo,
}: {
  dia: Date
  soloProfesionalId?: string
  apertura: number
  alto: number
  cabecera: React.ReactNode
  ancho: string
  onNuevo: (inicio: Date) => void
}) {
  const { estado } = useSalon()
  const { verTurno } = useTurnos()

  const prof = soloProfesionalId
    ? estado.profesionales.find((p) => p.id === soloProfesionalId)
    : undefined

  const turnos = turnosDelDia(estado, dia, soloProfesionalId).filter(esActivo)
  const bloqueos = bloqueosDelDia(estado, dia, soloProfesionalId)
  const libres = prof && trabajaEse(prof, dia) ? franjasLibres(estado, prof.id, dia, 30) : []
  const fueraDeJornada = prof ? !trabajaEse(prof, dia) : false

  // Sin filtro de profesional, cada una ocupa su propia franja horizontal.
  const conTurnos = React.useMemo(() => {
    if (soloProfesionalId) return []
    return estado.profesionales.filter((p) => turnos.some((t) => t.profesionalId === p.id))
  }, [estado.profesionales, turnos, soloProfesionalId])

  const posicionHorizontal = (turno: Turno) => {
    if (soloProfesionalId || conTurnos.length <= 1) return { left: '0%', width: '100%' }
    const idx = conTurnos.findIndex((p) => p.id === turno.profesionalId)
    const ancho = 100 / conTurnos.length
    return { left: `${idx * ancho}%`, width: `${ancho}%` }
  }

  const horas: number[] = []
  const cierreMin = apertura + alto / PX_POR_MINUTO
  for (let m = apertura; m <= cierreMin; m += 60) horas.push(m)

  const ahora = new Date()
  const marcaAhora =
    isToday(dia) && minutosDelDia(ahora) >= apertura && minutosDelDia(ahora) <= cierreMin

  return (
    <div className={cn('border-border border-r last:border-r-0', ancho)}>
      <div className="border-border bg-surface sticky top-0 z-10 h-[62px] border-b">{cabecera}</div>

      <div className="relative" style={{ height: alto }}>
        {horas.map((m) => (
          <div
            key={m}
            className="border-border/70 absolute inset-x-0 border-t"
            style={{ top: (m - apertura) * PX_POR_MINUTO }}
            aria-hidden
          />
        ))}

        {fueraDeJornada && (
          <div className="bg-muted/40 absolute inset-0">
            <p className="text-muted-foreground pt-6 text-center text-2xs">No trabaja</p>
          </div>
        )}

        {/* Huecos libres: se agenda con un click */}
        {libres.map((h) => {
          const top = (minutosDelDia(h.inicio) - apertura) * PX_POR_MINUTO
          const altoH = ((h.fin.getTime() - h.inicio.getTime()) / 60000) * PX_POR_MINUTO
          const minutos = Math.round((h.fin.getTime() - h.inicio.getTime()) / 60000)
          return (
            <button
              key={h.inicio.toISOString()}
              type="button"
              onClick={() => onNuevo(h.inicio)}
              className="group border-border/80 hover:border-primary hover:bg-primary-soft/60 absolute inset-x-1 cursor-pointer rounded-lg border border-dashed transition-colors duration-200"
              style={{ top: top + 1, height: Math.max(18, altoH - 2) }}
              aria-label={`Agendar a las ${hhmm(h.inicio)}, hay ${duracionLegible(minutos)} libres`}
            >
              <span className="text-muted-foreground group-hover:text-primary flex h-full items-center justify-center gap-1 text-2xs font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                <Plus className="size-3" />
                {minutos >= 45 && <span className="tabular">{duracionLegible(minutos)}</span>}
              </span>
            </button>
          )
        })}

        {/* Bloqueos */}
        {bloqueos.map((b) => {
          const top = (minutosDelDia(b.inicio) - apertura) * PX_POR_MINUTO
          const altoB = ((d(b.fin).getTime() - d(b.inicio).getTime()) / 60000) * PX_POR_MINUTO
          return (
            <div
              key={b.id}
              className="border-border absolute inset-x-1 overflow-hidden rounded-lg border"
              style={{
                top,
                height: Math.max(20, altoB - 2),
                backgroundImage:
                  'repeating-linear-gradient(45deg, var(--muted), var(--muted) 5px, var(--border) 5px, var(--border) 7px)',
              }}
            >
              <p className="text-muted-foreground flex items-center gap-1 px-2 pt-1 text-2xs font-medium">
                <Lock className="size-3 shrink-0" />
                <span className="truncate">{b.motivo}</span>
              </p>
            </div>
          )
        })}

        {/* Turnos */}
        {turnos.map((t) => (
          <BloqueTurno
            key={t.id}
            turno={t}
            apertura={apertura}
            mostrarProfesional={!soloProfesionalId}
            posicion={posicionHorizontal(t)}
            onClick={() => verTurno(t.id)}
          />
        ))}

        {/* Línea de la hora actual */}
        {marcaAhora && (
          <div
            className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
            style={{ top: (minutosDelDia(ahora) - apertura) * PX_POR_MINUTO }}
            aria-hidden
          >
            <span className="bg-danger size-2 shrink-0 rounded-full" />
            <span className="bg-danger h-px flex-1" />
          </div>
        )}
      </div>
    </div>
  )
}

/* -------------------------------- Bloque turno ---------------------------- */

function BloqueTurno({
  turno,
  apertura,
  mostrarProfesional,
  posicion,
  onClick,
}: {
  turno: Turno
  apertura: number
  mostrarProfesional: boolean
  posicion: { left: string; width: string }
  onClick: () => void
}) {
  const { estado } = useSalon()
  const clienta = buscarClienta(estado, turno.clientaId)
  const servicios = serviciosDeTurno(estado, turno)
  const prof = estado.profesionales.find((p) => p.id === turno.profesionalId)
  const color = servicios[0] ? CATEGORIAS[servicios[0].categoria].color : 'var(--primary)'

  const top = (minutosDelDia(turno.inicio) - apertura) * PX_POR_MINUTO
  const minutos = (d(turno.fin).getTime() - d(turno.inicio).getTime()) / 60000
  const alto = minutos * PX_POR_MINUTO
  const compacto = alto < 52

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'hover:shadow-lift absolute cursor-pointer overflow-hidden rounded-lg border border-l-[3px] px-2 py-1.5 text-left shadow-xs transition-[box-shadow] duration-200 hover:z-10',
            turno.estado === 'completado' && 'opacity-70',
            turno.estado === 'pendiente' ? 'border-dashed' : 'border-transparent',
          )}
          style={{
            top: top + 1,
            height: Math.max(22, alto - 2),
            left: `calc(${posicion.left} + 4px)`,
            width: `calc(${posicion.width} - 8px)`,
            borderLeftColor: color,
            borderLeftStyle: 'solid',
            backgroundColor: `color-mix(in oklab, ${color} 12%, var(--surface))`,
          }}
        >
          <span className={cn('flex items-center gap-1.5', compacto ? 'text-2xs' : 'text-[13px]')}>
            <span className="tabular shrink-0 font-semibold">{hhmm(turno.inicio)}</span>
            <span className="truncate font-medium">{clienta?.nombre}</span>
            {turno.origen === 'whatsapp' && !compacto && (
              <span className="ml-auto shrink-0">
                <ChipOrigen origen="whatsapp" corto />
              </span>
            )}
          </span>

          {!compacto && (
            <>
              <span className="text-muted-foreground mt-0.5 block truncate text-2xs">
                {servicios.map((s) => s.nombre).join(' + ')}
              </span>
              {alto > 78 && (
                <span className="mt-1 flex flex-wrap items-center gap-x-1.5">
                  <span
                    className="text-2xs font-semibold"
                    style={{ color: ESTADO_TURNO[turno.estado].punto }}
                  >
                    {ESTADO_TURNO[turno.estado].label}
                  </span>
                  {mostrarProfesional && prof && (
                    <span className="text-muted-foreground truncate text-2xs">
                      · {primerNombre(prof.nombre)}
                    </span>
                  )}
                </span>
              )}
            </>
          )}
        </button>
      </TooltipTrigger>

      <TooltipContent side="right">
        <p className="font-semibold">{clienta?.nombre}</p>
        <p>
          {hhmm(turno.inicio)}–{hhmm(turno.fin)} · {duracionLegible(minutos)}
        </p>
        <p>{nombreServicios(estado, turno)}</p>
        <p>
          {moneda(turno.precioTotal)} · {ESTADO_TURNO[turno.estado].label}
          {prof && ` · ${primerNombre(prof.nombre)}`}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
