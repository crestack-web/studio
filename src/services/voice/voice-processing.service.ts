/**
 * Voice Learning Pipeline - Main Processing Service
 * Orchestrates the voice learning pipeline
 */

import { 
  transcribeAudio, 
  detectLanguageFromText,
  getLanguageName 
} from '../ai/speech-to-text-service';
import { voiceStorage } from './voice-storage.service';
import { voiceDatabase } from './voice-database.service';
import { 
  type VoiceSample, 
  type VoiceProcessingResult,
  type VoiceProcessingOptions,
  type SupportedLanguage,
  type ConfidenceLevel,
  type VoiceProcessingStatus
} from './types';

const DEFAULT_OPTIONS: VoiceProcessingOptions = {
  enableLanguageDetection: true,
  enableQualityAssessment: true,
  enableConfidenceScoring: true,
  autoSaveTranscript: true,
  requireConsent: true,
  confidenceThresholds: {
    high: 0.8,
    medium: 0.5,
    low: 0.0
  },
  requestConfirmationProbability: 0.5
};

export class VoiceProcessingService {
  /**
   * Process a voice note through the learning pipeline
   */
  async processVoiceNote(
    audioBlob: Blob,
    userId: string,
    businessId: string,
    businessCategory: string,
    options: Partial<VoiceProcessingOptions> = {},
    userLanguageHint?: SupportedLanguage
  ): Promise<VoiceProcessingResult> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      // Step 1: Check consent
      if (opts.requireConsent) {
        const hasConsent = await this.verifyConsent(userId, businessId);
        if (!hasConsent) {
          return {
            success: false,
            transcript: '',
            error: 'User has not consented to voice data collection',
            processingTimeMs: Date.now() - startTime
          };
        }
      }

      // Step 2: Upload audio
      const voiceSampleId = this.generateSampleId();
      let audioUrl: string;
      try {
        audioUrl = await voiceStorage.uploadAudio(audioBlob, voiceSampleId, userId);
      } catch (uploadError) {
        return {
          success: false,
          transcript: '',
          error: 'Failed to upload audio recording',
          processingTimeMs: Date.now() - startTime
        };
      }

      // Step 3: Transcribe audio
      let transcript: string;
      let confidenceScore: number | undefined;
      let detectedLanguage: SupportedLanguage | undefined;

      try {
        const transcriptionResult = await transcribeAudio(audioBlob);
        transcript = transcriptionResult;
        confidenceScore = undefined; // Gemini doesn't provide confidence scores directly
        detectedLanguage = opts.enableLanguageDetection 
          ? (detectLanguageFromText(transcript) as SupportedLanguage) 
          : userLanguageHint;
      } catch (transcriptionError) {
        // Cleanup uploaded audio if transcription fails
        await voiceStorage.deleteAudio(audioUrl);
        
        return {
          success: false,
          transcript: '',
          error: 'Failed to transcribe audio',
          processingTimeMs: Date.now() - startTime
        };
      }

      // Step 4: Determine confidence level
      const confidenceLevel = this.determineConfidenceLevel(confidenceScore, opts);

      // Step 5: Determine if confirmation should be requested
      const shouldRequestConfirmation = this.shouldRequestConfirmation(
        confidenceLevel,
        opts
      );

      // Step 6: Create voice sample record
      const voiceSample: VoiceSample = {
        id: voiceSampleId,
        userId,
        businessId,
        businessCategory,
        audioUrl,
        originalTranscript: transcript,
        aiResponse: '', // Will be filled when AI responds
        timestamp: new Date(),
        status: this.determineInitialStatus(confidenceLevel),
        confidenceScore,
        confidenceLevel,
        detectedLanguage,
        userLanguageSelection: userLanguageHint,
        isEdited: false,
        isVerified: false,
        trainingEligibility: 'pending',
        consentGiven: true,
        consentTimestamp: new Date(),
        processingMetadata: {
          apiUsed: 'gemini',
          processingTimeMs: Date.now() - startTime,
          retryCount: 0
        }
      };

      // Step 7: Save to database
      try {
        await voiceDatabase.createVoiceSample(voiceSample);
      } catch (dbError) {
        console.error('Failed to save voice sample:', dbError);
        // Continue anyway - we have the audio and transcript
      }

