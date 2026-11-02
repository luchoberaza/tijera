import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-[background-color,color,box-shadow,border-color] duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs',
        secondary:
          'bg-surface text-foreground border border-border hover:bg-surface-2 hover:border-primary/40',
        ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
        soft: 'bg-primary-soft text-primary hover:bg-primary-soft/70 dark:text-primary',
        danger: 'bg-danger text-white hover:bg-danger/90 dark:text-[#26120a]',
        success: 'bg-success text-white hover:bg-success/90 dark:text-[#0e2119]',
        whatsapp: 'bg-whatsapp text-white hover:bg-whatsapp/90 dark:text-[#062019]',
        outline: 'border border-border bg-transparent hover:bg-muted text-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-9 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5 text-[13px]',
        lg: 'h-11 rounded-xl px-6 has-[>svg]:px-4',
        icon: 'size-10',
        'icon-sm': 'size-9 rounded-lg',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
}

export { Button, buttonVariants }
