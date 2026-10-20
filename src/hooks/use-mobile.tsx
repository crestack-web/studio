import * as React from "react"

/**
 * Must match CSS breakpoints used across the app:
 *   @media (max-width: 768px) { ... }
 *
 * Safari (esp. iOS) is unreliable with a single signal:
 * - address bar show/hide changes layout vs visual viewport
 * - matchMedia alone can lag on orientationchange
 * - innerWidth can disagree with CSS mq during chrome transitions
 */
export const MOBILE_BREAKPOINT = 768

function getMobileMql(): MediaQueryList | null {
  if (typeof window === "undefined") return null
  try {
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
  } catch {
    return null
  }
}

/** Layout / visual width Safari actually paints with */
function getViewportWidth(): number {
  if (typeof window === "undefined") return MOBILE_BREAKPOINT + 1
  const vv = window.visualViewport
  if (vv && typeof vv.width === "number" && vv.width > 0) {
    return vv.width
  }
  const doc = document.documentElement
  if (doc && doc.clientWidth > 0) return doc.clientWidth
  return window.innerWidth || MOBILE_BREAKPOINT + 1
}

/**
 * Safari-safe mobile check. Prefer matchMedia (same as CSS), then width fallbacks.
 * Never rely on userAgent alone — desktop Safari on Mac should stay desktop.
 */
export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false

  const mql = getMobileMql()
  if (mql && mql.matches) return true

  // Fallback when mq is false but width is still phone-sized (Safari chrome glitches)
  const w = getViewportWidth()
  if (w <= MOBILE_BREAKPOINT) return true

  // iPhone / iPod in landscape can report >768 on the long edge while still
  // being a phone UI — only treat as mobile if the *short* edge is phone-sized
  // and the device has coarse pointer (touch).
  try {
    const coarse = window.matchMedia("(pointer: coarse)").matches
    const shortEdge = Math.min(
      getViewportWidth(),
      window.visualViewport?.height || window.innerHeight || 0
    )
    if (coarse && shortEdge > 0 && shortEdge <= MOBILE_BREAKPOINT) return true
  } catch {
    /* ignore */
  }

  return false
}

function subscribeViewport(onChange: () => void): () => void {
  const mql = getMobileMql()
  const cleanups: Array<() => void> = []

  if (mql) {
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange)
      cleanups.push(() => mql.removeEventListener("change", onChange))
    } else {
      // Safari < 14
      mql.addListener(onChange)
      cleanups.push(() => mql.removeListener(onChange))
    }
  }

  // Safari iOS: address bar / rotate often fires these without mq change
  window.addEventListener("resize", onChange, { passive: true })
  window.addEventListener("orientationchange", onChange, { passive: true })
  cleanups.push(() => {
    window.removeEventListener("resize", onChange)
    window.removeEventListener("orientationchange", onChange)
  })

  const vv = window.visualViewport
  if (vv) {
    vv.addEventListener("resize", onChange)
    vv.addEventListener("scroll", onChange)
    cleanups.push(() => {
      vv.removeEventListener("resize", onChange)
      vv.removeEventListener("scroll", onChange)
    })
  }

  return () => cleanups.forEach((fn) => fn())
}

/** Reactive mobile detection — Safari-aware */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => isMobileViewport())

  React.useEffect(() => {
    const onChange = () => setIsMobile(isMobileViewport())
    onChange()
    // rAF + short timeout: Safari sometimes reports desktop width on first tick
    const raf = requestAnimationFrame(onChange)
    const t = window.setTimeout(onChange, 100)
    const unsub = subscribeViewport(onChange)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t)
      unsub()
    }
  }, [])

  return isMobile
}

/**
 * null until measured — avoid wrong redirects on first paint (Safari especially).
 */
export function useIsMobileStrict(): boolean | null {
  const [isMobile, setIsMobile] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const onChange = () => setIsMobile(isMobileViewport())
    onChange()
    const raf = requestAnimationFrame(onChange)
    const t = window.setTimeout(onChange, 100)
    const unsub = subscribeViewport(onChange)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t)
      unsub()
    }
  }, [])

  return isMobile
}
