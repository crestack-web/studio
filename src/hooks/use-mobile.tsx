import * as React from "react"

/**
 * Must match CSS breakpoints used across the app:
 *   @media (max-width: 768px) { ... }
 * Using 767 (breakpoint - 1) caused JS to treat 768px as desktop while CSS
 * still applied mobile styles — and the opposite off-by-one on some devices.
 */
export const MOBILE_BREAKPOINT = 768

function getMobileMql(): MediaQueryList | null {
  if (typeof window === "undefined") return null
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
}

/**
 * Reactive mobile detection via matchMedia (not a one-shot innerWidth read).
 * - null while unknown (SSR / before mount) so callers can avoid wrong redirects
 * - boolean after first client measurement
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Client first paint: read immediately so we don't flash desktop layout
    const mql = getMobileMql()
    return mql ? mql.matches : false
  })

  React.useEffect(() => {
    const mql = getMobileMql()
    if (!mql) return

    const onChange = () => setIsMobile(mql.matches)
    onChange()

    // Modern API
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }

    // Safari < 14
    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [])

  return isMobile
}

/**
 * Same as useIsMobile but returns null until the client has measured.
 * Use when a wrong early value would navigate to the wrong page.
 */
export function useIsMobileStrict(): boolean | null {
  const [isMobile, setIsMobile] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const mql = getMobileMql()
    if (!mql) return

    const onChange = () => setIsMobile(mql.matches)
    onChange()

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }

    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [])

  return isMobile
}
