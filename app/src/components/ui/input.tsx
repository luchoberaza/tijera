import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

const fieldBase =
  'w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 transition-[border-color,box-shadow] duration-200 outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50'

function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn(fieldBase, 'h-11', className)} {...props} />
}

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea className={cn(fieldBase, 'min-h-24 py-2.5 leading-relaxed', className)} {...props} />
}

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        'text-foreground mb-1.5 flex items-center gap-1.5 text-[13px] font-medium',
        className,
      )}
      {...props}
    />
  )
}

function FieldHint({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('text-muted-foreground mt-1.5 text-xs', className)} {...props} />
}

export { Input, Textarea, Label, FieldHint, fieldBase }
