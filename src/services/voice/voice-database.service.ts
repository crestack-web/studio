/**
 * Voice Learning Pipeline - Database Service
 * Handles Firestore operations for voice samples
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { 
  type VoiceSample, 
  type VoiceConsentPreferences,
  type TrainingDataset,
  type VoiceAnalytics,
  type VoiceProcessingStatus,
  type TrainingEligibility,
  type SupportedLanguage
} from './types';

const firebaseConfig = {
  projectId: "bizassistant2-62305643-adad7",
};

const app = initializeApp(firebaseConfig, 'voice-learning-db');
const db = getFirestore(app);

export class VoiceDatabaseService {
  private voiceSamplesCollection = 'voiceSamples';
  private voiceConsentCollection = 'voiceConsent';
  private trainingDatasetsCollection = 'trainingDatasets';

  /**
   * Create a new voice sample record
   */
  async createVoiceSample(sample: VoiceSample): Promise<string> {
    try {
      const docRef = doc(db, this.voiceSamplesCollection, sample.id);
      await setDoc(docRef, {
        ...sample,
        timestamp: Timestamp.fromDate(sample.timestamp),
        editTimestamp: sample.editTimestamp ? Timestamp.fromDate(sample.editTimestamp) : null,
        verificationTimestamp: sample.verificationTimestamp 
          ? Timestamp.fromDate(sample.verificationTimestamp) 
          : null,
        reviewTimestamp: sample.reviewTimestamp ? Timestamp.fromDate(sample.reviewTimestamp) : null,
        consentTimestamp: sample.consentTimestamp ? Timestamp.fromDate(sample.consentTimestamp) : null,
      });
      return sample.id;
    } catch (error) {
      console.error('Error creating voice sample:', error);
      throw new Error('Failed to save voice sample');
    }
  }

  /**
   * Get voice sample by ID
   */
  async getVoiceSample(sampleId: string): Promise<VoiceSample | null> {
    try {
      const docRef = doc(db, this.voiceSamplesCollection, sampleId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          editTimestamp: data.editTimestamp?.toDate(),
          verificationTimestamp: data.verificationTimestamp?.toDate(),
          reviewTimestamp: data.reviewTimestamp?.toDate(),
          consentTimestamp: data.consentTimestamp?.toDate(),
        } as VoiceSample;
      }
      return null;
    } catch (error) {
      console.error('Error getting voice sample:', error);
      return null;
    }
  }

  /**
   * Update voice sample
   */
  async updateVoiceSample(sampleId: string, updates: Partial<VoiceSample>): Promise<void> {
    try {
      const docRef = doc(db, this.voiceSamplesCollection, sampleId);
      
      const updateData: any = { ...updates };
      
      // Convert dates to Timestamps
      if (updates.editTimestamp) {
        updateData.editTimestamp = Timestamp.fromDate(updates.editTimestamp);
      }
      if (updates.verificationTimestamp) {
        updateData.verificationTimestamp = Timestamp.fromDate(updates.verificationTimestamp);
      }
      if (updates.reviewTimestamp) {
        updateData.reviewTimestamp = Timestamp.fromDate(updates.reviewTimestamp);
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating voice sample:', error);
      throw new Error('Failed to update voice sample');
    }
  }

  /**
   * Delete voice sample (soft delete)
   */
  async deleteVoiceSample(sampleId: string): Promise<void> {
    try {
      const docRef = doc(db, this.voiceSamplesCollection, sampleId);
      await updateDoc(docRef, {
        status: 'deleted',
        deletedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error deleting voice sample:', error);
      throw new Error('Failed to delete voice sample');
    }
  }

  /**
   * Permanently delete voice sample
   */
  async permanentlyDeleteVoiceSample(sampleId: string): Promise<void> {
    try {
      const docRef = doc(db, this.voiceSamplesCollection, sampleId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error permanently deleting voice sample:', error);
      throw new Error('Failed to permanently delete voice sample');
    }
  }

  /**
   * Get voice samples by business ID
   */
  async getVoiceSamplesByBusiness(
    businessId: string,
    limitCount: number = 50,
    startAfter?: Date
  ): Promise<VoiceSample[]> {
    try {
      let q = query(
        collection(db, this.voiceSamplesCollection),
        where('businessId', '==', businessId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      if (startAfter) {
        q = query(
          collection(db, this.voiceSamplesCollection),
          where('businessId', '==', businessId),
          orderBy('timestamp', 'desc'),
          where('timestamp', '<', Timestamp.fromDate(startAfter)),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          timestamp: data.timestamp?.toDate() || new Date(),
          editTimestamp: data.editTimestamp?.toDate(),
          verificationTimestamp: data.verificationTimestamp?.toDate(),
          reviewTimestamp: data.reviewTimestamp?.toDate(),
          consentTimestamp: data.consentTimestamp?.toDate(),
        } as VoiceSample;
      });
    } catch (error) {
      console.error('Error getting voice samples:', error);
      return [];
    }
  }

  /**
   * Get voice samples by user ID
   */
  async getVoiceSamplesByUser(userId: string): Promise<VoiceSample[]> {
    try {
      const q = query(
        collection(db, this.voiceSamplesCollection),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          timestamp: data.timestamp?.toDate() || new Date(),
          editTimestamp: data.editTimestamp?.toDate(),
          verificationTimestamp: data.verificationTimestamp?.toDate(),
          reviewTimestamp: data.reviewTimestamp?.toDate(),
          consentTimestamp: data.consentTimestamp?.toDate(),
        } as VoiceSample;
      });
    } catch (error) {
      console.error('Error getting user voice samples:', error);
      return [];
    }
  }

  /**
   * Get voice samples by language
   */
  async getVoiceSamplesByLanguage(
    language: SupportedLanguage,
    limitCount: number = 100
  ): Promise<VoiceSample[]> {
    try {
      const q = query(
        collection(db, this.voiceSamplesCollection),
        where('detectedLanguage', '==', language),
        where('trainingEligibility', '==', 'eligible'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          timestamp: data.timestamp?.toDate() || new Date(),
          editTimestamp: data.editTimestamp?.toDate(),
          verificationTimestamp: data.verificationTimestamp?.toDate(),
          reviewTimestamp: data.reviewTimestamp?.toDate(),
          consentTimestamp: data.consentTimestamp?.toDate(),
        } as VoiceSample;
      });
    } catch (error) {
      console.error('Error getting voice samples by language:', error);
      return [];
    }
  }

  /**
   * Get samples flagged for review
   */
  async getSamplesForReview(limitCount: number = 50): Promise<VoiceSample[]> {
    try {
      const q = query(
        collection(db, this.voiceSamplesCollection),
        where('status', 'in', ['flagged_for_review', 'under_review']),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          timestamp: data.timestamp?.toDate() || new Date(),
          editTimestamp: data.editTimestamp?.toDate(),
          verificationTimestamp: data.verificationTimestamp?.toDate(),
          reviewTimestamp: data.reviewTimestamp?.toDate(),
          consentTimestamp: data.consentTimestamp?.toDate(),
        } as VoiceSample;
      });
    } catch (error) {
      console.error('Error getting samples for review:', error);
      return [];
    }
  }

  /**
   * Get or create user consent preferences
   */
  async getConsentPreferences(userId: string): Promise<VoiceConsentPreferences | null> {
    try {
      const docRef = doc(db, this.voiceConsentCollection, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as VoiceConsentPreferences;
      }
      return null;
    } catch (error) {
      console.error('Error getting consent preferences:', error);
      return null;
    }
  }

  /**
   * Save user consent preferences
   */
  async saveConsentPreferences(preferences: VoiceConsentPreferences): Promise<void> {
    try {
      const docRef = doc(db, this.voiceConsentCollection, preferences.userId);
      await setDoc(docRef, {
        ...preferences,
        consentTimestamp: Timestamp.fromDate(preferences.consentTimestamp),
        withdrawalTimestamp: preferences.withdrawalTimestamp 
          ? Timestamp.fromDate(preferences.withdrawalTimestamp) 
          : null,
      });
    } catch (error) {
      console.error('Error saving consent preferences:', error);
      throw new Error('Failed to save consent preferences');
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(businessId?: string, startDate?: Date, endDate?: Date): Promise<VoiceAnalytics> {
    try {
      let q = query(
        collection(db, this.voiceSamplesCollection),
        orderBy('timestamp', 'desc')
      );

      if (businessId) {
        q = query(
          collection(db, this.voiceSamplesCollection),
          where('businessId', '==', businessId),
          orderBy('timestamp', 'desc')
        );
      }

      if (startDate && endDate) {
        q = query(
          collection(db, this.voiceSamplesCollection),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          where('timestamp', '<=', Timestamp.fromDate(endDate)),
          orderBy('timestamp', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const samples = querySnapshot.docs.map(doc => doc.data() as VoiceSample);

      return this.calculateAnalytics(samples);
    } catch (error) {
      console.error('Error getting analytics:', error);
      return this.getEmptyAnalytics();
    }
  }

  /**
   * Calculate analytics from samples
   */
  private calculateAnalytics(samples: VoiceSample[]): VoiceAnalytics {
    const analytics: VoiceAnalytics = {
      totalSamplesProcessed: samples.length,
      samplesByLanguage: {} as any,
      samplesByBusinessCategory: {},
      averageConfidenceScore: 0,
      correctionRate: 0,
      trainingEligibleCount: 0,
      reviewBacklogCount: 0,
      processingSuccessRate: 0,
      timeRange: {
        start: new Date(),
        end: new Date()
      },
      topDifficultWords: [],
      topDifficultTerms: [],
      datasetGrowth: [],
      topContributors: []
    };

    if (samples.length === 0) return analytics;

    // Calculate basic metrics
    let totalConfidence = 0;
    let confidenceCount = 0;
    let correctedCount = 0;
    let successfulCount = 0;

    samples.forEach(sample => {
      // Language distribution
      const lang = sample.detectedLanguage || 'en';
      analytics.samplesByLanguage[lang] = (analytics.samplesByLanguage[lang] || 0) + 1;

      // Business category distribution
      const category = sample.businessCategory;
      analytics.samplesByBusinessCategory[category] = 
        (analytics.samplesByBusinessCategory[category] || 0) + 1;

      // Confidence score
      if (sample.confidenceScore) {
        totalConfidence += sample.confidenceScore;
        confidenceCount++;
      }

      // Correction rate
      if (sample.isEdited) {
        correctedCount++;
      }

      // Training eligible
      if (sample.trainingEligibility === 'eligible') {
        analytics.trainingEligibleCount++;
      }

      // Review backlog
      if (sample.status === 'flagged_for_review') {
        analytics.reviewBacklogCount++;
      }

      // Success rate
      if (sample.status === 'completed' || sample.status === 'approved') {
        successfulCount++;
      }

      // Time range
      if (sample.timestamp < analytics.timeRange.start) {
        analytics.timeRange.start = sample.timestamp;
      }
      if (sample.timestamp > analytics.timeRange.end) {
        analytics.timeRange.end = sample.timestamp;
      }

      // Top contributors
      const contributor = sample.businessId;
      const existingContributor = analytics.topContributors.find(c => c.businessId === contributor);
      if (existingContributor) {
        existingContributor.count++;
      } else {
        analytics.topContributors.push({ businessId: contributor, count: 1 });
      }
    });

    analytics.averageConfidenceScore = confidenceCount > 0 
      ? totalConfidence / confidenceCount 
      : 0;
    analytics.correctionRate = samples.length > 0 
      ? (correctedCount / samples.length) * 100 
      : 0;
    analytics.processingSuccessRate = samples.length > 0 
      ? (successfulCount / samples.length) * 100 
      : 0;

    // Sort top contributors
    analytics.topContributors.sort((a, b) => b.count - a.count);
    analytics.topContributors = analytics.topContributors.slice(0, 10);

    return analytics;
  }

  private getEmptyAnalytics(): VoiceAnalytics {
    return {
      totalSamplesProcessed: 0,
      samplesByLanguage: {},
      samplesByBusinessCategory: {},
      averageConfidenceScore: 0,
      correctionRate: 0,
      trainingEligibleCount: 0,
      reviewBacklogCount: 0,
      processingSuccessRate: 0,
      timeRange: {
        start: new Date(),
        end: new Date()
      },
      topDifficultWords: [],
      topDifficultTerms: [],
      datasetGrowth: [],
      topContributors: []
    };
  }

  /**
   * Create training dataset
   */
  async createTrainingDataset(dataset: TrainingDataset): Promise<string> {
    try {
      const docRef = doc(db, this.trainingDatasetsCollection, dataset.id);
      await setDoc(docRef, {
        ...dataset,
        createdAt: Timestamp.fromDate(dataset.createdAt),
        updatedAt: Timestamp.fromDate(dataset.updatedAt),
        metadata: {
          ...dataset.metadata,
          dateRange: {
            start: Timestamp.fromDate(dataset.metadata.dateRange.start),
            end: Timestamp.fromDate(dataset.metadata.dateRange.end)
          }
        }
      });
      return dataset.id;
    } catch (error) {
      console.error('Error creating training dataset:', error);
      throw new Error('Failed to create training dataset');
    }
  }

  /**
   * Update training dataset
   */
  async updateTrainingDataset(datasetId: string, updates: Partial<TrainingDataset>): Promise<void> {
    try {
      const docRef = doc(db, this.trainingDatasetsCollection, datasetId);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating training dataset:', error);
      throw new Error('Failed to update training dataset');
    }
  }
}

export const voiceDatabase = new VoiceDatabaseService();