      return {
        success: true,
        voiceSample,
        transcript,
        confidenceScore,
        confidenceLevel,
        detectedLanguage,
        languageConfidence: 1.0,
        shouldRequestConfirmation,
        processingTimeMs: Date.now() - startTime
      };

    } catch (error) {
      console.error('Voice processing error:', error);
      return {
        success: false,
        transcript: '',
        error: error instanceof Error ? error.message : 'Unknown processing error',
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Update transcript after user edit
   */
  async updateTranscript(
    voiceSampleId: string,
    correctedTranscript: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const sample = await voiceDatabase.getVoiceSample(voiceSampleId);
      if (!sample) {
        return { success: false, error: 'Voice sample not found' };
      }

      if (sample.userId !== userId) {
        return { success: false, error: 'Unauthorized' };
      }

      const updates: Partial<VoiceSample> = {
        correctedTranscript,
        isEdited: true,
        editTimestamp: new Date(),
        isVerified: true,
        verificationTimestamp: new Date(),
        verificationNotes: 'User corrected transcript',
        trainingEligibility: 'eligible'
      };

      await voiceDatabase.updateVoiceSample(voiceSampleId, updates);

      return { success: true };
    } catch (error) {
      console.error('Error updating transcript:', error);
      return { success: false, error: 'Failed to update transcript' };
    }
  }

  /**
   * Update AI response after processing
   */
  async updateAIResponse(
    voiceSampleId: string,
    aiResponse: string
  ): Promise<void> {
    try {
      await voiceDatabase.updateVoiceSample(voiceSampleId, {
        aiResponse,
        status: 'completed'
      });
    } catch (error) {
      console.error('Error updating AI response:', error);
    }
  }

  /**
   * Verify user consent
   */
  private async verifyConsent(userId: string, businessId: string): Promise<boolean> {
    try {
      const preferences = await voiceDatabase.getConsentPreferences(userId);
      return preferences?.consentGiven ?? false;
    } catch (error) {
      console.error('Error verifying consent:', error);
      return false;
    }
  }

  /**
   * Generate unique sample ID
   */
  private generateSampleId(): string {
    return `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine confidence level from score
   */
  private determineConfidenceLevel(
    confidenceScore: number | undefined,
    options: VoiceProcessingOptions
  ): ConfidenceLevel {
    if (!confidenceScore || !options.enableConfidenceScoring) {
      return 'unknown';
    }

    const { high, medium, low } = options.confidenceThresholds;

    if (confidenceScore >= high) return 'high';
    if (confidenceScore >= medium) return 'medium';
    return 'low';
  }

  /**
   * Determine if confirmation should be requested
   */
  private shouldRequestConfirmation(
    confidenceLevel: ConfidenceLevel,
    options: VoiceProcessingOptions
  ): boolean {
    if (confidenceLevel === 'high') return false;
    if (confidenceLevel === 'low') return false; // Don't interrupt low confidence
    if (confidenceLevel === 'unknown') return false;

    // Medium confidence - probabilistic request
    return Math.random() < options.requestConfirmationProbability;
  }

  /**
   * Determine initial status based on confidence
   */
  private determineInitialStatus(confidenceLevel: ConfidenceLevel): VoiceProcessingStatus {
    switch (confidenceLevel) {
      case 'low':
        return 'flagged_for_review';
      case 'medium':
        return 'pending';
      case 'high':
      default:
        return 'completed';
    }
  }

  /**
   * Submit language correction
   */
  async submitLanguageCorrection(
    voiceSampleId: string,
    correctLanguage: SupportedLanguage,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const sample = await voiceDatabase.getVoiceSample(voiceSampleId);
      if (!sample || sample.userId !== userId) {
        return { success: false, error: 'Unauthorized or sample not found' };
      }

      await voiceDatabase.updateVoiceSample(voiceSampleId, {
        userLanguageSelection: correctLanguage,
        detectedLanguage: correctLanguage,
        isVerified: true,
        verificationTimestamp: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Error submitting language correction:', error);
      return { success: false, error: 'Failed to save language correction' };
    }
  }
}

export const voiceProcessing = new VoiceProcessingService();