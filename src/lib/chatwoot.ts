import { CHATWOOT_CONFIG, CHATWOOT_TAGS, CHATWOOT_INBOXES, ESCALATION_TRIGGERS, ChatwootUser } from './chatwoot-config';

export type { ChatwootUser };

export interface ChatwootMessage {
  content: string;
  sender: 'user' | 'agent';
}

export class ChatwootService {
  private static instance: ChatwootService;
  private baseUrl: string;
  private apiAccessToken: string;
  private accountId: string;

  private constructor() {
    this.baseUrl = CHATWOOT_CONFIG.baseUrl;
    this.apiAccessToken = CHATWOOT_CONFIG.apiAccessToken;
    this.accountId = CHATWOOT_CONFIG.accountId;
  }

  public static getInstance(): ChatwootService {
    if (!ChatwootService.instance) {
      ChatwootService.instance = new ChatwootService();
    }
    return ChatwootService.instance;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': this.apiAccessToken,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Chatwoot API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async identifyUser(user: ChatwootUser) {
    if (!CHATWOOT_CONFIG.enabled || !window.$chatwoot) {
      return;
    }

    try {
      // Set user data in Chatwoot
      if (window.$chatwoot && window.$chatwoot.setUser) {
        window.$chatwoot.setUser(user.email, {
          name: user.name,
          email: user.email,
          id: user.id,
          business_name: user.businessName,
          business_id: user.businessId,
          subscription_plan: user.subscriptionPlan,
          workspace_id: user.workspaceId,
          phone: user.phone,
          avatar_url: user.avatarUrl,
        });
      }
    } catch (error) {
      console.error('Chatwoot identification error:', error);
    }
  }

  async identifyVisitor(email: string, name: string = 'Visitor') {
    if (!CHATWOOT_CONFIG.enabled || !window.$chatwoot) {
      return;
    }

    try {
      if (window.$chatwoot && window.$chatwoot.setUser) {
        window.$chatwoot.setUser(email, {
          name,
          email,
        });
      }
    } catch (error) {
      console.error('Chatwoot visitor identification error:', error);
    }
  }

  async toggleChat(show: boolean) {
    if (!CHATWOOT_CONFIG.enabled || !window.$chatwoot) {
      return;
    }

    try {
      if (show) {
        window.$chatwoot.toggle();
      }
    } catch (error) {
      console.error('Chatwoot toggle error:', error);
    }
  }

  async createConversation(labels: string[] = [], inboxId?: number) {
    try {
      const conversation = await this.makeRequest('conversations', {
        method: 'POST',
        body: JSON.stringify({
          inbox_id: inboxId || CHATWOOT_CONFIG.inboxId,
          status: 'open',
          ...(labels.length > 0 && { custom_attributes: { tags: labels } }),
        }),
      });
      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  async sendMessage(conversationId: number, message: string, sender: 'user' | 'agent' = 'user') {
    try {
      const endpoint = sender === 'user' 
        ? `conversations/${conversationId}/messages`
        : `conversations/${conversationId}/messages`;

      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          content: message,
          message_type: sender === 'user' ? 'incoming' : 'outgoing',
        }),
      });
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  async updateConversation(conversationId: number, updates: any) {
    try {
      const response = await this.makeRequest(`conversations/${conversationId}`, {
        method: 'POST',
        body: JSON.stringify(updates),
      });
      return response;
    } catch (error) {
      console.error('Error updating conversation:', error);
      return null;
    }
  }

  async assignAgent(conversationId: number, agentId: number) {
    try {
      const response = await this.makeRequest(`conversations/${conversationId}/assignments`, {
        method: 'POST',
        body: JSON.stringify({
          assignee_id: agentId,
        }),
      });
      return response;
    } catch (error) {
      console.error('Error assigning agent:', error);
      return null;
    }
  }

  async addLabels(conversationId: number, labels: string[]) {
    try {
      const response = await this.makeRequest(`conversations/${conversationId}/labels`, {
        method: 'POST',
        body: JSON.stringify({
          labels,
        }),
      });
      return response;
    } catch (error) {
      console.error('Error adding labels:', error);
      return null;
    }
  }

  async getConversationStatus(conversationId: number) {
    try {
      const conversation = await this.makeRequest(`conversations/${conversationId}`);
      return conversation;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }
  }

  shouldEscalate(topic: string, confidence?: number): boolean {
    const lowerTopic = topic.toLowerCase();

    // Check for escalation keywords
    if (ESCALATION_TRIGGERS.keywords.some((keyword: string) => lowerTopic.includes(keyword))) {
      return true;
    }

    // Check for escalation topics
    if (ESCALATION_TRIGGERS.topics.some((topic: string) => lowerTopic.includes(topic))) {
      return true;
    }

    // Check confidence threshold
    if (confidence !== undefined && confidence < ESCALATION_TRIGGERS.lowConfidenceThreshold) {
      return true;
    }

    return false;
  }

  getInboxForTopic(topic: string): number {
    const lowerTopic = topic.toLowerCase();
    
    if (['billing', 'payment', 'subscription', 'price', 'invoice'].some((t: string) => lowerTopic.includes(t))) {
      return CHATWOOT_INBOXES.SALES;
    }
    
    if (['technical', 'bug', 'error', 'issue'].some((t: string) => lowerTopic.includes(t))) {
      return CHATWOOT_INBOXES.WEBSITE_SUPPORT;
    }

    return CHATWOOT_INBOXES.GENERAL_CONTACT;
  }

  getTagsForTopic(topic: string): string[] {
    const lowerTopic = topic.toLowerCase();
    const tags: string[] = [];

    if (['billing', 'payment', 'subscription', 'invoice'].some(t => lowerTopic.includes(t))) {
      tags.push(CHATWOOT_TAGS.BILLING);
    }
    if (['bug', 'error', 'issue', 'broken'].some(t => lowerTopic.includes(t))) {
      tags.push(CHATWOOT_TAGS.BUG);
    }
    if (['feature', 'request', 'suggestion'].some(t => lowerTopic.includes(t))) {
      tags.push(CHATWOOT_TAGS.FEATURE_REQUEST);
    }
    if (['technical', 'how to', 'help'].some(t => lowerTopic.includes(t))) {
      tags.push(CHATWOOT_TAGS.TECHNICAL);
    }
    if (['sales', 'buy', 'purchase', 'pricing'].some(t => lowerTopic.includes(t))) {
      tags.push(CHATWOOT_TAGS.SALES);
    }

    return tags;
  }
}

// Extend window interface for Chatwoot
declare global {
  interface Window {
    $chatwoot?: any;
    chatwootSettings?: any;
  }
}

export const chatwootService = ChatwootService.getInstance();