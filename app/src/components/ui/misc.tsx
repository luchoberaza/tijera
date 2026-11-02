import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

/* ---------------------------------- Tabs --------------------------------- */

const Tabs = TabsPrimitive.Root

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-11 w-full items-center gap-1 overflow-x-auto rounded-xl p-1 sm:w-auto',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-xs inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-200 sm:flex-none [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  )
}

const TabsContent = TabsPrimitive.Content

/* -------------------------------- Tooltip -------------------------------- */

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'bg-espresso z-50 max-w-64 rounded-lg px-2.5 py-1.5 text-xs font-medium text-cream shadow-lift data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 dark:bg-surface-2 dark:text-foreground dark:border dark:border-border',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}

/* --------------------------------- Avatar -------------------------------- */

function Avatar({
  className,
  name,
  color,
  size = 'md',
}: {
  className?: string
  name: string
  color?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const sizes = {
    sm: 'size-8 text-[11px]',
    md: 'size-10 text-[13px]',
    lg: 'size-12 text-sm',
    xl: 'size-16 text-lg',
  }

  return (
    <AvatarPrimitive.Root
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold select-none',
        sizes[size],
        !color && 'bg-primary-soft text-primary',
        className,
      )}
      style={color ? { backgroundColor: `${color}22`, color } : undefined}
    >
      <AvatarPrimitive.Fallback delayMs={0} aria-label={name}>
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}

/* --------------------------------- Switch -------------------------------- */

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'data-[state=checked]:bg-primary data-[state=unchecked]:bg-border focus-visible:outline-ring peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 data-[state=checked]:translate-x-[1.375rem]" />
    </SwitchPrimitive.Root>
  )
}

/* ------------------------------- Separator ------------------------------- */

function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      className={cn(
        'bg-border shrink-0',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  )
}

/* -------------------------------- Popover -------------------------------- */

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger

function PopoverContent({
  className,
  align = 'start',
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'bg-surface border-border shadow-lift z-50 rounded-xl border p-4 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

/* -------------------------------- Progress ------------------------------- */

function Progress({
  value = 0,
  className,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  return (
    <ProgressPrimitive.Root
      value={value}
      className={cn('bg-muted relative h-2 w-full overflow-hidden rounded-full', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('bg-primary h-full rounded-full transition-[width] duration-500 ease-out', indicatorClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

/* ------------------------------ Empty state ------------------------------ */

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="bg-muted text-muted-foreground mb-4 grid size-14 place-items-center rounded-2xl">
        <Icon className="size-6" />
      </div>
      <p className="font-display text-foreground text-base font-semibold">{title}</p>
      {description && (
        <p className="text-muted-foreground mt-1.5 max-w-sm text-[13px] leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Avatar,
  Switch,
  Separator,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Progress,
  EmptyState,
}
