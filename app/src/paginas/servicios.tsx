import * as React from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Clock, Hourglass, MessageCircle, Pencil, Scissors } from 'lucide-react'
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
import { FieldHint, Input, Label, Textarea } from '@/components/ui/input'
import { Separator, Switch } from '@/components/ui/misc'
import { CATEGORIAS } from '@/data/catalogo'
import { d, duracionLegible } from '@/lib/fecha'
import { moneda } from '@/lib/formato'
import type { CategoriaServicio, Servicio } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { useSalon } from '@/store/salon'

export function PaginaServicios() {
  const { estado, dispatch } = useSalon()
  const [editando, setEditando] = React.useState<Servicio | null>(null)

  const porCategoria = React.useMemo(() => {
    const mapa = new Map<CategoriaServicio, Servicio[]>()
    for (const s of estado.servicios) {
      const lista = mapa.get(s.categoria) ?? []
      lista.push(s)
      mapa.set(s.categoria, lista)
    }
    return [...mapa.entries()]
  }, [estado.servicios])

  /** Cuántas veces se hizo cada servicio en los últimos 30 días. */
  const demanda = React.useMemo(() => {
    const desde = new Date()
    desde.setDate(desde.getDate() - 30)
    const conteo = new Map<string, number>()
    for (const t of estado.turnos) {
      if (t.estado !== 'completado' || d(t.inicio) < desde) continue
      for (const id of t.serviciosIds) conteo.set(id, (conteo.get(id) ?? 0) + 1)
    }
    return conteo
  }, [estado.turnos])

  const activos = estado.servicios.filter((s) => s.activo).length
  const online = estado.servicios.filter((s) => s.activo && s.online).length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl leading-tight font-bold">Servicios</h1>
        <p className="text-muted-foreground mt-1 text-[13px]">
          {activos} servicios activos · {online} se pueden reservar por WhatsApp. La duración define
          cuánto ocupa el turno en la agenda.
        </p>
      </div>

      {porCategoria.map(([cat, lista]) => {
        const info = CATEGORIAS[cat]
        return (
          <section key={cat}>
            <h2 className="font-display mb-2 flex items-center gap-2 text-[15px] font-semibold">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: info.color }} />
              {info.plural}
              <span className="text-muted-foreground text-2xs font-normal">
                {lista.length} {lista.length === 1 ? 'servicio' : 'servicios'}
              </span>
            </h2>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {lista.map((s) => (
                <Card
                  key={s.id}
                  className={cn('flex flex-col p-4', !s.activo && 'opacity-60')}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{s.nombre}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                        {s.descripcion}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditando(s)}
                      aria-label={`Editar ${s.nombre}`}
                    >
                      <Pencil />
                    </Button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-2xs">
                    <span className="text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      {duracionLegible(s.duracionMin)}
                    </span>
                    {s.procesadoMin > 0 && (
                      <span className="text-info inline-flex items-center gap-1">
                        <Hourglass className="size-3" />
                        {s.procesadoMin} min de procesado
                      </span>
                    )}
                    {s.requiereTest && (
                      <Badge variant="warning">
                        <AlertTriangle />
                        Prueba previa
                      </Badge>
                    )}
                  </div>

                  <div className="border-border mt-3 flex items-center justify-between gap-2 border-t pt-3">
                    <span className="font-display tabular text-lg font-bold">{moneda(s.precio)}</span>
                    <span className="text-muted-foreground text-2xs">
                      {demanda.get(s.id) ?? 0} en 30 días
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <label
                      htmlFor={`online-${s.id}`}
                      className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-2xs"
                    >
                      <MessageCircle className="size-3.5" />
                      Reservable por WhatsApp
                    </label>
                    <Switch
                      id={`online-${s.id}`}
                      checked={s.online && s.activo}
                      disabled={!s.activo}
                      onCheckedChange={(v) =>
                        dispatch({ tipo: 'servicio/actualizar', id: s.id, cambios: { online: v } })
                      }
                    />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )
      })}

      <DialogoServicio servicio={editando} onCerrar={() => setEditando(null)} />
    </div>
  )
}

