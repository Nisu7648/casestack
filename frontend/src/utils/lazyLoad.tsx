import React, { lazy, Suspense, ComponentType } from 'react'
import { SkeletonPage } from '../components/ui/Skeleton'

/**
 * Lazy loading utilities for code splitting and performance
 */

/**
 * Lazy load a component with automatic retry on failure
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): React.LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptImport = (retriesLeft: number) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft === 0) {
              reject(error)
              return
            }

            console.warn(
              `Failed to load component. Retrying... (${retriesLeft} attempts left)`
            )

            setTimeout(() => {
              attemptImport(retriesLeft - 1)
            }, interval)
          })
      }

      attemptImport(retries)
    })
  })
}

/**
 * Lazy load with preload capability
 */
export function lazyWithPreload<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(componentImport)
  
  // Add preload method
  ;(LazyComponent as any).preload = componentImport

  return LazyComponent as React.LazyExoticComponent<T> & {
    preload: () => Promise<{ default: T }>
  }
}

/**
 * Lazy load with custom fallback
 */
export function lazyWithFallback<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <SkeletonPage />
): React.FC {
  const LazyComponent = lazy(componentImport)

  return (props: any) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

/**
 * Preload a lazy component
 */
export function preloadComponent<T extends ComponentType<any>>(
  component: React.LazyExoticComponent<T> & { preload?: () => Promise<any> }
): void {
  if (component.preload) {
    component.preload()
  }
}

/**
 * Lazy load multiple components
 */
export function lazyLoadMultiple<T extends Record<string, () => Promise<any>>>(
  imports: T
): {
  [K in keyof T]: React.LazyExoticComponent<
    T[K] extends () => Promise<{ default: infer C }> ? C : never
  >
} {
  const result: any = {}

  for (const [key, importFn] of Object.entries(imports)) {
    result[key] = lazy(importFn)
  }

  return result
}

/**
 * Lazy load with timeout
 */
export function lazyWithTimeout<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  timeout = 10000
): React.LazyExoticComponent<T> {
  return lazy(() => {
    return Promise.race([
      componentImport(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Component load timeout'))
        }, timeout)
      }),
    ])
  })
}

/**
 * Create a lazy route component with loading state
 */
export function createLazyRoute<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  options: {
    fallback?: React.ReactNode
    retries?: number
    timeout?: number
  } = {}
): React.FC {
  const {
    fallback = <SkeletonPage />,
    retries = 3,
    timeout = 10000,
  } = options

  let LazyComponent: React.LazyExoticComponent<T>

  if (retries > 0) {
    LazyComponent = lazyWithRetry(componentImport, retries)
  } else if (timeout > 0) {
    LazyComponent = lazyWithTimeout(componentImport, timeout)
  } else {
    LazyComponent = lazy(componentImport)
  }

  return (props: any) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

/**
 * Intersection Observer based lazy loading for images
 */
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = React.useState(placeholder || '')
  const [isLoaded, setIsLoaded] = React.useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px',
      }
    )

    observer.observe(imgRef.current)

    return () => {
      observer.disconnect()
    }
  }, [src])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  return {
    imgRef,
    imageSrc,
    isLoaded,
    handleLoad,
  }
}

/**
 * Lazy Image component
 */
export const LazyImage: React.FC<{
  src: string
  alt: string
  placeholder?: string
  className?: string
}> = ({ src, alt, placeholder, className = '' }) => {
  const { imgRef, imageSrc, isLoaded, handleLoad } = useLazyImage(src, placeholder)

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      onLoad={handleLoad}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      loading="lazy"
    />
  )
}

/**
 * Prefetch resources
 */
export function prefetchResource(url: string, type: 'script' | 'style' | 'image' = 'script') {
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.as = type
  link.href = url
  document.head.appendChild(link)
}

/**
 * Preload critical resources
 */
export function preloadResource(url: string, type: 'script' | 'style' | 'image' = 'script') {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = type
  link.href = url
  document.head.appendChild(link)
}

export default {
  lazyWithRetry,
  lazyWithPreload,
  lazyWithFallback,
  lazyWithTimeout,
  preloadComponent,
  lazyLoadMultiple,
  createLazyRoute,
  useLazyImage,
  LazyImage,
  prefetchResource,
  preloadResource,
}
