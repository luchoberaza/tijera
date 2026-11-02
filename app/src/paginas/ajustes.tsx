import * as React from 'react'
import { toast } from 'sonner'
import {
  Bot,
  Building2,
  CalendarClock,
  Database,
  RotateCcw,
  Save,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FieldHint, Input, Label } from '@/components/ui/input'
import { Separator } from '@/components/ui/misc'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FilaSwitch } from '@/paginas/servicios'
import { DIAS_LARGOS } from '@/lib/fecha'
import { moneda } from '@/lib/formato'
import type { DiaSemana } from '@/lib/tipos'
import { useSalon } from '@/store/salon'

export function PaginaAjustes() {
  const { estado, dispatch, reiniciar } = useSalon()
  const { salon, politicas, agenda, horario } = estado.ajustes

  const [datos, setDatos] = React.useState(salon)
  React.useEffect(() => setDatos(salon), [salon])

  const guardarSalon = () => {
    dispatch({ tipo: 'ajustes/actualizar', cambios: { salon: datos } })
    toast.success('Datos del salón guardados')
  }

  const cambiarPolitica = <K extends keyof typeof politicas>(
    clave: K,
    valor: (typeof politicas)[K],
  ) => dispatch({ tipo: 'ajustes/actualizar', cambios: { politicas: { ...politicas, [clave]: valor } } })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl leading-tight font-bold">Ajustes</h1>
        <p className="text-muted-foreground mt-1 text-[13px]">
          Cómo funciona la agenda y qué reglas sigue el asistente al reservar.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* ------------------------------ El salón ----------------------------- */}
        <Card className="p-5">
          <h2 className="font-display flex items-center gap-2 text-[15px] font-semibold">
            <Building2 className="text-muted-foreground size-4" />
            El salón
          </h2>
          <p className="text-muted-foreground mt-1 mb-4 text-[13px]">
            Estos datos aparecen en los mensajes que manda el asistente.
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="a-nombre">Nombre</Label>
              <Input
                id="a-nombre"
                value={datos.nombre}
                onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="a-dir">Dirección</Label>
              <Input
                id="a-dir"
                value={datos.direccion}
                onChange={(e) => setDatos({ ...datos, direccion: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="a-tel">Teléfono fijo</Label>
                <Input
                  id="a-tel"
                  type="tel"
                  value={datos.telefono}
                  onChange={(e) => setDatos({ ...datos, telefono: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="a-wa">WhatsApp del asistente</Label>
                <Input
                  id="a-wa"
                  type="tel"
                  value={datos.whatsapp}
                  onChange={(e) => setDatos({ ...datos, whatsapp: e.target.value })}
                />
                <FieldHint>Número conectado a la API oficial de Meta.</FieldHint>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={guardarSalon} disabled={JSON.stringify(datos) === JSON.stringify(salon)}>
              <Save />
              Guardar
            </Button>
          </div>
        </Card>

        {/* ---------------------------- Horario general ------------------------ */}
        <Card className="p-5">
          <h2 className="font-display flex items-center gap-2 text-[15px] font-semibold">
            <CalendarClock className="text-muted-foreground size-4" />
            Horario de atención
          </h2>
          <p className="text-muted-foreground mt-1 mb-4 text-[13px]">
            Marco general del salón. Cada profesional tiene además su propio horario, que es el que
            manda a la hora de ofrecer turnos.
          </p>

          <ul className="space-y-1.5">
            {([1, 2, 3, 4, 5, 6, 0] as DiaSemana[]).map((dia) => {
              const tramos = horario[dia]
              return (
                <li key={dia} className="flex items-center gap-3 text-[13px]">
                  <span className="text-muted-foreground w-24 shrink-0">{DIAS_LARGOS[dia]}</span>
                  {tramos.length === 0 ? (
                    <Badge variant="neutral">Cerrado</Badge>
                  ) : (
                    <span className="tabular flex flex-wrap gap-1.5">
                      {tramos.map((t) => (
                        <span
                          key={`${t.inicio}-${t.fin}`}
                          className="bg-primary-soft text-primary rounded-md px-2 py-0.5 text-2xs font-semibold"
                        >
                          {t.inicio} – {t.fin}
                        </span>
                      ))}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>

          <Separator className="my-4" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="a-intervalo">Intervalo de la agenda</Label>
              <Select
                value={String(agenda.intervaloMin)}
                onValueChange={(v) =>
                  dispatch({
                    tipo: 'ajustes/actualizar',
                    cambios: { agenda: { ...agenda, intervaloMin: Number(v) } },
                  })
                }
              >
                <SelectTrigger id="a-intervalo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Cada 10 minutos</SelectItem>
                  <SelectItem value="15">Cada 15 minutos</SelectItem>
                  <SelectItem value="30">Cada 30 minutos</SelectItem>
                </SelectContent>
              </Select>
              <FieldHint>Con qué precisión se ofrecen los horarios libres.</FieldHint>
            </div>
            <div>
              <Label htmlFor="a-anticipacion">Se puede reservar con</Label>
              <Select
                value={String(politicas.maxDiasAnticipacion)}
                onValueChange={(v) => cambiarPolitica('maxDiasAnticipacion', Number(v))}
              >
                <SelectTrigger id="a-anticipacion">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 días de anticipación</SelectItem>
                  <SelectItem value="30">30 días de anticipación</SelectItem>
                  <SelectItem value="60">60 días de anticipación</SelectItem>
                  <SelectItem value="90">90 días de anticipación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* -------------------------- Políticas de reserva --------------------- */}
        <Card className="p-5">
          <h2 className="font-display flex items-center gap-2 text-[15px] font-semibold">
            <ShieldCheck className="text-muted-foreground size-4" />
            Políticas
          </h2>
          <p className="text-muted-foreground mt-1 mb-4 text-[13px]">
            Las reglas con las que el asistente decide qué puede hacer una clienta sola.
          </p>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="a-cancel">Cancelación sin cargo</Label>
                <Select
                  value={String(politicas.cancelacionHoras)}
                  onValueChange={(v) => cambiarPolitica('cancelacionHoras', Number(v))}
                >
                  <SelectTrigger id="a-cancel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Hasta 2 h antes</SelectItem>
                    <SelectItem value="12">Hasta 12 h antes</SelectItem>
                    <SelectItem value="24">Hasta 24 h antes</SelectItem>
                    <SelectItem value="48">Hasta 48 h antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="a-senia">Seña</Label>
                <Select
                  value={String(politicas.seniaPorcentaje)}
                  onValueChange={(v) => cambiarPolitica('seniaPorcentaje', Number(v))}
                >
                  <SelectTrigger id="a-senia">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sin seña</SelectItem>
                    <SelectItem value="20">20% del servicio</SelectItem>
                    <SelectItem value="30">30% del servicio</SelectItem>
                    <SelectItem value="50">50% del servicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="a-desde">Pedir seña a partir de</Label>
              <Input
                id="a-desde"
                type="number"
                inputMode="numeric"
                step={500}
                min={0}
                value={politicas.seniaDesdeMonto}
                onChange={(e) => cambiarPolitica('seniaDesdeMonto', Number(e.target.value))}
                className="tabular"
              />
              <FieldHint>
                Hoy: servicios de {moneda(politicas.seniaDesdeMonto)} o más piden{' '}
                {politicas.seniaPorcentaje}% por adelantado.
              </FieldHint>
            </div>

            <FilaSwitch
              id="a-cancelwa"
              titulo="Permitir cancelar por WhatsApp"
              detalle="La clienta puede cancelar o reprogramar sola, sin escribirte."
              valor={politicas.permitirCancelarPorWhatsapp}
              onCambio={(v) => cambiarPolitica('permitirCancelarPorWhatsapp', v)}
            />
          </div>
        </Card>

        {/* ------------------------------ Asistente ---------------------------- */}
        <Card className="p-5">
          <h2 className="font-display flex items-center gap-2 text-[15px] font-semibold">
            <Bot className="text-muted-foreground size-4" />
            Asistente de WhatsApp
          </h2>
          <p className="text-muted-foreground mt-1 mb-4 text-[13px]">
            Conectado por la API oficial de Meta. Responder a quien te escribe no tiene costo fijo
            mensual.
          </p>

          <div className="space-y-3">
            <FilaSwitch
              id="a-bot"
              titulo="Asistente activo"
              detalle="Toma reservas solo, las 24 horas, incluso con el salón cerrado."
              valor={estado.ajustes.bot.activo}
              onCambio={(v) =>
                dispatch({
                  tipo: 'ajustes/actualizar',
                  cambios: { bot: { ...estado.ajustes.bot, activo: v } },
                })
              }
            />
            <FilaSwitch
              id="a-recordatorio"
              titulo="Recordatorios automáticos"
              detalle={`Se envían ${estado.ajustes.recordatorios.horasAntes} h antes de cada turno.`}
              valor={estado.ajustes.recordatorios.activo}
              onCambio={(v) =>
                dispatch({
                  tipo: 'ajustes/actualizar',
                  cambios: {
                    recordatorios: { ...estado.ajustes.recordatorios, activo: v },
                  },
                })
              }
            />
            <FilaSwitch
              id="a-derivar"
              titulo="Derivar lo que no entiende"
              detalle="Antes de improvisar una respuesta, te avisa a vos."
              valor={estado.ajustes.bot.derivarAHumano}
              onCambio={(v) =>
                dispatch({
                  tipo: 'ajustes/actualizar',
                  cambios: { bot: { ...estado.ajustes.bot, derivarAHumano: v } },
                })
              }
            />
          </div>

          <div className="bg-whatsapp-soft text-whatsapp mt-4 rounded-xl px-3.5 py-3 text-[13px] leading-relaxed">
            El texto del saludo y del recordatorio se edita desde{' '}
            <strong>WhatsApp → Mensajes automáticos</strong>.
          </div>
        </Card>
      </div>

      {/* ------------------------------ Demostración ---------------------------- */}
      <Card className="p-5">
        <h2 className="font-display flex items-center gap-2 text-[15px] font-semibold">
          <Database className="text-muted-foreground size-4" />
          Datos de la demostración
        </h2>
        <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
          Esta versión funciona con datos de ejemplo generados alrededor de la fecha de hoy:{' '}
          <strong className="text-foreground">{estado.clientas.length} clientas</strong>,{' '}
          <strong className="text-foreground">{estado.turnos.length} turnos</strong> y{' '}
          <strong className="text-foreground">{estado.servicios.length} servicios</strong>. Todo lo
          que cambies queda guardado en este navegador. En la versión final, los datos viven en un
          servidor con copias de seguridad diarias.
        </p>
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={() => {
              reiniciar()
              toast.success('Datos de ejemplo regenerados')
            }}
          >
            <RotateCcw />
            Reiniciar datos de ejemplo
          </Button>
        </div>
      </Card>
    </div>
  )
}
