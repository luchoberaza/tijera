import * as React from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CircleAlert, Search, UserPlus, Users } from 'lucide-react'
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
import { Avatar, EmptyState } from '@/components/ui/misc'
import { resumenClienta } from '@/lib/agenda'
import { fechaRelativa, hhmm } from '@/lib/fecha'
import { moneda, telefonoLegible } from '@/lib/formato'
import type { Clienta } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { nuevoId, useSalon } from '@/store/salon'

type Filtro = 'todas' | 'VIP' | 'Nueva' | 'Riesgo' | 'sin-turno'

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'VIP', label: 'VIP' },
  { id: 'Nueva', label: 'Nuevas' },
  { id: 'sin-turno', label: 'Sin próximo turno' },
  { id: 'Riesgo', label: 'Con ausencias' },
]

export function PaginaClientas() {
  const { estado } = useSalon()
  const [q, setQ] = React.useState('')
  const [filtro, setFiltro] = React.useState<Filtro>('todas')
  const [nuevaAbierta, setNuevaAbierta] = React.useState(false)

  const listado = React.useMemo(() => {
    const termino = q.trim().toLowerCase()
    const digitos = termino.replace(/\D/g, '')

    return estado.clientas
      .map((c) => ({ c, r: resumenClienta(estado, c.id) }))
      .filter(({ c, r }) => {
        if (filtro === 'sin-turno' && r.proximoTurno) return false
        if (filtro !== 'todas' && filtro !== 'sin-turno' && !c.etiquetas.includes(filtro)) return false
        if (!termino) return true
        return (
          c.nombre.toLowerCase().includes(termino) ||
          (digitos.length >= 3 && c.telefono.replace(/\D/g, '').includes(digitos))
        )
      })
      .sort((a, b) => {
        const fa = a.r.proximoTurno?.inicio ?? ''
        const fb = b.r.proximoTurno?.inicio ?? ''
        if (fa && fb) return fa.localeCompare(fb)
        if (fa) return -1
        if (fb) return 1
        return a.c.nombre.localeCompare(b.c.nombre)
      })
  }, [estado, q, filtro])

  const totales = React.useMemo(
    () => ({
      total: estado.clientas.length,
      nuevas: estado.clientas.filter((c) => c.etiquetas.includes('Nueva')).length,
      conTurno: estado.clientas.filter((c) => resumenClienta(estado, c.id).proximoTurno).length,
    }),
    [estado],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl leading-tight font-bold">Clientas</h1>
          <p className="text-muted-foreground mt-1 text-[13px]">
            {totales.total} en la base · {totales.conTurno} con turno agendado · {totales.nuevas}{' '}
            nuevas este mes
          </p>
        </div>
        <Button onClick={() => setNuevaAbierta(true)}>
          <UserPlus />
          Nueva clienta
        </Button>
      </div>

      <Card className="p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o teléfono…"
              aria-label="Buscar clienta"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltro(f.id)}
                aria-pressed={filtro === f.id}
                className={cn(
                  'cursor-pointer rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors duration-200',
                  filtro === f.id
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-border hover:bg-muted',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {listado.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Sin resultados"
            description="Probá con otro nombre o cambiá el filtro."
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {listado.map(({ c, r }) => (
            <Link key={c.id} to={`/clientas/${c.id}`} className="block">
              <Card interactive className="h-full p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={c.nombre} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.nombre}</p>
                    <p className="text-muted-foreground truncate text-2xs">
                      {telefonoLegible(c.telefono)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {c.etiquetas.slice(0, 2).map((e) => (
                        <Badge
                          key={e}
                          variant={
                            e === 'VIP'
                              ? 'primary'
                              : e === 'Nueva'
                                ? 'info'
                                : e === 'Riesgo'
                                  ? 'danger'
                                  : 'neutral'
                          }
                        >
                          {e === 'Riesgo' ? 'Ausencias' : e}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {c.alertas.length > 0 && (
                  <p className="text-warning mt-3 flex items-start gap-1.5 text-2xs">
                    <CircleAlert className="mt-px size-3 shrink-0" />
                    <span className="line-clamp-2">{c.alertas[0]}</span>
                  </p>
                )}

                <dl className="border-border mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center">
                  <div>
                    <dt className="text-muted-foreground text-2xs">Visitas</dt>
                    <dd className="tabular text-sm font-semibold">{r.visitas}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-2xs">Ticket</dt>
                    <dd className="tabular text-sm font-semibold">{moneda(r.ticketPromedio)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-2xs">Últimas</dt>
                    <dd className="tabular text-sm font-semibold">
                      {r.diasDesdeUltima !== undefined ? `${r.diasDesdeUltima} d` : '—'}
                    </dd>
                  </div>
                </dl>

                <p
                  className={cn(
                    'mt-3 rounded-lg px-2.5 py-1.5 text-center text-2xs font-medium',
                    r.proximoTurno
                      ? 'bg-primary-soft text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {r.proximoTurno
                    ? `Próximo turno: ${fechaRelativa(r.proximoTurno.inicio)} ${hhmm(r.proximoTurno.inicio)}`
                    : 'Sin próximo turno'}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <DialogoNuevaClienta abierto={nuevaAbierta} onAbrir={setNuevaAbierta} />
    </div>
  )
}

/* --------------------------- Alta rápida de clienta ----------------------- */

function DialogoNuevaClienta({
  abierto,
  onAbrir,
}: {
  abierto: boolean
  onAbrir: (v: boolean) => void
}) {
  const { dispatch } = useSalon()
  const [nombre, setNombre] = React.useState('')
  const [telefono, setTelefono] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [notas, setNotas] = React.useState('')
  const [alertas, setAlertas] = React.useState('')

  React.useEffect(() => {
    if (abierto) {
      setNombre('')
      setTelefono('')
      setEmail('')
      setNotas('')
      setAlertas('')
    }
  }, [abierto])

  const guardar = () => {
    if (!nombre.trim()) return
    const clienta: Clienta = {
      id: nuevoId('c'),
      nombre: nombre.trim(),
      telefono: telefono.trim() || '+598',
      email: email.trim() || undefined,
      etiquetas: ['Nueva'],
      notas: notas.trim() || undefined,
      alertas: alertas.trim() ? [alertas.trim()] : [],
      desde: new Date().toISOString().slice(0, 10),
      fichaTecnica: [],
    }
    dispatch({ tipo: 'clienta/crear', clienta })
    toast.success('Clienta creada', { description: clienta.nombre })
    onAbrir(false)
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbrir}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva clienta</DialogTitle>
          <DialogDescription>
            Con el nombre y el teléfono alcanza. El resto se completa con el tiempo.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="n-nombre">
              Nombre y apellido <span className="text-danger">*</span>
            </Label>
            <Input
              id="n-nombre"
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej.: Ana Pérez"
              autoComplete="name"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="n-tel">Teléfono</Label>
              <Input
                id="n-tel"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="099 123 456"
              />
            </div>
            <div>
              <Label htmlFor="n-mail">Email</Label>
              <Input
                id="n-mail"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="opcional"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="n-alerta">Alergias o cuidados especiales</Label>
            <Input
              id="n-alerta"
              value={alertas}
              onChange={(e) => setAlertas(e.target.value)}
              placeholder="Ej.: cuero cabelludo sensible"
            />
            <p className="text-muted-foreground mt-1.5 text-xs">
              Aparece resaltado cada vez que se abre uno de sus turnos.
            </p>
          </div>

          <div>
            <Label htmlFor="n-notas">Notas</Label>
            <Textarea
              id="n-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Gustos, referencias, cómo llegó al salón…"
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onAbrir(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={!nombre.trim()}>
            <UserPlus />
            Crear clienta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
