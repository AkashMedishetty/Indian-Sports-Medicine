/**
 * Page transition wrapper component
 * Provides smooth transitions between pages
 */

"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { pageTransition } from "@/conference-backend-core/lib/animations"

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export function FadeTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export function SlideTransition({ 
  children, 
  className,
  direction = "right" 
}: PageTransitionProps & { direction?: "left" | "right" | "up" | "down" }) {
  const pathname = usePathname()
  
  const variants = {
    initial: {
      opacity: 0,
      x: direction === "right" ? 50 : direction === "left" ? -50 : 0,
      y: direction === "down" ? 50 : direction === "up" ? -50 : 0,
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.0, 0.0, 0.2, 1] as const,
      },
    },
    exit: {
      opacity: 0,
      x: direction === "right" ? -50 : direction === "left" ? 50 : 0,
      y: direction === "down" ? -50 : direction === "up" ? 50 : 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0.0, 1, 1] as const,
      },
    },
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}