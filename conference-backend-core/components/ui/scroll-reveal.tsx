/**
 * Scroll reveal component for animations on scroll
 */

"use client"

import { motion } from "framer-motion"
import { useScrollAnimation } from "@/conference-backend-core/hooks/use-scroll-animation"
import { scrollReveal, staggerContainer, staggerItem } from "@/conference-backend-core/lib/animations"

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  threshold?: number
  triggerOnce?: boolean
  direction?: "up" | "down" | "left" | "right" | "scale"
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  threshold = 0.1,
  triggerOnce = true,
  direction = "up",
}: ScrollRevealProps) {
  const { ref, isInView } = useScrollAnimation({ threshold, triggerOnce })

  const variants = {
    initial: {
      opacity: 0,
      y: direction === "up" ? 50 : direction === "down" ? -50 : 0,
      x: direction === "left" ? 50 : direction === "right" ? -50 : 0,
      scale: direction === "scale" ? 0.8 : 1,
    },
    animate: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        delay,
        ease: [0.0, 0.0, 0.2, 1] as const,
      },
    },
  }

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      variants={variants}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ScrollRevealStagger({
  children,
  className,
  staggerDelay = 0.1,
  threshold = 0.1,
  triggerOnce = true,
}: {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  threshold?: number
  triggerOnce?: boolean
}) {
  const { ref, isInView } = useScrollAnimation({ threshold, triggerOnce })

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      variants={staggerContainer}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ScrollRevealItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  )
}

export function ParallaxScroll({
  children,
  speed = 0.5,
  className,
}: {
  children: React.ReactNode
  speed?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      style={{
        y: `${speed * 100}%`,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  )
}