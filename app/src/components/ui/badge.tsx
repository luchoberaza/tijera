import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-semibold whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        neutral: 'bg-muted text-muted-foreground border-transparent',
        primary: 'bg-primary-soft text-primary border-transparent',
        success: 'bg-success-soft text-success border-transparent',
        warning: 'bg-warning-soft text-warning border-transparent',
        danger: 'bg-danger-soft text-danger border-transparent',
        info: 'bg-info-soft text-info border-transparent',
        whatsapp: 'bg-whatsapp-soft text-whatsapp border-transparent',
        outline: 'border-border text-muted-foreground bg-transparent',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
