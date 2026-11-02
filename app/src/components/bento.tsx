import * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Celda del bento. `orden` escalona la animación de entrada para que la
 * grilla se arme de a poco en vez de aparecer de golpe.
 */
export function Tile({
  className,
  orden = 0,
  interactive,
  children,
  ...props
}: React.ComponentProps<'div'> & { orden?: number; interactive?: boolean }) {
  return (
    <Card
      interactive={interactive}
      className={cn('animate-tile-in flex flex-col', className)}
      style={{ animationDelay: `${Math.min(orden, 12) * 35}ms` }}
      {...props}
    >
      {children}
    </Card>
  )
}

export function TileHeader({
  titulo,
  descripcion,
  icono: Icono,
  accion,
  className,
}: {
  titulo: string
  descripcion?: string
  icono?: React.ComponentType<{ className?: string }>
  accion?: { label: string; to: string }
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-5 pt-5 pb-3', className)}>
      <div className="min-w-0">
        <h2 className="font-display flex items-center gap-2 text-[15px] leading-tight font-semibold">
          {Icono && <Icono className="text-muted-foreground size-4 shrink-0" />}
          {titulo}
        </h2>
        {descripcion && (
          <p className="text-muted-foreground mt-0.5 text-2xs leading-relaxed">{descripcion}</p>
        )}
      </div>
      {accion && (
        <Link
          to={accion.to}
          className="text-muted-foreground hover:text-primary inline-flex shrink-0 items-center gap-1 text-2xs font-semibold transition-colors"
        >
          {accion.label}
          <ArrowUpRight className="size-3" />
        </Link>
      )}
    </div>
  )
}

/** Métrica grande con etiqueta y detalle secundario. */
export function Kpi({
  valor,
  etiqueta,
  detalle,
  icono: Icono,
  tono = 'neutral',
  className,
}: {
  valor: React.ReactNode
  etiqueta: string
  detalle?: React.ReactNode
  icono?: React.ComponentType<{ className?: string }>
  tono?: 'neutral' | 'primary' | 'success' | 'warning' | 'whatsapp'
  className?: string
}) {
  const tonos = {
    neutral: 'bg-muted text-muted-foreground',
    primary: 'bg-primary-soft text-primary',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    whatsapp: 'bg-whatsapp-soft text-whatsapp',
  }

  return (
    <div className={cn('flex h-full flex-col justify-between gap-3 p-5', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-2xs font-semibold tracking-wide uppercase">
          {etiqueta}
        </p>
        {Icono && (
          <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', tonos[tono])}>
            <Icono className="size-4" />
          </span>
        )}
      </div>
      <div>
        <p className="font-display tabular text-3xl leading-none font-bold">{valor}</p>
        {detalle && <div className="text-muted-foreground mt-2 text-xs">{detalle}</div>}
      </div>
    </div>
  )
}
