import { useEffect, useRef, useCallback } from 'react'

/**
 * Debounce function - delays execution until after wait time has elapsed
 * Perfect for search inputs, resize handlers, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function - ensures function is called at most once per wait time
 * Perfect for scroll handlers, mouse move, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, wait)
    }
  }
}

/**
 * React hook for debounced values
 * Usage: const debouncedSearch = useDebounce(searchTerm, 500)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * React hook for debounced callbacks
 * Usage: const debouncedSearch = useDebouncedCallback(handleSearch, 500)
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  )
}

/**
 * React hook for throttled callbacks
 * Usage: const throttledScroll = useThrottledCallback(handleScroll, 200)
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()

      if (now - lastRan.current >= delay) {
        callbackRef.current(...args)
        lastRan.current = now
      }
    },
    [delay]
  )
}

/**
 * Debounce with leading edge option
 * Executes immediately on first call, then debounces subsequent calls
 */
export function debounceLeading<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  let lastCallTime = 0

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now()

    if (now - lastCallTime > wait) {
      func(...args)
      lastCallTime = now
    }

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
      lastCallTime = Date.now()
    }, wait)
  }
}

export default {
  debounce,
  throttle,
  useDebounce,
  useDebouncedCallback,
  useThrottledCallback,
  debounceLeading,
}
