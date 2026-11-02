import * as React from 'react'
import { toast } from 'sonner'
import { Banknote, CreditCard, Landmark, Smartphone } from 'lucide-react'
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
import { Input, Label } from '@/components/ui/input'
import { Separator } from '@/components/ui/misc'
import { buscarClienta, nombreServicios } from '@/lib/agenda'
import { moneda } from '@/lib/formato'
import type { MetodoPago, Turno } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { useSalon } from '@/store/salon'

const METODOS: { id: MetodoPago; label: string; icono: React.ComponentType<{ className?: string }> }[] =
  [
    { id: 'efectivo', label: 'Efectivo', icono: Banknote },
    { id: 'debito', label: 'Débito', icono: CreditCard },
    { id: 'credito', label: 'Crédito', icono: CreditCard },
    { id: 'transferencia', label: 'Transferencia', icono: Landmark },
  ]

const PROPINAS = [0, 5, 10, 15]

export function DialogoCobro({
  turno,
  abierto,
  onAbrir,
}: {
  turno: Turno | null
  abierto: boolean
  onAbrir: (v: boolean) => void
}) {
  const { estado, dispatch } = useSalon()
  const [metodo, setMetodo] = React.useState<MetodoPago>('efectivo')
  const [propinaPct, setPropinaPct] = React.useState(0)
  const [ajuste, setAjuste] = React.useState('')

  React.useEffect(() => {
    if (abierto) {
      setMetodo('efectivo')
      setPropinaPct(0)
      setAjuste('')
    }
  }, [abierto])

  if (!turno) return null

  const clienta = buscarClienta(estado, turno.clientaId)
  const base = Number(ajuste) > 0 ? Number(ajuste) : turno.precioTotal
  const propina = Math.round((base * propinaPct) / 100 / 10) * 10
  const aCobrar = base - turno.senia + propina

  const cobrar = () => {
    dispatch({
      tipo: 'turno/cobrar',
      id: turno.id,
      pago: { metodo, monto: base, propina, fecha: new Date().toISOString() },
    })
    toast.success('Turno cobrado', {
      description: `${clienta?.nombre ?? 'Clienta'} · ${moneda(aCobrar)} en ${METODOS.find((m) => m.id === metodo)?.label.toLowerCase()}`,
    })
    onAbrir(false)
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbrir}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cobrar turno</DialogTitle>
          <DialogDescription>
            {clienta?.nombre} · {nombreServicios(estado, turno)}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          <div>
            <Label>Método de pago</Label>
            <div className="grid grid-cols-2 gap-2">
              {METODOS.map(({ id, label, icono: Icono }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMetodo(id)}
                  aria-pressed={metodo === id}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-[13px] font-medium transition-colors duration-200',
                    metodo === id
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'border-border hover:bg-muted',
                  )}
                >
                  <Icono className="size-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="ajuste">Monto del servicio</Label>
            <Input
              id="ajuste"
              type="number"
              inputMode="numeric"
              value={ajuste}
              onChange={(e) => setAjuste(e.target.value)}
              placeholder={String(turno.precioTotal)}
              className="tabular"
            />
            <p className="text-muted-foreground mt-1.5 text-xs">
              Dejalo vacío para cobrar el precio de lista: {moneda(turno.precioTotal)}.
            </p>
          </div>

          <div>
            <Label>Propina</Label>
            <div className="flex gap-2">
              {PROPINAS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPropinaPct(p)}
                  aria-pressed={propinaPct === p}
                  className={cn(
                    'tabular flex-1 cursor-pointer rounded-lg border py-2.5 text-[13px] font-medium transition-colors duration-200',
                    propinaPct === p
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-muted',
                  )}
                >
                  {p === 0 ? 'Sin propina' : `${p}%`}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Servicio</dt>
              <dd className="tabular font-medium">{moneda(base)}</dd>
            </div>
            {turno.senia > 0 && (
              <div className="text-success flex justify-between">
                <dt>Seña ya pagada</dt>
                <dd className="tabular font-medium">− {moneda(turno.senia)}</dd>
              </div>
            )}
            {propina > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Propina</dt>
                <dd className="tabular font-medium">{moneda(propina)}</dd>
              </div>
            )}
            <Separator />
            <div className="flex items-baseline justify-between">
              <dt className="font-display font-semibold">A cobrar ahora</dt>
              <dd className="font-display tabular text-2xl font-bold">{moneda(aCobrar)}</dd>
            </div>
          </dl>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onAbrir(false)}>
            Cancelar
          </Button>
          <Button variant="success" onClick={cobrar}>
            <Smartphone />
            Registrar cobro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
