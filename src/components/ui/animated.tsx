'use client'

import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

// ── Fade In quando entra na viewport ─────────────────────────────────────────

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  duration?: number
}

const directionOffsets = {
  up: { y: 24 },
  down: { y: -24 },
  left: { x: 24 },
  right: { x: -24 },
  none: {},
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = 'up',
  duration = 0.5,
}: FadeInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directionOffsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

// ── Stagger de filhos ────────────────────────────────────────────────────────

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
  delay?: number
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
  delay = 0,
}: StaggerContainerProps) {
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  }

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
    >
      {children}
    </motion.div>
  )
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  )
}

// ── Número animado (count up) ────────────────────────────────────────────────

interface CountUpProps {
  value: string
  className?: string
}

export function CountUp({ value, className }: CountUpProps) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {value}
    </motion.span>
  )
}

// ── Banner slider (texto rolando) ────────────────────────────────────────────

interface AnnouncementBannerProps {
  title: string
  text: string
  ctaLabel?: string
  ctaUrl?: string
}

export function AnnouncementBanner({ title, text, ctaLabel, ctaUrl }: AnnouncementBannerProps) {
  return (
    <motion.div
      className="bg-accent-600 text-white"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-center gap-x-3 text-sm flex-wrap">
          <span className="font-semibold">{title}</span>
          <span className="hidden sm:inline text-accent-100" aria-hidden="true">—</span>
          <span className="text-accent-100">{text}</span>
          {ctaLabel && ctaUrl && (
            <a
              href={ctaUrl}
              className="ml-1 inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:text-white/90 transition-colors"
            >
              {ctaLabel}
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Scale on hover (para cards interativos) ──────────────────────────────────

interface ScaleHoverProps {
  children: ReactNode
  className?: string
}

export function ScaleHover({ children, className }: ScaleHoverProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  )
}
