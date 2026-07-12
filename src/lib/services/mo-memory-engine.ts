// MO Memory Engine - Multi-level Memory Management
// Manages Conversation, Business, Operational, and Strategic memory levels

export type MemoryLevel = 'conversation' | 'business' | 'operational' | 'strategic';

export interface MemoryEntry {
  id: string;
  level: MemoryLevel;
  key: string;
  value: any;
  timestamp: Date;
  expiresAt?: Date;
  accessCount: number;
  lastAccessed: Date;
  relevanceScore: number;
}

export interface MemoryQuery {
  level?: MemoryLevel;
  key?: string;
  pattern?: string;
  minRelevance?: number;
  maxAge?: number; // in days
  limit?: number;
}

export interface MemoryContext {
  businessId: string;
  userId: string;
  conversationId?: string;
}

export class MemoryEngine {
  private memories: Map<string, MemoryEntry> = new Map();
  private businessId: string;
  private userId: string;
  
  constructor(businessId: string, userId: string) {
    this.businessId = businessId;
    this.userId = userId;
  }
  
  // Store memory at specific level
  store(level: MemoryLevel, key: string, value: any, ttl?: number): void {
    const id = `${level}:${key}:${Date.now()}`;
    const expiresAt = ttl ? new Date(Date.now() + ttl * 1000) : undefined;
    
    const entry: MemoryEntry = {
      id,
      level,
      key,
      value,
      timestamp: new Date(),
      expiresAt,
      accessCount: 0,
      lastAccessed: new Date(),
      relevanceScore: 1.0,
    };
    
    this.memories.set(id, entry);
    
    // Update relevance score for existing entries
    this.updateRelevanceScores();
  }
  
  // Retrieve memory by key
  retrieve(key: string, level?: MemoryLevel): any {
    const entries = this.query({ key, level, limit: 1 });
    if (entries.length > 0) {
      const entry = entries[0];
      entry.accessCount++;
      entry.lastAccessed = new Date();
      entry.relevanceScore = Math.min(entry.relevanceScore + 0.1, 1.0);
      return entry.value;
    }
    return null;
  }
  
  // Query memories with filters
  query(query: MemoryQuery): MemoryEntry[] {
    let results = Array.from(this.memories.values());
    
    // Filter by level
    if (query.level) {
      results = results.filter(m => m.level === query.level);
    }
    
    // Filter by key
    if (query.key) {
      results = results.filter(m => m.key === query.key);
    }
    
    // Filter by pattern
    if (query.pattern) {
      const regex = new RegExp(query.pattern, 'i');
      results = results.filter(m => regex.test(m.key));
    }
    
    // Filter by relevance score
    if (query.minRelevance) {
      results = results.filter(m => m.relevanceScore >= query.minRelevance!);
    }
    
    // Filter by age
    if (query.maxAge) {
      const cutoffDate = new Date(Date.now() - query.maxAge * 24 * 60 * 60 * 1000);
      results = results.filter(m => m.timestamp >= cutoffDate);
    }
    
    // Remove expired entries
    results = results.filter(m => !m.expiresAt || m.expiresAt > new Date());
    
    // Sort by relevance and recency
    results.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
    
    // Limit results
    if (query.limit) {
      results = results.slice(0, query.limit);
    }
    
    return results;
  }
  
  // Get conversation memory (current discussion)
  getConversationMemory(limit: number = 10): MemoryEntry[] {
    return this.query({ level: 'conversation', limit });
  }
  
  // Get business memory (persistent business information)
  getBusinessMemory(): MemoryEntry[] {
    return this.query({ level: 'business' });
  }
  
  // Get operational memory (recent transactions and activities)
  getOperationalMemory(days: number = 7): MemoryEntry[] {
    return this.query({ level: 'operational', maxAge: days });
  }
  
  // Get strategic memory (goals, plans, expansion)
  getStrategicMemory(): MemoryEntry[] {
    return this.query({ level: 'strategic' });
  }
  
  // Store conversation memory (short-term)
  storeConversation(key: string, value: any, ttl: number = 3600): void {
    this.store('conversation', key, value, ttl);
  }
  
  // Store business memory (long-term)
  storeBusiness(key: string, value: any): void {
    this.store('business', key, value);
  }
  
  // Store operational memory (medium-term)
  storeOperational(key: string, value: any, ttl: number = 604800): void {
    this.store('operational', key, value, ttl); // 7 days default
  }
  
  // Store strategic memory (long-term)
  storeStrategic(key: string, value: any): void {
    this.store('strategic', key, value);
  }
  
