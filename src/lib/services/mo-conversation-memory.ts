// MO Conversation Memory System - Avoid repetition in conversation
// Never repeat previously established facts unnecessarily

export interface ConversationMemory {
  establishedFacts: Fact[];
  discussedTopics: Topic[];
  userPreferences: Preference[];
  conversationFlow: FlowEvent[];
}

export interface Fact {
  content: string;
  category: string;
  establishedAt: Date;
  lastMentioned: Date;
  mentionCount: number;
  importance: number; // 0-1
  confidence: number; // 0-1
}

export interface Topic {
  name: string;
  firstDiscussed: Date;
  lastDiscussed: Date;
  discussionCount: number;
  relatedFacts: string[];
  status: 'active' | 'resolved' | 'deferred';
}

export interface Preference {
  type: string;
  value: string;
  detectedAt: Date;
  confidence: number;
}

export interface FlowEvent {
  type: 'question' | 'statement' | 'action' | 'insight' | 'recommendation';
  content: string;
  timestamp: Date;
  importance: number;
}

export interface MemoryContext {
  businessId: string;
  conversationId: string;
  currentMessage: string;
  timestamp: Date;
}

export class ConversationMemoryEngine {
  private memories: Map<string, ConversationMemory> = new Map();
  
  // Get or create memory for conversation
  getMemory(context: MemoryContext): ConversationMemory {
    const key = `${context.businessId}:${context.conversationId}`;
    
    if (!this.memories.has(key)) {
      this.memories.set(key, {
        establishedFacts: [],
        discussedTopics: [],
        userPreferences: [],
        conversationFlow: [],
      });
    }
    
    return this.memories.get(key)!;
  }
  
  // Extract and store facts from message
  extractFacts(message: string, context: MemoryContext): Fact[] {
    const memory = this.getMemory(context);
    const newFacts: Fact[] = [];
    
    // Simple fact extraction patterns
    const patterns = [
      { regex: /sold (\d+) (.+?) for ₦?([\d,]+)/, category: 'sales', importance: 0.8 },
      { regex: /bought (\d+) (.+?) for ₦?([\d,]+)/, category: 'purchases', importance: 0.8 },
      { regex: /have ₦?([\d,]+)/, category: 'cash', importance: 0.7 },
      { regex: /profit is ₦?([\d,]+)/, category: 'profit', importance: 0.9 },
      { regex: /inventory of (.+?) is (\d+)/, category: 'inventory', importance: 0.7 },
      { regex: /customer (.+?) owes ₦?([\d,]+)/, category: 'credit', importance: 0.6 },
    ];
    
    patterns.forEach(pattern => {
      const match = message.match(pattern.regex);
      if (match) {
        const factContent = match[0];
        
        // Check if fact already exists
        const existingFact = memory.establishedFacts.find(f => 
          f.content === factContent || 
          f.content.includes(factContent) ||
          factContent.includes(f.content)
        );
        
        if (existingFact) {
          // Update existing fact
          existingFact.lastMentioned = new Date();
          existingFact.mentionCount++;
          existingFact.confidence = Math.min(1, existingFact.confidence + 0.1);
        } else {
          // Create new fact
          const newFact: Fact = {
            content: factContent,
            category: pattern.category,
            establishedAt: new Date(),
            lastMentioned: new Date(),
            mentionCount: 1,
            importance: pattern.importance,
            confidence: 0.7,
          };
          memory.establishedFacts.push(newFact);
          newFacts.push(newFact);
        }
      }
    });
    
    return newFacts;
  }
  
  // Check if fact has been established
  isFactEstablished(fact: string, context: MemoryContext): {
    isEstablished: boolean;
    existingFact?: Fact;
    timeSinceEstablished?: number; // hours
  } {
    const memory = this.getMemory(context);
    
    const existingFact = memory.establishedFacts.find(f => 
      f.content === fact || 
      f.content.includes(fact) ||
      fact.includes(f.content)
    );
    
    if (!existingFact) {
      return { isEstablished: false };
    }
    
    const timeSinceEstablished = (Date.now() - existingFact.establishedAt.getTime()) / (1000 * 60 * 60);
    
    return {
      isEstablished: true,
      existingFact,
      timeSinceEstablished,
    };
  }
  
