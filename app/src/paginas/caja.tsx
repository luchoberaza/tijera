import * as React from 'react'
import {
  Banknote,
  CreditCard,
  Landmark,
  Receipt,
  TrendingUp,
  UserX,
  Users,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Kpi } from '@/components/bento'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, EmptyState, Tabs, TabsList, TabsTrigger } from '@/components/ui/misc'
import { ChipOrigen } from '@/components/turnos/piezas'
import { CATEGORIAS } from '@/data/catalogo'
import { METODO_PAGO, buscarClienta, nombreServicios, serviciosDeTurno } from '@/lib/agenda'
import { DIAS_CORTOS, addDays, claveDia, d, fechaCorta, hhmm, startOfDay } from '@/lib/fecha'
import { moneda, porcentaje, primerNombre } from '@/lib/formato'
import type { MetodoPago, Turno } from '@/lib/tipos'
import { useSalon } from '@/store/salon'

type Periodo = 'hoy' | 'semana' | 'mes'

const ICONO_PAGO: Record<MetodoPago, React.ComponentType<{ className?: string }>> = {
  efectivo: Banknote,
  debito: CreditCard,
  credito: CreditCard,
  transferencia: Landmark,
}

const COLOR_PAGO: Record<MetodoPago, string> = {
  efectivo: '#2C6B4F',
  debito: '#2F5D94',
  credito: '#7C4B8B',
  transferencia: '#A85C2E',
}