  // Update relevance scores based on access patterns
  private updateRelevanceScores(): void {
    const now = new Date();
    this.memories.forEach(entry => {
      // Decay relevance over time
      const daysSinceAccess = (now.getTime() - entry.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
      const decayFactor = Math.exp(-daysSinceAccess / 30); // 30-day half-life
      
      entry.relevanceScore = entry.relevanceScore * decayFactor;
      
      // Boost based on access frequency
      const accessBoost = Math.log(entry.accessCount + 1) * 0.1;
      entry.relevanceScore = Math.min(entry.relevanceScore + accessBoost, 1.0);
    });
  }
  
  // Clean up expired and low-relevance memories
  cleanup(): void {
    const now = new Date();
    const toDelete: string[] = [];
    
    this.memories.forEach((entry, id) => {
      // Delete expired
      if (entry.expiresAt && entry.expiresAt < now) {
        toDelete.push(id);
      }
      // Delete very low relevance (except business and strategic)
      else if (entry.level !== 'business' && entry.level !== 'strategic' && entry.relevanceScore < 0.1) {
        toDelete.push(id);
      }
    });
    
    toDelete.forEach(id => this.memories.delete(id));
  }
  
  // Get memory statistics
  getStats(): Record<string, any> {
    const stats = {
      total: this.memories.size,
      byLevel: {} as Record<string, number>,
      averageRelevance: 0,
      expiredCount: 0,
    };
    
    this.memories.forEach(entry => {
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
      stats.averageRelevance += entry.relevanceScore;
      if (entry.expiresAt && entry.expiresAt < new Date()) {
        stats.expiredCount++;
      }
    });
    
    if (this.memories.size > 0) {
      stats.averageRelevance /= this.memories.size;
    }
    
    return stats;
  }
  
  // Export memories for persistence
  export(): Record<string, any> {
    const exportData: Record<string, any> = {
      businessId: this.businessId,
      userId: this.userId,
      memories: [],
      exportedAt: new Date().toISOString(),
    };
    
    this.memories.forEach(entry => {
      exportData.memories.push({
        id: entry.id,
        level: entry.level,
        key: entry.key,
        value: entry.value,
        timestamp: entry.timestamp.toISOString(),
        expiresAt: entry.expiresAt?.toISOString(),
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed.toISOString(),
        relevanceScore: entry.relevanceScore,
      });
    });
    
    return exportData;
  }
  
  // Import memories from persistence
  import(data: Record<string, any>): void {
    if (data.businessId !== this.businessId || data.userId !== this.userId) {
      throw new Error('Memory data does not match business/user context');
    }
    
    if (data.memories && Array.isArray(data.memories)) {
      data.memories.forEach((mem: any) => {
        const entry: MemoryEntry = {
          id: mem.id,
          level: mem.level,
          key: mem.key,
          value: mem.value,
          timestamp: new Date(mem.timestamp),
          expiresAt: mem.expiresAt ? new Date(mem.expiresAt) : undefined,
          accessCount: mem.accessCount,
          lastAccessed: new Date(mem.lastAccessed),
          relevanceScore: mem.relevanceScore,
        };
        
        this.memories.set(entry.id, entry);
      });
    }
  }
  
  // Clear all memories at a specific level
  clearLevel(level: MemoryLevel): void {
    const toDelete: string[] = [];
    this.memories.forEach((entry, id) => {
      if (entry.level === level) {
        toDelete.push(id);
      }
    });
    toDelete.forEach(id => this.memories.delete(id));
  }
  
  // Clear all memories
  clearAll(): void {
    this.memories.clear();
  }
  
  // Get relevant memories for a query
  getRelevantMemories(query: string, limit: number = 5): MemoryEntry[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    
    // Score memories based on keyword matches
    const scored = Array.from(this.memories.values()).map(entry => {
      let score = 0;
      const keyLower = entry.key.toLowerCase();
      const valueStr = JSON.stringify(entry.value).toLowerCase();
      
      queryWords.forEach(word => {
        if (keyLower.includes(word)) score += 0.5;
        if (valueStr.includes(word)) score += 0.3;
      });
      
      // Boost by relevance score
      score *= entry.relevanceScore;
      
      // Boost by recency
      const daysSince = (Date.now() - entry.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      score *= Math.exp(-daysSince / 30);
      
      return { entry, score };
    });
    
    // Sort by score and return top results
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.entry);
  }
}

// Singleton instances per business
const memoryEngines: Map<string, MemoryEngine> = new Map();

export function getMemoryEngine(businessId: string, userId: string): MemoryEngine {
  const key = `${businessId}:${userId}`;
  if (!memoryEngines.has(key)) {
    memoryEngines.set(key, new MemoryEngine(businessId, userId));
  }
  return memoryEngines.get(key)!;
}

export function clearMemoryEngine(businessId: string, userId: string): void {
  const key = `${businessId}:${userId}`;
  const engine = memoryEngines.get(key);
  if (engine) {
    engine.clearAll();
    memoryEngines.delete(key);
  }
}
