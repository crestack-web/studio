/**
 * Voice Learning Pipeline - Type Definitions
 */

export type VoiceProcessingStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'flagged_for_review'
  | 'approved'
  | 'rejected';

export type TrainingEligibility = 
  | 'pending'
  | 'eligible'
  | 'ineligible'
  | 'under_review';

export type ReviewStatus = 
  | 'not_reviewed'
  | 'needs_review'
  | 'approved'
  | 'rejected';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

export type SupportedLanguage = 
  | 'ha' // Hausa
  | 'yo' // Yoruba
  | 'ig' // Igbo
  | 'pcm' // Nigerian Pidgin
  | 'en' // English
  | 'mixed' // Mixed languages
  | 'other'; // Other

export type AfricanLanguage = SupportedLanguage | 'ff' // Fulfulde
  | 'kr' // Kanuri
  | 'tiv' // Tiv
  | 'edo' // Edo
  | 'efi' // Efik
  | 'ibibio'; // Ibibio

export interface VoiceSample {
  id: string;
  userId: string;
  businessId: string;
  businessCategory: string;
  audioUrl: string;
  audioDuration?: number;
  audioSize?: number;
  originalTranscript: string;
  correctedTranscript?: string;
  aiResponse: string;
  timestamp: Date;
  status: VoiceProcessingStatus;
  confidenceScore?: number;
  confidenceLevel?: ConfidenceLevel;
  detectedLanguage?: SupportedLanguage;
  userLanguageSelection?: SupportedLanguage;
  isEdited: boolean;
  editTimestamp?: Date;
  isVerified: boolean;
  verificationTimestamp?: Date;
  verificationNotes?: string;
  trainingEligibility: TrainingEligibility;
  consentGiven: boolean;
  consentTimestamp?: Date;
  processingMetadata?: VoiceProcessingMetadata;
  qualityMetrics?: AudioQualityMetrics;
  dialect?: string;
  reviewerId?: string;
  reviewTimestamp?: Date;
  reviewNotes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface VoiceProcessingMetadata {
  apiUsed: string;
  processingTimeMs: number;
  retryCount: number;
  errorMessage?: string;
  promptUsed?: string;
  modelVersion?: string;
}

export interface AudioQualityMetrics {
  signalToNoiseRatio?: number;
  clippingDetected: boolean;
  silencePercentage?: number;
  volumeLevel?: number;
  sampleRate?: number;
  bitRate?: number;
  qualityScore: number; // 0-100
}

export interface VoiceConsentPreferences {
  userId: string;
  businessId: string;
  consentGiven: boolean;
  consentTimestamp: Date;
  consentVersion: string;
  withdrawalTimestamp?: Date;
  preferences: {
    allowTranscriptCorrections: boolean;
    allowAudioStorage: boolean;
    allowQualityReview: boolean;
    allowLanguageDetection: boolean;
  };
}

export interface TrainingDataset {
  id: string;
  name: string;
  description?: string;
  language: AfricanLanguage;
  dialect?: string;
  samples: string[]; // Voice sample IDs
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  status: 'draft' | 'curated' | 'exported' | 'archived';
  metadata: {
    totalDuration: number;
    totalSamples: number;
    averageQuality: number;
    businessCategories: string[];
    dateRange: {
      start: Date;
      end: Date;
    };
  };
  exportFormat?: 'csv' | 'json' | 'manifest';
  exportPath?: string;
}

export interface VoiceAnalytics {
  totalSamplesProcessed: number;
  samplesByLanguage: Record<string, number>;
  samplesByBusinessCategory: Record<string, number>;
  averageConfidenceScore: number;
  correctionRate: number;
  trainingEligibleCount: number;
  reviewBacklogCount: number;
  processingSuccessRate: number;
  timeRange: {
    start: Date;
    end: Date;
  };
  topDifficultWords: Array<{ word: string; frequency: number }>;
  topDifficultTerms: Array<{ term: string; frequency: number }>;
  datasetGrowth: Array<{ date: string; count: number }>;
  topContributors: Array<{ businessId: string; count: number }>;
}

export interface LanguageDetectionResult {
  language: SupportedLanguage;
  confidence: number;
  alternatives?: Array<{ language: SupportedLanguage; confidence: number }>;
  mixedLanguages?: SupportedLanguage[];
}

export interface VoiceProcessingOptions {
  languageHint?: SupportedLanguage;
  enableLanguageDetection: boolean;
  enableQualityAssessment: boolean;
  enableConfidenceScoring: boolean;
  autoSaveTranscript: boolean;
  requireConsent: boolean;
  confidenceThresholds: {
    high: number;
    medium: number;
    low: number;
  };
  requestConfirmationProbability: number;
}

export interface VoiceProcessingResult {
  success: boolean;
  voiceSample?: VoiceSample;
  transcript: string;
  confidenceScore?: number;
  confidenceLevel?: ConfidenceLevel;
  detectedLanguage?: SupportedLanguage;
  languageConfidence?: number;
  shouldRequestConfirmation?: boolean;
  error?: string;
  processingTimeMs: number;
}

export interface ReviewAction {
  type: 'approve' | 'reject' | 'needs_review';
  notes?: string;
  assignedLanguage?: SupportedLanguage;
  assignedDialect?: string;
  markTrainingReady?: boolean;
}

export interface DatasetExportOptions {
  format: 'csv' | 'json' | 'manifest';
  includeAudioReferences: boolean;
  filterByLanguage?: SupportedLanguage;
  filterByCategory?: string;
  filterByDateRange?: { start: Date; end: Date };
  filterByQuality?: number;
  maxSamples?: number;
}

export interface DatasetExportResult {
  success: boolean;
  downloadUrl?: string;
  sampleCount: number;
  format: string;
  exportedAt: Date;
  metadata: {
    languages: Record<string, number>;
    categories: Record<string, number>;
    totalDuration: number;
  };
}

export interface VoiceLearningConfig {
  storage: {
    bucketName: string;
    maxFileSizeMB: number;
    allowedFormats: string[];
    encryptionEnabled: boolean;
  };
  processing: {
    defaultLanguage: SupportedLanguage;
    autoDetectLanguage: boolean;
    confidenceThresholds: VoiceProcessingOptions['confidenceThresholds'];
    requestConfirmationProbability: number; // 0-1 for medium confidence
  };
  quality: {
    minimumQualityScore: number;
    enableNoiseFiltering: boolean;
    enableDuplicateDetection: boolean;
    duplicateCheckWindowDays: number;
  };
  privacy: {
    dataRetentionDays: number;
    autoDeleteObsoleteSamples: boolean;
    anonymizationEnabled: boolean;
  };
}