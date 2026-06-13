/**
 * AI Request Queue System
 * Prevents users from sending multiple simultaneous requests
 * Manages request queue and prevents duplicate submissions
 */

interface QueuedRequest {
  id: string;
  userId: string;
  businessId: string;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

class AIRequestQueue {
  private queue: Map<string, QueuedRequest> = new Map();
  private processing: Set<string> = new Set();
  private readonly MAX_CONCURRENT_PER_USER = 1;
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  /**
   * Add a request to the queue
   */
  addRequest(userId: string, businessId: string): { allowed: boolean; requestId?: string; message?: string } {
    // Check if user already has a request in progress
    const userInProgress = Array.from(this.queue.values()).some(
      req => req.userId === userId && req.status === 'processing'
    );

    if (userInProgress) {
      return {
        allowed: false,
        message: 'You have a request in progress. Please wait for it to complete.',
      };
    }

    // Check for duplicate requests (same user within 5 seconds)
    const recentRequest = Array.from(this.queue.values()).find(
      req => req.userId === userId && 
             req.businessId === businessId && 
             Date.now() - req.timestamp < 5000
    );

    if (recentRequest) {
      return {
        allowed: false,
        message: 'Duplicate request detected. Please wait.',
      };
    }

    // Add to queue
    const requestId = `${userId}-${Date.now()}`;
    this.queue.set(requestId, {
      id: requestId,
      userId,
      businessId,
      timestamp: Date.now(),
      status: 'pending',
    });

    return { allowed: true, requestId };
  }

  /**
   * Mark request as processing
   */
  startProcessing(requestId: string): void {
    const request = this.queue.get(requestId);
    if (request) {
      request.status = 'processing';
      this.processing.add(requestId);
      
      // Set timeout to auto-fail
      setTimeout(() => {
        if (this.processing.has(requestId)) {
          this.failRequest(requestId, 'Request timeout');
        }
      }, this.REQUEST_TIMEOUT);
    }
  }

  /**
   * Mark request as completed
   */
  completeRequest(requestId: string): void {
    const request = this.queue.get(requestId);
    if (request) {
      request.status = 'completed';
      this.processing.delete(requestId);
      
      // Remove from queue after a delay
      setTimeout(() => {
        this.queue.delete(requestId);
      }, 60000); // Keep for 1 minute for logging
    }
  }

  /**
   * Mark request as failed
   */
  failRequest(requestId: string, reason: string): void {
    const request = this.queue.get(requestId);
    if (request) {
      request.status = 'failed';
      this.processing.delete(requestId);
      console.error(`AI request failed: ${requestId} - ${reason}`);
      
      // Remove from queue after a delay
      setTimeout(() => {
        this.queue.delete(requestId);
      }, 60000);
    }
  }

  /**
   * Get queue status
   */
  getStatus(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    const requests = Array.from(this.queue.values());
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      processing: requests.filter(r => r.status === 'processing').length,
      completed: requests.filter(r => r.status === 'completed').length,
      failed: requests.filter(r => r.status === 'failed').length,
    };
  }

  /**
   * Clean up old requests
   */
  cleanup(): void {
    const now = Date.now();
    for (const [id, request] of this.queue.entries()) {
      // Remove requests older than 5 minutes
      if (now - request.timestamp > 300000) {
        this.queue.delete(id);
        this.processing.delete(id);
      }
    }
  }
}

// Singleton instance
export const aiRequestQueue = new AIRequestQueue();

// Cleanup every 5 minutes
setInterval(() => {
  aiRequestQueue.cleanup();
}, 300000);
