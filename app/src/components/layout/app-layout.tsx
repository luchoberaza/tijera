import * as React from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  CalendarDays,
  LayoutGrid,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Scissors,
  Settings,
  Sun,
  Users,
  Wallet,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/misc'
import { Marca } from '@/components/marca'
import { BuscadorGlobal } from '@/components/layout/buscador'
import { useTurnos } from '@/components/turnos/proveedor-turnos'
import { fechaLarga } from '@/lib/fecha'
import { cn } from '@/lib/utils'
import { useSalon } from '@/store/salon'
import { useTema } from '@/store/tema'

interface ItemNav {
  to: string
  label: string
  icono: React.ComponentType<{ className?: string }>
  /** Aparece en la barra inferior del móvil. */
  movil?: boolean
}

const NAV: ItemNav[] = [
  { to: '/', label: 'Hoy', icono: LayoutGrid, movil: true },
  { to: '/agenda', label: 'Agenda', icono: CalendarDays, movil: true },
  { to: '/clientas', label: 'Clientas', icono: Users, movil: true },
  { to: '/whatsapp', label: 'WhatsApp', icono: MessageCircle, movil: true },
  { to: '/caja', label: 'Caja', icono: Wallet },
  { to: '/servicios', label: 'Servicios', icono: Scissors },
  { to: '/equipo', label: 'Equipo', icono: Users },
  { to: '/ajustes', label: 'Ajustes', icono: Settings },
]

const TITULOS: Record<string, string> = {
  '/': 'Hoy en el salón',
  '/agenda': 'Agenda',
  '/clientas': 'Clientas',
  '/whatsapp': 'WhatsApp',
  '/caja': 'Caja y reportes',
  '/servicios': 'Servicios',
  '/equipo': 'Equipo',
  '/ajustes': 'Ajustes',
}

export function AppLayout() {
  const { estado, reiniciar } = useSalon()
  const { tema, alternar } = useTema()
  const { nuevoTurno } = useTurnos()
  const { pathname } = useLocation()

  const sinLeer = estado.conversaciones.reduce((s, c) => s + c.sinLeer, 0)
  const titulo = TITULOS[pathname] ?? (pathname.startsWith('/clientas') ? 'Ficha de clienta' : 'Tijera')

  const badgePara = (to: string) => (to === '/whatsapp' && sinLeer > 0 ? sinLeer : null)

  return (
    <div className="min-h-dvh">
      {/* ---------------------------- Sidebar (≥lg) --------------------------- */}
      <aside className="border-border bg-surface fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r lg:flex">
        <div className="px-5 py-5">
          <Marca />
        </div>

        <nav className="flex-1 space-y-0.5 px-3" aria-label="Secciones">
          {NAV.map(({ to, label, icono: Icono }) => {
            const badge = badgePara(to)
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'bg-primary-soft text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icono className="size-4.5 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && <Badge variant="whatsapp">{badge}</Badge>}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-border space-y-3 border-t p-3">
          <div className="bg-surface-2 border-border rounded-xl border p-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'size-2 rounded-full',
                  estado.ajustes.bot.activo ? 'bg-whatsapp animate-pulse-dot' : 'bg-muted-foreground',
                )}
              />
              <p className="text-[13px] font-medium">
                {estado.ajustes.bot.activo ? 'Asistente activo' : 'Asistente pausado'}
              </p>
            </div>
            <p className="text-muted-foreground mt-1 text-2xs leading-relaxed">
              {estado.ajustes.bot.activo
                ? 'Tomando reservas por WhatsApp las 24 h.'
                : 'Los mensajes quedan sin responder.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Avatar name="Valeria Núñez" color="#A85C2E" size="sm" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-medium">Valeria Núñez</p>
              <p className="text-muted-foreground truncate text-2xs">Dueña</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Más opciones">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top">
                <DropdownMenuLabel>Demostración</DropdownMenuLabel>
                <DropdownMenuItem onSelect={alternar}>
                  {tema === 'claro' ? <Moon /> : <Sun />}
                  {tema === 'claro' ? 'Modo oscuro' : 'Modo claro'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={reiniciar}>
                  <RotateCcw />
                  Reiniciar datos de ejemplo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* ------------------------------ Contenido ----------------------------- */}
      <div className="lg:pl-60">
        {/* Barra superior */}
        <header className="border-border bg-background/85 sticky top-0 z-20 border-b backdrop-blur-md">
          <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6">
            <div className="lg:hidden">
              <Marca compacta />
            </div>

            <div className="hidden min-w-0 lg:block">
              <h1 className="font-display truncate text-lg leading-tight font-bold">{titulo}</h1>
              <p className="text-muted-foreground text-2xs">{fechaLarga(new Date())}</p>
            </div>

            <BuscadorGlobal className="ml-auto w-full max-w-xs lg:max-w-sm" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={alternar}
                  aria-label={tema === 'claro' ? 'Activar modo oscuro' : 'Activar modo claro'}
                  className="hidden sm:inline-flex"
                >
                  {tema === 'claro' ? <Moon /> : <Sun />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{tema === 'claro' ? 'Modo oscuro' : 'Modo claro'}</TooltipContent>
            </Tooltip>

            <Button onClick={() => nuevoTurno()} className="shrink-0">
              <Plus />
              <span className="hidden sm:inline">Nuevo turno</span>
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 pt-5 pb-28 sm:px-6 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* --------------------- Barra inferior (móvil, ≤lg) -------------------- */}
      <nav
        className="border-border bg-surface/95 fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="Navegación principal"
      >
        <div className="grid grid-cols-5">
          {NAV.filter((n) => n.movil).map(({ to, label, icono: Icono }) => {
            const badge = badgePara(to)
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-2xs font-medium transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <Icono className="size-5" />
                      {badge && (
                        <span className="bg-whatsapp absolute -top-1 -right-2 grid min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold text-white">
                          {badge}
                        </span>
                      )}
                    </span>
                    {label}
                    {isActive && (
                      <span className="bg-primary absolute inset-x-5 top-0 h-0.5 rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="text-muted-foreground flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 px-1 py-2 text-2xs font-medium"
                aria-label="Más secciones"
              >
                <MoreHorizontal className="size-5" />
                Más
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="mb-2 w-56">
              {NAV.filter((n) => !n.movil).map(({ to, label, icono: Icono }) => (
                <DropdownMenuItem key={to} asChild>
                  <NavLink to={to}>
                    <Icono />
                    {label}
                  </NavLink>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={alternar}>
                {tema === 'claro' ? <Moon /> : <Sun />}
                {tema === 'claro' ? 'Modo oscuro' : 'Modo claro'}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={reiniciar}>
                <RotateCcw />
                Reiniciar datos de ejemplo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </div>
  )
}