  // Check if topic has been discussed
  isTopicDiscussed(topic: string, context: MemoryContext): {
    isDiscussed: boolean;
    topic?: Topic;
    timeSinceDiscussed?: number; // hours
    discussionCount?: number;
  } {
    const memory = this.getMemory(context);
    
    const existingTopic = memory.discussedTopics.find(t => 
      t.name.toLowerCase() === topic.toLowerCase() ||
      t.name.toLowerCase().includes(topic.toLowerCase()) ||
      topic.toLowerCase().includes(t.name.toLowerCase())
    );
    
    if (!existingTopic) {
      return { isDiscussed: false };
    }
    
    const timeSinceDiscussed = (Date.now() - existingTopic.lastDiscussed.getTime()) / (1000 * 60 * 60);
    
    return {
      isDiscussed: true,
      topic: existingTopic,
      timeSinceDiscussed,
      discussionCount: existingTopic.discussionCount,
    };
  }
  
  // Record topic discussion
  recordTopic(topic: string, context: MemoryContext, status: 'active' | 'resolved' | 'deferred' = 'active'): Topic {
    const memory = this.getMemory(context);
    
    const existingTopic = memory.discussedTopics.find(t => 
      t.name.toLowerCase() === topic.toLowerCase()
    );
    
    if (existingTopic) {
      existingTopic.lastDiscussed = new Date();
      existingTopic.discussionCount++;
      existingTopic.status = status;
      return existingTopic;
    }
    
    const newTopic: Topic = {
      name: topic,
      firstDiscussed: new Date(),
      lastDiscussed: new Date(),
      discussionCount: 1,
      relatedFacts: [],
      status,
    };
    
    memory.discussedTopics.push(newTopic);
    return newTopic;
  }
  
  // Detect user preferences
  detectPreferences(message: string, context: MemoryContext): Preference[] {
    const memory = this.getMemory(context);
    const newPreferences: Preference[] = [];
    
    const patterns = [
      { regex: /prefer (short|brief|concise) responses/, type: 'response_length', value: 'short' },
      { regex: /prefer (long|detailed|thorough) responses/, type: 'response_length', value: 'long' },
      { regex: /like (direct|straightforward) answers/, type: 'communication_style', value: 'direct' },
      { regex: /like (detailed|explanatory) answers/, type: 'communication_style', value: 'detailed' },
      { regex: /don't want (technical|jargon)/, type: 'language_level', value: 'simple' },
      { regex: /want (technical|detailed) information/, type: 'language_level', value: 'technical' },
    ];
    
    patterns.forEach(pattern => {
      const match = message.match(pattern.regex);
      if (match) {
        const existingPref = memory.userPreferences.find(p => 
          p.type === pattern.type
        );
        
        if (existingPref) {
          existingPref.value = pattern.value;
          existingPref.detectedAt = new Date();
          existingPref.confidence = Math.min(1, existingPref.confidence + 0.2);
        } else {
          const newPref: Preference = {
            type: pattern.type,
            value: pattern.value,
            detectedAt: new Date(),
            confidence: 0.7,
          };
          memory.userPreferences.push(newPref);
          newPreferences.push(newPref);
        }
      }
    });
    
    return newPreferences;
  }
  
  // Record flow event
  recordFlowEvent(event: FlowEvent, context: MemoryContext): void {
    const memory = this.getMemory(context);
    memory.conversationFlow.push(event);
    
    // Keep only last 50 events
    if (memory.conversationFlow.length > 50) {
      memory.conversationFlow.shift();
    }
  }
  
  // Check if content would be repetitive
  wouldBeRepetitive(content: string, context: MemoryContext): {
    isRepetitive: boolean;
    similarContent?: string;
    timeSinceMentioned?: number;
    suggestion?: string;
  } {
    const memory = this.getMemory(context);
    
    // Check against established facts
    for (const fact of memory.establishedFacts) {
      if (this.calculateSimilarity(content, fact.content) > 0.7) {
        const timeSinceMentioned = (Date.now() - fact.lastMentioned.getTime()) / (1000 * 60 * 60);
        
        if (timeSinceMentioned < 1) {
          return {
            isRepetitive: true,
            similarContent: fact.content,
            timeSinceMentioned,
            suggestion: 'This fact was recently established. Reference it instead of repeating.',
          };
        }
      }
    }
    
    // Check against recent flow events
    const recentEvents = memory.conversationFlow.slice(-5);
    for (const event of recentEvents) {
      if (this.calculateSimilarity(content,event.content) > 0.8) {
        const timeSinceMentioned = (Date.now() - event.timestamp.getTime()) / (1000 * 60 * 60);
        
        if (timeSinceMentioned < 0.5) {
          return {
            isRepetitive: true,
            similarContent: event.content,
            timeSinceMentioned,
            suggestion: 'This was just mentioned. Consider a different approach.',
          };
        }
      }
    }
    
    return { isRepetitive: false };
  }
  
  // Calculate similarity between two strings (simple implementation)
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }
  
