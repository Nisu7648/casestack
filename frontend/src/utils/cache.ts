/**
 * Caching utilities for performance optimization
 * Includes memory cache, localStorage cache, and React Query helpers
 */

// ============================================
// MEMORY CACHE
// ============================================

interface CacheItem<T> {
  value: T
  expiry: number
}

class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map()

  /**
   * Set a value in cache with optional TTL (time to live)
   */
  set<T>(key: string, value: T, ttl: number = 5 * 60 * 1000): void {
    const expiry = Date.now() + ttl
    this.cache.set(key, { value, expiry })
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value as T
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear expired items
   */
  clearExpired(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
}

// Export singleton instance
export const memoryCache = new MemoryCache()

// Auto-clear expired items every 5 minutes
setInterval(() => {
  memoryCache.clearExpired()
}, 5 * 60 * 1000)

// ============================================
// LOCAL STORAGE CACHE
// ============================================

class LocalStorageCache {
  private prefix: string = 'legalstack_'

  /**
   * Set a value in localStorage with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): void {
    try {
      const item = {
        value,
        expiry: ttl ? Date.now() + ttl : null,
      }
      localStorage.setItem(this.prefix + key, JSON.stringify(item))
    } catch (error) {
      console.error('LocalStorage set error:', error)
    }
  }

  /**
   * Get a value from localStorage
   */
  get<T>(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(this.prefix + key)

      if (!itemStr) {
        return null
      }

      const item = JSON.parse(itemStr)

      // Check if expired
      if (item.expiry && Date.now() > item.expiry) {
        this.delete(key)
        return null
      }

      return item.value as T
    } catch (error) {
      console.error('LocalStorage get error:', error)
      return null
    }
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Delete a key from localStorage
   */
  delete(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key)
    } catch (error) {
      console.error('LocalStorage delete error:', error)
    }
  }

  /**
   * Clear all cache with prefix
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('LocalStorage clear error:', error)
    }
  }

  /**
   * Clear expired items
   */
  clearExpired(): void {
    try {
      const keys = Object.keys(localStorage)
      const now = Date.now()

      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          const itemStr = localStorage.getItem(key)
          if (itemStr) {
            const item = JSON.parse(itemStr)
            if (item.expiry && now > item.expiry) {
              localStorage.removeItem(key)
            }
          }
        }
      })
    } catch (error) {
      console.error('LocalStorage clearExpired error:', error)
    }
  }
}

// Export singleton instance
export const localStorageCache = new LocalStorageCache()

// ============================================
// MEMOIZATION
// ============================================

/**
 * Memoize a function with cache
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    ttl?: number
    maxSize?: number
    keyGenerator?: (...args: Parameters<T>) => string
  } = {}
): T {
  const { ttl = 5 * 60 * 1000, maxSize = 100, keyGenerator } = options
  const cache = new Map<string, CacheItem<ReturnType<T>>>()

  return ((...args: Parameters<T>) => {
    // Generate cache key
    const key = keyGenerator
      ? keyGenerator(...args)
      : JSON.stringify(args)

    // Check cache
    const cached = cache.get(key)
    if (cached && Date.now() < cached.expiry) {
      return cached.value
    }

    // Execute function
    const result = fn(...args)

    // Store in cache
    cache.set(key, {
      value: result,
      expiry: Date.now() + ttl,
    })

    // Limit cache size
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }

    return result
  }) as T
}

// ============================================
// REACT QUERY HELPERS
// ============================================

/**
 * Default React Query cache times
 */
export const queryCacheTimes = {
  short: 1 * 60 * 1000, // 1 minute
  medium: 5 * 60 * 1000, // 5 minutes
  long: 30 * 60 * 1000, // 30 minutes
  veryLong: 60 * 60 * 1000, // 1 hour
}

/**
 * Default React Query stale times
 */
export const queryStaleTime = {
  instant: 0, // Always stale
  short: 30 * 1000, // 30 seconds
  medium: 2 * 60 * 1000, // 2 minutes
  long: 10 * 60 * 1000, // 10 minutes
}

/**
 * Create query key with cache busting
 */
export function createQueryKey(
  base: string | string[],
  params?: Record<string, any>
): (string | Record<string, any>)[] {
  const baseArray = Array.isArray(base) ? base : [base]
  return params ? [...baseArray, params] : baseArray
}

/**
 * Invalidate query cache by pattern
 */
export function invalidateQueriesByPattern(
  queryClient: any,
  pattern: string | RegExp
): void {
  const queryCache = queryClient.getQueryCache()
  const queries = queryCache.getAll()

  queries.forEach((query: any) => {
    const queryKey = query.queryKey
    const keyString = JSON.stringify(queryKey)

    if (typeof pattern === 'string') {
      if (keyString.includes(pattern)) {
        queryClient.invalidateQueries(queryKey)
      }
    } else {
      if (pattern.test(keyString)) {
        queryClient.invalidateQueries(queryKey)
      }
    }
  })
}

// ============================================
// IMAGE CACHE
// ============================================

/**
 * Preload and cache images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * Preload multiple images
 */
export async function preloadImages(srcs: string[]): Promise<void> {
  await Promise.all(srcs.map(preloadImage))
}

// ============================================
// API RESPONSE CACHE
// ============================================

interface ApiCacheOptions {
  ttl?: number
  storage?: 'memory' | 'localStorage'
}

/**
 * Cache API responses
 */
export function cacheApiResponse<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: ApiCacheOptions = {}
): Promise<T> {
  const { ttl = 5 * 60 * 1000, storage = 'memory' } = options
  const cache = storage === 'localStorage' ? localStorageCache : memoryCache

  // Check cache
  const cached = cache.get<T>(key)
  if (cached) {
    return Promise.resolve(cached)
  }

  // Fetch and cache
  return fetcher().then((data) => {
    cache.set(key, data, ttl)
    return data
  })
}

export default {
  memoryCache,
  localStorageCache,
  memoize,
  queryCacheTimes,
  queryStaleTime,
  createQueryKey,
  invalidateQueriesByPattern,
  preloadImage,
  preloadImages,
  cacheApiResponse,
}
