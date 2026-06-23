/**
 * Custom hook for scroll-based animations
 * Provides intersection observer functionality for reveal animations
 */

import { useEffect, useRef, useState } from "react"
import { useInView } from "framer-motion"

interface UseScrollAnimationOptions {
  threshold?: number
  triggerOnce?: boolean
  rootMargin?: string
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const {
    threshold = 0.1,
    triggerOnce = true,
    rootMargin = "0px 0px -100px 0px"
  } = options

  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, {
    once: triggerOnce,
    margin: rootMargin as any,
    amount: threshold,
  })

  return { ref, isInView }
}

export function useScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollPx = document.documentElement.scrollTop
      const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scrolled = scrollPx / winHeightPx
      setScrollProgress(scrolled)
    }

    window.addEventListener("scroll", updateScrollProgress)
    return () => window.removeEventListener("scroll", updateScrollProgress)
  }, [])

  return scrollProgress
}

export function useParallax(speed: number = 0.5) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const updateOffset = () => {
      setOffset(window.pageYOffset * speed)
    }

    window.addEventListener("scroll", updateOffset)
    return () => window.removeEventListener("scroll", updateOffset)
  }, [speed])

  return offset
}