  // Get relevant facts for current context
  getRelevantFacts(context: MemoryContext, category?: string): Fact[] {
    const memory = this.getMemory(context);
    
    let facts = memory.establishedFacts;
    
    if (category) {
      facts = facts.filter(f => f.category === category);
    }
    
    // Sort by importance and recency
    return facts.sort((a, b) => {
      const importanceDiff = b.importance - a.importance;
      if (Math.abs(importanceDiff) > 0.1) {
        return importanceDiff;
      }
      return b.lastMentioned.getTime() - a.lastMentioned.getTime();
    });
  }
  
  // Get conversation summary
  getSummary(context: MemoryContext): {
    totalFacts: number;
    totalTopics: number;
    totalPreferences: number;
    recentTopics: string[];
    activeTopics: string[];
  } {
    const memory = this.getMemory(context);
    
    const recentTopics = memory.discussedTopics
      .sort((a, b) => b.lastDiscussed.getTime() - a.lastDiscussed.getTime())
      .slice(0, 5)
      .map(t => t.name);
    
    const activeTopics = memory.discussedTopics
      .filter(t => t.status === 'active')
      .map(t => t.name);
    
    return {
      totalFacts: memory.establishedFacts.length,
      totalTopics: memory.discussedTopics.length,
      totalPreferences: memory.userPreferences.length,
      recentTopics,
      activeTopics,
    };
  }
  
  // Clear memory for conversation
  clearMemory(context: MemoryContext): void {
    const key = `${context.businessId}:${context.conversationId}`;
    this.memories.delete(key);
  }
  
  // Format for AI response
  formatForAIResponse(context: MemoryContext): string {
    const memory = this.getMemory(context);
    const summary = this.getSummary(context);
    
    let response = '\n\n🧠 CONVERSATION MEMORY:\n';
    response += `Established Facts: ${summary.totalFacts}\n`;
    response += `Discussed Topics: ${summary.totalTopics}\n`;
    response += `User Preferences: ${summary.totalPreferences}\n`;
    
    if (summary.recentTopics.length > 0) {
      response += `Recent Topics: ${summary.recentTopics.join(', ')}\n`;
    }
    
    if (summary.activeTopics.length > 0) {
      response += `Active Topics: ${summary.activeTopics.join(', ')}\n`;
    }
    
    const relevantFacts = this.getRelevantFacts(context).slice(0, 3);
    if (relevantFacts.length > 0) {
      response += `\nKey Facts:\n`;
      relevantFacts.forEach(fact => {
        response += `• ${fact.content} (${fact.category}, importance: ${(fact.importance * 100).toFixed(0)}%)\n`;
      });
    }
    
    return response;
  }
}

// Singleton instance
let conversationMemoryEngineInstance: ConversationMemoryEngine | null = null;

export function getConversationMemoryEngine(): ConversationMemoryEngine {
  if (!conversationMemoryEngineInstance) {
    conversationMemoryEngineInstance = new ConversationMemoryEngine();
  }
  return conversationMemoryEngineInstance;
}
