'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

interface StepTransitionProps {
  stepKey: string | number
  /** 1 = avançando (desliza da direita), -1 = voltando (desliza da esquerda). */
  direction: 1 | -1
  children: ReactNode
}

const OFFSET = 24

/** Troca de etapa do wizard — desliza+funde na direção da navegação, em vez do
 * corte seco de conteúdo que fazia a página parecer um formulário estático. */
export function StepTransition({ stepKey, direction, children }: StepTransitionProps) {
  const reduzMovimento = useReducedMotion()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepKey}
        initial={reduzMovimento ? { opacity: 0 } : { opacity: 0, x: direction * OFFSET }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduzMovimento ? { opacity: 0 } : { opacity: 0, x: direction * -OFFSET }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
