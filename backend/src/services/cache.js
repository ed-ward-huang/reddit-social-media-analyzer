const NodeCache = require('node-cache');
const config = require('../config');

class CacheService {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: config.CACHE_TTL,
      checkperiod: 600,
      useClones: false
    });
  }

  generateKey(cacheKey, platform, limit) {
    return `${platform}:${cacheKey}:${limit}`;
  }

  get(cacheKey, platform, limit) {
    const key = this.generateKey(cacheKey, platform, limit);
    const cached = this.cache.get(key);
    
    if (cached) {
      console.log(`Cache hit for key: ${key}`);
      return cached;
    }
    
    console.log(`Cache miss for key: ${key}`);
    return null;
  }

  set(cacheKey, platform, limit, data) {
    const key = this.generateKey(cacheKey, platform, limit);
    console.log(`Caching data for key: ${key}`);
    return this.cache.set(key, data);
  }

  delete(cacheKey, platform, limit) {
    const key = this.generateKey(cacheKey, platform, limit);
    return this.cache.del(key);
  }

  flush() {
    return this.cache.flushAll();
  }

  getStats() {
    return this.cache.getStats();
  }

  getTTL(cacheKey, platform, limit) {
    const key = this.generateKey(cacheKey, platform, limit);
    return this.cache.getTtl(key);
  }

  // Get cache entries with metadata for display
  getCacheEntries() {
    const keys = this.cache.keys();
    const entries = [];
    const seen = new Set();
    
    keys.forEach(key => {
      const parts = key.split(':');
      if (parts.length >= 3) {
        const platform = parts[0];
        const cacheKey = parts[1];
        const limit = parts[2];
        
        // Prevent duplicates
        const uniqueId = `${platform}:${cacheKey}`;
        
        if (!seen.has(uniqueId)) {
          seen.add(uniqueId);
          entries.push({
            platform,
            cacheKey,
            limit,
            fullKey: key,
            ttl: this.cache.getTtl(key),
            timestamp: this.cache.get(key)?.query_info?.timestamp
          });
        }
      }
    });
    
    // Sort by timestamp
    return entries.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp) : new Date(0);
      const timeB = b.timestamp ? new Date(b.timestamp) : new Date(0);
      return timeB - timeA;
    }).slice(0, 6);
  }

  keys() {
    return this.cache.keys();
  }
}

module.exports = new CacheService();