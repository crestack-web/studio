import * as React from "react"

/**
 * Must match CSS breakpoints used across the app:
 *   @media (max-width: 768px) { ... }
 */
export const MOBILE_BREAKPOINT = 768

function getMobileMql(): MediaQueryList | null {
  if (typeof window === "undefined") return null
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
}

/** One-shot check for click handlers — same query as CSS. */
export function isMobileViewport(): boolean {
  const mql = getMobileMql()
  return mql ? mql.matches : false
}

/** Reactive mobile detection via matchMedia. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    const mql = getMobileMql()
    return mql ? mql.matches : false
  })

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

/**
 * Returns null until the client has measured.
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
