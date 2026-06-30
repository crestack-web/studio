/**
 * Voice Learning Pipeline - Consent Management Service
 * Handles user consent for voice data collection
 */

import { voiceDatabase } from './voice-database.service';
import { 
  type VoiceConsentPreferences,
  type SupportedLanguage 
} from './types';

const DEFAULT_CONSENT_VERSION = '1.0.0';

export class VoiceConsentService {
  /**
   * Get user consent preferences
   */
  async getConsent(userId: string): Promise<VoiceConsentPreferences | null> {
    return voiceDatabase.getConsentPreferences(userId);
  }

  /**
   * Create default consent preferences for new user
   */
  async createDefaultConsent(userId: string, businessId: string): Promise<VoiceConsentPreferences> {
    const now = new Date();
    const preferences: VoiceConsentPreferences = {
      userId,
      businessId,
      consentGiven: false,
      consentTimestamp: now,
      consentVersion: DEFAULT_CONSENT_VERSION,
      preferences: {
        allowTranscriptCorrections: true,
        allowAudioStorage: true,
        allowQualityReview: true,
        allowLanguageDetection: true
      }
    };

    await voiceDatabase.saveConsentPreferences(preferences);
    return preferences;
  }

  /**
   * Update consent preferences
   */
  async updateConsent(
    userId: string,
    businessId: string,
    consentGiven: boolean
  ): Promise<VoiceConsentPreferences> {
    const existing = await voiceDatabase.getConsentPreferences(userId);
    const now = new Date();

    const preferences: VoiceConsentPreferences = {
      userId,
      businessId,
      consentGiven,
      consentTimestamp: consentGiven ? now : (existing?.consentTimestamp || now),
      consentVersion: DEFAULT_CONSENT_VERSION,
      withdrawalTimestamp: !consentGiven ? now : (existing?.withdrawalTimestamp),
      preferences: existing?.preferences || {
        allowTranscriptCorrections: true,
        allowAudioStorage: true,
        allowQualityReview: true,
        allowLanguageDetection: true
      }
    };

    await voiceDatabase.saveConsentPreferences(preferences);
    return preferences;
  }

  /**
   * Update specific preference
   */
  async updatePreference(
    userId: string,
    preferenceKey: keyof VoiceConsentPreferences['preferences'],
    value: boolean
  ): Promise<VoiceConsentPreferences> {
    const existing = await voiceDatabase.getConsentPreferences(userId);
    
    if (!existing) {
      throw new Error('Consent preferences not found');
    }

    const updated: VoiceConsentPreferences = {
      ...existing,
      preferences: {
        ...existing.preferences,
        [preferenceKey]: value
      }
    };

    await voiceDatabase.saveConsentPreferences(updated);
    return updated;
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(userId: string, businessId: string): Promise<void> {
    await this.updateConsent(userId, businessId, false);
  }

  /**
   * Check if user has consented
   */
  async hasConsented(userId: string): Promise<boolean> {
    const preferences = await voiceDatabase.getConsentPreferences(userId);
    return preferences?.consentGiven ?? false;
  }

  /**
   * Get consent text for UI
   */
  getConsentText(): string {
    return `Help improve Busmo AI for African languages. With your permission, anonymized voice recordings and transcript corrections may be used to improve speech recognition. Personal information will never be used for training.`;
  }

  /**
   * Get detailed consent description
   */
  getConsentDetails(): {
    title: string;
    description: string;
    benefits: string[];
    privacyNotes: string[];
  } {
    return {
      title: 'Help Improve Busmo AI',
      description: 'Your voice data helps us build better speech recognition for African languages',
      benefits: [
        'Improved accuracy for Hausa, Yoruba, Igbo, and other African languages',
        'Better understanding of business terminology',
        'More natural conversations with Busmo AI'
      ],
      privacyNotes: [
        'Personal information is never used for training',
        'Audio recordings are anonymized',
        'You can withdraw consent at any time',
        'All data is encrypted and securely stored'
      ]
    };
  }
}

export const voiceConsent = new VoiceConsentService();