/* ------------------------------ Edición ----------------------------------- */

function DialogoServicio({
  servicio,
  onCerrar,
}: {
  servicio: Servicio | null
  onCerrar: () => void
}) {
  const { dispatch } = useSalon()
  const [form, setForm] = React.useState<Servicio | null>(servicio)

  React.useEffect(() => setForm(servicio), [servicio])

  if (!form) return null

  const guardar = () => {
    dispatch({
      tipo: 'servicio/actualizar',
      id: form.id,
      cambios: {
        nombre: form.nombre,
        precio: Number(form.precio) || 0,
        duracionMin: Number(form.duracionMin) || 15,
        procesadoMin: Number(form.procesadoMin) || 0,
        descripcion: form.descripcion,
        activo: form.activo,
        online: form.online,
        requiereTest: form.requiereTest,
      },
    })
    toast.success('Servicio actualizado', { description: form.nombre })
    onCerrar()
  }

  return (
    <Dialog open={Boolean(servicio)} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar servicio</DialogTitle>
          <DialogDescription>
            Los cambios se aplican a los turnos nuevos; los ya agendados mantienen su precio.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="s-nombre">Nombre</Label>
            <Input
              id="s-nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="s-precio">Precio</Label>
              <Input
                id="s-precio"
                type="number"
                inputMode="numeric"
                min={0}
                step={50}
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
                className="tabular"
              />
            </div>
            <div>
              <Label htmlFor="s-duracion">Duración (min)</Label>
              <Input
                id="s-duracion"
                type="number"
                inputMode="numeric"
                min={15}
                step={15}
                value={form.duracionMin}
                onChange={(e) => setForm({ ...form, duracionMin: Number(e.target.value) })}
                className="tabular"
              />
            </div>
            <div>
              <Label htmlFor="s-procesado">Procesado (min)</Label>
              <Input
                id="s-procesado"
                type="number"
                inputMode="numeric"
                min={0}
                step={5}
                value={form.procesadoMin}
                onChange={(e) => setForm({ ...form, procesadoMin: Number(e.target.value) })}
                className="tabular"
              />
              <FieldHint>Tiempo en que la profesional queda libre.</FieldHint>
            </div>
          </div>

          <div>
            <Label htmlFor="s-desc">Descripción</Label>
            <Textarea
              id="s-desc"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="min-h-20"
            />
            <FieldHint>Es lo que ve la clienta cuando el asistente le ofrece el servicio.</FieldHint>
          </div>

          <Separator />

          <div className="space-y-3">
            <FilaSwitch
              id="s-activo"
              titulo="Servicio activo"
              detalle="Si lo apagás, deja de aparecer en todos lados."
              valor={form.activo}
              onCambio={(v) => setForm({ ...form, activo: v })}
            />
            <FilaSwitch
              id="s-online"
              titulo="Reservable por WhatsApp"
              detalle="El asistente puede agendarlo sin que intervengas."
              valor={form.online}
              onCambio={(v) => setForm({ ...form, online: v })}
            />
            <FilaSwitch
              id="s-test"
              titulo="Requiere prueba de mecha"
              detalle="El asistente avisa antes de confirmar el turno."
              valor={Boolean(form.requiereTest)}
              onCambio={(v) => setForm({ ...form, requiereTest: v })}
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={guardar}>
            <Scissors />
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function FilaSwitch({
  id,
  titulo,
  detalle,
  valor,
  onCambio,
}: {
  id: string
  titulo: string
  detalle: string
  valor: boolean
  onCambio: (v: boolean) => void
}) {
  return (
    <div className="border-border flex items-center justify-between gap-3 rounded-xl border p-3">
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block text-[13px] font-medium">{titulo}</span>
        <span className="text-muted-foreground block text-xs leading-relaxed">{detalle}</span>
      </label>
      <Switch id={id} checked={valor} onCheckedChange={onCambio} />
    </div>
  )
}