export function PaginaCaja() {
  const { estado } = useSalon()
  // Arranca en la semana: es el rango con el que se mira la caja de verdad, y
  // el número del día ya está en la pantalla de Hoy.
  const [periodo, setPeriodo] = React.useState<Periodo>('semana')

  const hoy = startOfDay(new Date())
  const dias = periodo === 'hoy' ? 1 : periodo === 'semana' ? 7 : 30
  const desde = addDays(hoy, -(dias - 1))

  const enRango = (t: Turno) => {
    const f = d(t.inicio)
    return f >= desde && f < addDays(hoy, 1)
  }

  const completados = estado.turnos.filter((t) => t.estado === 'completado' && enRango(t))
  const ausencias = estado.turnos.filter((t) => t.estado === 'no_asistio' && enRango(t))
  const cancelados = estado.turnos.filter((t) => t.estado === 'cancelado' && enRango(t))

  const facturado = completados.reduce((s, t) => s + (t.pago?.monto ?? 0), 0)
  const propinas = completados.reduce((s, t) => s + (t.pago?.propina ?? 0), 0)
  const ticket = completados.length ? Math.round(facturado / completados.length) : 0
  const perdido = ausencias.reduce((s, t) => s + t.precioTotal, 0)

  /* Ingresos por día */
  const porDia = React.useMemo(() => {
    const mapa = new Map<string, number>()
    for (let i = 0; i < dias; i++) {
      mapa.set(claveDia(addDays(desde, i)), 0)
    }
    for (const t of completados) {
      const k = claveDia(t.inicio)
      mapa.set(k, (mapa.get(k) ?? 0) + (t.pago?.monto ?? 0))
    }
    return [...mapa.entries()].map(([k, v]) => {
      const f = new Date(`${k}T12:00:00`)
      return {
        etiqueta: dias > 7 ? `${f.getDate()}` : DIAS_CORTOS[f.getDay()],
        fecha: k,
        ingresos: v,
      }
    })
  }, [completados, desde, dias])

  /* Métodos de pago */
  const porMetodo = React.useMemo(() => {
    const mapa = new Map<MetodoPago, number>()
    for (const t of completados) {
      if (!t.pago) continue
      mapa.set(t.pago.metodo, (mapa.get(t.pago.metodo) ?? 0) + t.pago.monto + t.pago.propina)
    }
    return [...mapa.entries()]
      .map(([metodo, total]) => ({ metodo, nombre: METODO_PAGO[metodo], total }))
      .sort((a, b) => b.total - a.total)
  }, [completados])

  /* Por profesional, con comisión */
  const porProfesional = React.useMemo(
    () =>
      estado.profesionales
        .map((p) => {
          const suyos = completados.filter((t) => t.profesionalId === p.id)
          const total = suyos.reduce((s, t) => s + (t.pago?.monto ?? 0), 0)
          const propina = suyos.reduce((s, t) => s + (t.pago?.propina ?? 0), 0)
          return {
            prof: p,
            turnos: suyos.length,
            total,
            propina,
            comision: Math.round((total * p.comision) / 100),
          }
        })
        .filter((x) => x.turnos > 0)
        .sort((a, b) => b.total - a.total),
    [estado.profesionales, completados],
  )

  /* Por categoría */
  const porCategoria = React.useMemo(() => {
    const mapa = new Map<string, number>()
    for (const t of completados) {
      for (const s of serviciosDeTurno(estado, t)) {
        mapa.set(s.categoria, (mapa.get(s.categoria) ?? 0) + s.precio)
      }
    }
    return [...mapa.entries()]
      .map(([cat, total]) => ({
        nombre: CATEGORIAS[cat as keyof typeof CATEGORIAS].nombre,
        color: CATEGORIAS[cat as keyof typeof CATEGORIAS].color,
        total,
      }))
      .sort((a, b) => b.total - a.total)
  }, [completados, estado])

  const movimientos = [...completados].sort((a, b) => b.inicio.localeCompare(a.inicio)).slice(0, 30)

  const tooltipStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    fontSize: 12,
    boxShadow: 'var(--shadow-lift)',
    color: 'var(--fg)',
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl leading-tight font-bold">Caja y reportes</h1>
          <p className="text-muted-foreground mt-1 text-[13px]">
            {periodo === 'hoy'
              ? fechaCorta(hoy)
              : `Del ${fechaCorta(desde)} al ${fechaCorta(hoy)}`}
          </p>
        </div>

        <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
          <TabsList>
            <TabsTrigger value="hoy">Hoy</TabsTrigger>
            <TabsTrigger value="semana">7 días</TabsTrigger>
            <TabsTrigger value="mes">30 días</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* --------------------------------- KPIs -------------------------------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <Kpi
            etiqueta="Facturado"
            valor={moneda(facturado)}
            icono={Wallet}
            tono="success"
            detalle={`${completados.length} servicios cobrados`}
          />
        </Card>
        <Card>
          <Kpi
            etiqueta="Ticket promedio"
            valor={moneda(ticket)}
            icono={Receipt}
            tono="primary"
            detalle="por clienta atendida"
          />
        </Card>
        <Card>
          <Kpi
            etiqueta="Propinas"
            valor={moneda(propinas)}
            icono={TrendingUp}
            detalle={
              facturado > 0 ? `${porcentaje(propinas / facturado, 1)} de lo facturado` : 'sin datos'
            }
          />
        </Card>
        <Card>
          <Kpi
            etiqueta="Perdido por ausencias"
            valor={moneda(perdido)}
            icono={UserX}
            tono={perdido > 0 ? 'warning' : 'neutral'}
            detalle={`${ausencias.length} ausencias · ${cancelados.length} cancelaciones`}
          />
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* --------------------------- Ingresos por día -------------------------- */}
        <Card className="lg:col-span-2">
          <div className="px-5 pt-5 pb-2">
            <h2 className="font-display text-[15px] font-semibold">Ingresos por día</h2>
            <p className="text-muted-foreground text-2xs">Solo turnos efectivamente cobrados</p>
          </div>
          <div className="px-3 pb-4">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={porDia} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="etiqueta"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-fg)', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-fg)', fontSize: 11 }}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                />
                <RTooltip
                  cursor={{ fill: 'var(--muted)' }}
                  contentStyle={tooltipStyle}
                  formatter={(v) => [moneda(Number(v)), 'Facturado']}
                />
                <Bar dataKey="ingresos" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ---------------------------- Métodos de pago -------------------------- */}
        <Card>
          <div className="px-5 pt-5 pb-2">
            <h2 className="font-display text-[15px] font-semibold">Cómo pagaron</h2>
            <p className="text-muted-foreground text-2xs">Incluye propinas</p>
          </div>
          <div className="px-3 pb-2">
            {porMetodo.length === 0 ? (
              <EmptyState icon={Wallet} title="Sin cobros todavía" className="py-8" />
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={porMetodo}
                    dataKey="total"
                    nameKey="nombre"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  >
                    {porMetodo.map((p) => (
                      <Cell key={p.metodo} fill={COLOR_PAGO[p.metodo]} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={tooltipStyle} formatter={(v) => moneda(Number(v))} />
                  <Legend
                    verticalAlign="bottom"
                    height={28}
                    formatter={(value) => (
                      <span style={{ color: 'var(--muted-fg)', fontSize: 11 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="space-y-2 px-5 pb-5">
            {porMetodo.map((p) => {
              const Icono = ICONO_PAGO[p.metodo]
              return (
                <li key={p.metodo} className="flex items-center gap-2.5 text-[13px]">
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-lg"
                    style={{ backgroundColor: `${COLOR_PAGO[p.metodo]}1f`, color: COLOR_PAGO[p.metodo] }}
                  >
                    <Icono className="size-3.5" />
                  </span>
                  <span className="flex-1">{p.nombre}</span>
                  <span className="tabular font-semibold">{moneda(p.total)}</span>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* ---------------------------- Por profesional -------------------------- */}
        <Card>
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-display text-[15px] font-semibold">Producción del equipo</h2>
            <p className="text-muted-foreground text-2xs">
              Lo que generó cada una y la comisión que le corresponde
            </p>
          </div>
          {porProfesional.length === 0 ? (
            <EmptyState icon={Users} title="Sin producción en el período" className="py-10" />
          ) : (
            <ul className="space-y-3 px-5 pb-5">
              {porProfesional.map(({ prof, turnos, total, propina, comision }) => (
                <li key={prof.id} className="border-border bg-surface-2 rounded-xl border p-3.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={prof.nombre} color={prof.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{prof.nombre}</p>
                      <p className="text-muted-foreground text-2xs">
                        {turnos} {turnos === 1 ? 'servicio' : 'servicios'}
                      </p>
                    </div>
                    <p className="font-display tabular text-base font-bold">{moneda(total)}</p>
                  </div>
                  <div className="text-muted-foreground mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-2xs">
                    {prof.comision > 0 ? (
                      <span>
                        Comisión {prof.comision}%:{' '}
                        <strong className="text-foreground tabular">{moneda(comision)}</strong>
                      </span>
                    ) : (
                      <Badge variant="primary">Dueña · sin comisión</Badge>
                    )}
                    {propina > 0 && (
                      <span>
                        Propinas: <strong className="text-foreground tabular">{moneda(propina)}</strong>
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* ----------------------------- Por categoría --------------------------- */}
        <Card>
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-display text-[15px] font-semibold">De dónde viene la plata</h2>
            <p className="text-muted-foreground text-2xs">Facturación por tipo de servicio</p>
          </div>
          {porCategoria.length === 0 ? (
            <EmptyState icon={Receipt} title="Sin datos en el período" className="py-10" />
          ) : (
            <ul className="space-y-3 px-5 pb-5">
              {porCategoria.map((c) => {
                const pct = facturado > 0 ? c.total / facturado : 0
                return (
                  <li key={c.nombre}>
                    <div className="mb-1.5 flex items-center gap-2 text-[13px]">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="flex-1 font-medium">{c.nombre}</span>
                      <span className="text-muted-foreground tabular text-2xs">
                        {porcentaje(pct)}
                      </span>
                      <span className="tabular w-20 text-right font-semibold">{moneda(c.total)}</span>
                    </div>
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{ width: `${pct * 100}%`, backgroundColor: c.color }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* ------------------------------ Movimientos ---------------------------- */}
      <Card>
        <div className="px-5 pt-5 pb-3">
          <h2 className="font-display text-[15px] font-semibold">Movimientos</h2>
          <p className="text-muted-foreground text-2xs">Últimos cobros registrados</p>
        </div>

        {movimientos.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Todavía no hubo cobros"
            description="Cuando cierres un turno cobrado, aparece en esta lista."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-[13px]">
              <thead>
                <tr className="text-muted-foreground border-border border-y text-2xs uppercase">
                  <th scope="col" className="px-5 py-2.5 font-semibold">
                    Fecha
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Clienta
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Servicio
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Atendió
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Pago
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((t) => {
                  const clienta = buscarClienta(estado, t.clientaId)
                  const prof = estado.profesionales.find((p) => p.id === t.profesionalId)
                  return (
                    <tr key={t.id} className="border-border hover:bg-muted/50 border-b transition-colors">
                      <td className="px-5 py-2.5 whitespace-nowrap">
                        <span className="block">{fechaCorta(t.inicio)}</span>
                        <span className="text-muted-foreground tabular text-2xs">
                          {hhmm(t.inicio)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="block font-medium">{clienta?.nombre}</span>
                        <ChipOrigen origen={t.origen} corto />
                      </td>
                      <td className="text-muted-foreground max-w-52 truncate px-3 py-2.5">
                        {nombreServicios(estado, t)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {prof ? primerNombre(prof.nombre) : '—'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {t.pago ? METODO_PAGO[t.pago.metodo] : '—'}
                      </td>
                      <td className="tabular px-5 py-2.5 text-right font-semibold whitespace-nowrap">
                        {moneda((t.pago?.monto ?? 0) + (t.pago?.propina ?? 0))}
                        {t.pago && t.pago.propina > 0 && (
                          <span className="text-success block text-2xs font-normal">
                            +{moneda(t.pago.propina)} propina
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
