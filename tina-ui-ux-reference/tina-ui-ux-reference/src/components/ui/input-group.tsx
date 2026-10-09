import * as React from 'react'
import { cn } from '@/lib/utils'

export function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring/40',
        className,
      )}
      {...props}
    />
  )
}

export function InputGroupAddon({
  className,
  align: _align,
  ...props
}: React.ComponentProps<'div'> & { align?: string }) {
  return <div className={cn('flex shrink-0 items-center text-muted-foreground', className)} {...props} />
}

export function InputGroupInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn('h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground', className)}
      {...props}
    />
  )
}
