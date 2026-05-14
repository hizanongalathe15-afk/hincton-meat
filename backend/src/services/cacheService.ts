import Redis from 'ioredis'

type CacheEntry = {
  value: string
  expiresAt: number
}

class CacheService {
  private redis: Redis | null = null
  private memory = new Map<string, CacheEntry>()

  constructor() {
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL
    if (!redisUrl) return

    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    })

    this.redis.on('error', (error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Redis cache unavailable, using memory fallback:', error.message)
      }
    })
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redis) {
        const value = await this.redis.get(key)
        return value ? JSON.parse(value) as T : null
      }
    } catch {
      this.redis = null
    }

    const entry = this.memory.get(key)
    if (!entry) return null
    if (entry.expiresAt <= Date.now()) {
      this.memory.delete(key)
      return null
    }
    return JSON.parse(entry.value) as T
  }

  async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
    const serialized = JSON.stringify(value)
    try {
      if (this.redis) {
        await this.redis.set(key, serialized, 'EX', ttlSeconds)
        return
      }
    } catch {
      this.redis = null
    }

    this.memory.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  async remember<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) return cached

    const value = await loader()
    await this.set(key, value, ttlSeconds)
    return value
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    try {
      if (this.redis) {
        let cursor = '0'
        do {
          const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100)
          cursor = nextCursor
          if (keys.length) await this.redis.del(...keys)
        } while (cursor !== '0')
        return
      }
    } catch {
      this.redis = null
    }

    for (const key of this.memory.keys()) {
      if (key.startsWith(prefix)) this.memory.delete(key)
    }
  }
}

export const cacheService = new CacheService()
