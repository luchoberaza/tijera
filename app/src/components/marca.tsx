import { cn } from '@/lib/utils'

/** Logotipo del producto: tijera trazada, sin depender de una fuente de íconos. */
export function LogoTijera({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn('size-8', className)}
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <g
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary-foreground"
      >
        <circle cx="10.5" cy="22" r="3" />
        <circle cx="21.5" cy="22" r="3" />
        <path d="M12.4 19.9 23.5 8M19.6 19.9 8.5 8" />
      </g>
    </svg>
  )
}

export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoTijera />
      {!compacta && (
        <div className="leading-none">
          <p className="font-display text-[15px] font-bold tracking-tight">Tijera</p>
          <p className="text-muted-foreground mt-0.5 text-2xs">Salón Marié</p>
        </div>
      )}
    </div>
  )
}
