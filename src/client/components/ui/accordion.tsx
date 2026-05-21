'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'

// ─────────────────────────────────────────────────────────────────────────────
// Ícone chevron animado
// ─────────────────────────────────────────────────────────────────────────────

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────

const Accordion = AccordionPrimitive.Root

// ─────────────────────────────────────────────────────────────────────────────
// Item
// ─────────────────────────────────────────────────────────────────────────────

const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={[
      'group border border-slate-200 bg-white rounded-xl',
      'transition-all duration-200',
      'hover:border-slate-300',
      'data-[state=open]:border-slate-300 data-[state=open]:shadow-sm',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
))
AccordionItem.displayName = 'AccordionItem'

// ─────────────────────────────────────────────────────────────────────────────
// Trigger
// ─────────────────────────────────────────────────────────────────────────────

const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={[
        'flex flex-1 items-center justify-between px-6 py-5 text-left',
        'text-[15px] font-medium text-slate-900 leading-snug',
        'transition-colors hover:text-brand-700',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 rounded-xl',
        'min-h-[52px] cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <span className="pr-4">{children}</span>
      <ChevronIcon
        className={[
          'h-5 w-5 shrink-0 text-slate-400',
          'transition-transform duration-300 ease-[cubic-bezier(0.87,0,0.13,1)]',
          'group-data-[state=open]:rotate-180 group-data-[state=open]:text-brand-600',
        ].join(' ')}
      />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = 'AccordionTrigger'

// ─────────────────────────────────────────────────────────────────────────────
// Content
// ─────────────────────────────────────────────────────────────────────────────

const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={[
      'overflow-hidden',
      'data-[state=open]:animate-accordion-down',
      'data-[state=closed]:animate-accordion-up',
    ].join(' ')}
    {...props}
  >
    <div
      className={[
        'px-6 pb-5 text-sm text-slate-600 leading-relaxed',
        'border-t border-slate-100 pt-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = 'AccordionContent'

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
