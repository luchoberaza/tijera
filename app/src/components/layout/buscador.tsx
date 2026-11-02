import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Search, Users } from 'lucide-react'
import { Avatar, Popover, PopoverContent, PopoverTrigger } from '@/components/ui/misc'
import { ChipEstado } from '@/components/turnos/piezas'
import { useTurnos } from '@/components/turnos/proveedor-turnos'
import { nombreServicios } from '@/lib/agenda'
import { fechaRelativa, hhmm } from '@/lib/fecha'
import { telefonoLegible } from '@/lib/formato'
import { useSalon } from '@/store/salon'

/** Buscador único: encuentra clientas por nombre o teléfono, y turnos por código. */
export function BuscadorGlobal({ className }: { className?: string }) {
  const { estado } = useSalon()
  const { verTurno } = useTurnos()
  const navegar = useNavigate()
  const [q, setQ] = React.useState('')
  const [abierto, setAbierto] = React.useState(false)
  const ref = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const atajo = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener('keydown', atajo)
    return () => window.removeEventListener('keydown', atajo)
  }, [])

  const termino = q.trim().toLowerCase()
  const soloDigitos = termino.replace(/\D/g, '')

  const clientas = React.useMemo(() => {
    if (termino.length < 2) return []
    return estado.clientas
      .filter(
        (c) =>
          c.nombre.toLowerCase().includes(termino) ||
          (soloDigitos.length >= 3 && c.telefono.replace(/\D/g, '').includes(soloDigitos)),
      )
      .slice(0, 5)
  }, [estado.clientas, termino, soloDigitos])

  const turnos = React.useMemo(() => {
    if (termino.length < 3) return []
    const ahora = new Date()
    return estado.turnos
      .filter((t) => t.codigo.toLowerCase() === termino)
      .concat(
        estado.turnos.filter((t) => {
          const cli = estado.clientas.find((c) => c.id === t.clientaId)
          return (
            cli?.nombre.toLowerCase().includes(termino) &&
            new Date(t.inicio) >= ahora &&
            t.estado !== 'cancelado'
          )
        }),
      )
      .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
      .sort((a, b) => a.inicio.localeCompare(b.inicio))
      .slice(0, 4)
  }, [estado.turnos, estado.clientas, termino])

  const hayResultados = clientas.length > 0 || turnos.length > 0
  const mostrar = abierto && termino.length >= 2

  return (
    <Popover open={mostrar} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <div className={className}>
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              ref={ref}
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setAbierto(true)
              }}
              onFocus={() => setAbierto(true)}
              placeholder="Buscar clienta, teléfono o código…"
              aria-label="Buscar en el salón"
              className="border-border bg-surface placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-primary/25 h-10 w-full rounded-xl border pr-16 pl-9 text-sm transition-[border-color,box-shadow] duration-200 outline-none focus-visible:ring-2"
            />
            <kbd className="text-muted-foreground border-border bg-muted pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border px-1.5 py-0.5 text-2xs font-medium lg:block">
              Ctrl K
            </kbd>
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {!hayResultados ? (
          <p className="text-muted-foreground px-4 py-6 text-center text-[13px]">
            Sin resultados para “{q.trim()}”.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto p-1.5">
            {clientas.length > 0 && (
              <>
                <p className="text-muted-foreground flex items-center gap-1.5 px-2.5 py-1.5 text-2xs font-semibold tracking-wide uppercase">
                  <Users className="size-3" />
                  Clientas
                </p>
                {clientas.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      navegar(`/clientas/${c.id}`)
                      setAbierto(false)
                      setQ('')
                    }}
                    className="hover:bg-muted flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors"
                  >
                    <Avatar name={c.nombre} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{c.nombre}</span>
                      <span className="text-muted-foreground block text-2xs">
                        {telefonoLegible(c.telefono)}
                      </span>
                    </span>
                  </button>
                ))}
              </>
            )}

            {turnos.length > 0 && (
              <>
                <p className="text-muted-foreground mt-1 flex items-center gap-1.5 px-2.5 py-1.5 text-2xs font-semibold tracking-wide uppercase">
                  <CalendarDays className="size-3" />
                  Turnos
                </p>
                {turnos.map((t) => {
                  const cli = estado.clientas.find((c) => c.id === t.clientaId)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        verTurno(t.id)
                        setAbierto(false)
                        setQ('')
                      }}
                      className="hover:bg-muted flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{cli?.nombre}</span>
                        <span className="text-muted-foreground block truncate text-2xs">
                          {fechaRelativa(t.inicio)} {hhmm(t.inicio)} · {nombreServicios(estado, t)}
                        </span>
                      </span>
                      <ChipEstado estado={t.estado} />
                    </button>
                  )
                })}
              </>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
