/**
 * Accessibility hooks and utilities
 */

import { useEffect, useState, useRef } from "react"

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return prefersReducedMotion
}

export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: high)")
    setPrefersHighContrast(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return prefersHighContrast
}

export function useFocusManagement() {
  const [focusedElement, setFocusedElement] = useState<Element | null>(null)

  useEffect(() => {
    const handleFocus = (event: FocusEvent) => {
      setFocusedElement(event.target as Element)
    }

    const handleBlur = () => {
      setFocusedElement(null)
    }

    document.addEventListener("focus", handleFocus, true)
    document.addEventListener("blur", handleBlur, true)

    return () => {
      document.removeEventListener("focus", handleFocus, true)
      document.removeEventListener("blur", handleBlur, true)
    }
  }, [])

  const focusElement = (element: HTMLElement | null) => {
    if (element) {
      element.focus()
    }
  }

  const focusFirstFocusableElement = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    if (firstElement) {
      firstElement.focus()
    }
  }

  const focusLastFocusableElement = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    if (lastElement) {
      lastElement.focus()
    }
  }

  return {
    focusedElement,
    focusElement,
    focusFirstFocusableElement,
    focusLastFocusableElement,
  }
}

export function useKeyboardNavigation(
  onEscape?: () => void,
  onEnter?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          onEscape?.()
          break
        case "Enter":
          onEnter?.()
          break
        case "ArrowUp":
          event.preventDefault()
          onArrowUp?.()
          break
        case "ArrowDown":
          event.preventDefault()
          onArrowDown?.()
          break
        case "ArrowLeft":
          onArrowLeft?.()
          break
        case "ArrowRight":
          onArrowRight?.()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight])
}

export function useScreenReader() {
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false)

  useEffect(() => {
    // Detect screen reader by checking for specific accessibility features
    const hasScreenReader = Boolean(
      window.navigator.userAgent.includes("NVDA") ||
      window.navigator.userAgent.includes("JAWS") ||
      window.speechSynthesis ||
      // @ts-ignore
      window.navigator.tts ||
      document.querySelector("[aria-live]") !== null
    )

    setIsScreenReaderActive(hasScreenReader)
  }, [])

  const announce = (message: string, priority: "polite" | "assertive" = "polite") => {
    const announcement = document.createElement("div")
    announcement.setAttribute("aria-live", priority)
    announcement.setAttribute("aria-atomic", "true")
    announcement.className = "sr-only"
    announcement.textContent = message

    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  return { isScreenReaderActive, announce }
}

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    // Focus the first element when trap becomes active
    if (firstElement) {
      firstElement.focus()
    }

    document.addEventListener("keydown", handleTabKey)
    return () => document.removeEventListener("keydown", handleTabKey)
  }, [isActive])

  return containerRef
}

export function useAriaLiveRegion() {
  const [liveRegion, setLiveRegion] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const region = document.createElement("div")
    region.setAttribute("aria-live", "polite")
    region.setAttribute("aria-atomic", "true")
    region.className = "sr-only"
    document.body.appendChild(region)
    setLiveRegion(region)

    return () => {
      if (region.parentNode) {
        region.parentNode.removeChild(region)
      }
    }
  }, [])

  const announce = (message: string) => {
    if (liveRegion) {
      liveRegion.textContent = message
      setTimeout(() => {
        liveRegion.textContent = ""
      }, 1000)
    }
  }

  return announce
}

export function useColorContrastChecker() {
  const checkContrast = (foreground: string, background: string): number => {
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    }

    // Calculate relative luminance
    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
    }

    const fg = hexToRgb(foreground)
    const bg = hexToRgb(background)

    if (!fg || !bg) return 0

    const fgLuminance = getLuminance(fg.r, fg.g, fg.b)
    const bgLuminance = getLuminance(bg.r, bg.g, bg.b)

    const lighter = Math.max(fgLuminance, bgLuminance)
    const darker = Math.min(fgLuminance, bgLuminance)

    return (lighter + 0.05) / (darker + 0.05)
  }

  const meetsWCAG = (contrast: number, level: "AA" | "AAA" = "AA", size: "normal" | "large" = "normal") => {
    if (level === "AA") {
      return size === "large" ? contrast >= 3 : contrast >= 4.5
    } else {
      return size === "large" ? contrast >= 4.5 : contrast >= 7
    }
  }

  return { checkContrast, meetsWCAG }
}