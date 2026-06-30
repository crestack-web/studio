/**
 * Voice Learning Pipeline - Dataset Export Service
 * Exports training datasets for model fine-tuning
 */

import { voiceDatabase } from './voice-database.service';
import { 
  type TrainingDataset,
  type DatasetExportOptions,
  type DatasetExportResult,
  type VoiceSample,
  type SupportedLanguage
} from './types';

export class VoiceExportService {
  /**
   * Export training dataset
   */
  async exportDataset(options: DatasetExportOptions): Promise<DatasetExportResult> {
    try {
      const samples = await this.getFilteredSamples(options);
      
      if (samples.length === 0) {
        return {
          success: false,
          sampleCount: 0,
          format: options.format,
          exportedAt: new Date(),
          metadata: {
            languages: {},
            categories: {},
            totalDuration: 0
          }
        };
      }

      const exportData = this.generateExportData(samples, options);
      const metadata = this.calculateMetadata(samples);

      // In a real implementation, this would:
      // 1. Generate the export file (CSV/JSON)
      // 2. Upload to Firebase Storage
      // 3. Return a download URL

      return {
        success: true,
        sampleCount: samples.length,
        format: options.format,
        exportedAt: new Date(),
        metadata
      };

    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        sampleCount: 0,
        format: options.format,
        exportedAt: new Date(),
        metadata: {
          languages: {},
          categories: {},
          totalDuration: 0
        }
      };
    }
  }

  /**
   * Get filtered samples based on export options
   */
  private async getFilteredSamples(options: DatasetExportOptions): Promise<VoiceSample[]> {
    let samples: VoiceSample[] = [];

    // Get eligible samples
    if (options.filterByLanguage) {
      samples = await voiceDatabase.getVoiceSamplesByLanguage(options.filterByLanguage, 1000);
    } else if (options.filterByCategory) {
      // This would require a new database method
      samples = []; // Placeholder
    } else {
      // Get all eligible samples
      samples = await voiceDatabase.getVoiceSamplesByLanguage('en', 1000); // Placeholder
    }

    // Apply additional filters
    return samples.filter(sample => {
      // Date range filter
      if (options.filterByDateRange) {
        if (sample.timestamp < options.filterByDateRange.start || 
            sample.timestamp > options.filterByDateRange.end) {
          return false;
        }
      }

      // Quality filter
      if (options.filterByQuality && sample.qualityMetrics) {
        if (sample.qualityMetrics.qualityScore < options.filterByQuality) {
          return false;
        }
      }

      // Only include verified, eligible samples with consent
      return (
        sample.isVerified &&
        sample.trainingEligibility === 'eligible' &&
        sample.consentGiven &&
        sample.correctedTranscript !== undefined
      );
    }).slice(0, options.maxSamples || 1000);
  }

  /**
   * Generate export data in specified format
   */
  private generateExportData(samples: VoiceSample[], options: DatasetExportOptions): any {
    const baseData = samples.map(sample => ({
      id: sample.id,
      audio_path: options.includeAudioReferences ? sample.audioUrl : undefined,
      transcript: sample.correctedTranscript || sample.originalTranscript,
      language: sample.detectedLanguage,
      dialect: sample.dialect,
      business_category: sample.businessCategory,
      confidence_score: sample.confidenceScore,
      verified: sample.isVerified,
      user_corrected: sample.isEdited,
      duration: sample.audioDuration,
      timestamp: sample.timestamp.toISOString()
    }));

    switch (options.format) {
      case 'json':
        return JSON.stringify(baseData, null, 2);
      
      case 'csv':
        return this.convertToCSV(baseData);
      
      case 'manifest':
      default:
        return this.generateManifest(baseData, samples);
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === undefined || value === null) {
          return '';
        }
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Generate manifest format (for Whisper, Parakeet, etc.)
   */
  private generateManifest(data: any[], samples: VoiceSample[]): any {
    return {
      dataset_info: {
        name: 'Busmo Voice Training Dataset',
        version: '1.0.0',
        created_at: new Date().toISOString(),
        languages: [...new Set(samples.map(s => s.detectedLanguage))],
        total_samples: samples.length,
        total_duration_hours: this.calculateTotalDuration(samples)
      },
      samples: data.map(item => ({
        audio_filepath: item.audio_path,
        text: item.transcript,
        language: item.language,
        dialect: item.dialect,
        metadata: {
          business_category: item.business_category,
          confidence_score: item.confidence_score,
          verified: item.verified,
          user_corrected: item.user_corrected
        }
      }))
    };
  }

  /**
   * Calculate metadata for export
   */
  private calculateMetadata(samples: VoiceSample[]): {
    languages: Record<string, number>;
    categories: Record<string, number>;
    totalDuration: number;
  } {
    const languages: Record<string, number> = {};
    const categories: Record<string, number> = {};
    let totalDuration = 0;

    samples.forEach(sample => {
      const lang = sample.detectedLanguage || 'unknown';
      languages[lang] = (languages[lang] || 0) + 1;

      const category = sample.businessCategory;
      categories[category] = (categories[category] || 0) + 1;

      if (sample.audioDuration) {
        totalDuration += sample.audioDuration;
      }
    });

    return { languages, categories, totalDuration };
  }

  /**
   * Calculate total duration in hours
   */
  private calculateTotalDuration(samples: VoiceSample[]): number {
    const totalSeconds = samples.reduce((sum, sample) => {
      return sum + (sample.audioDuration || 0);
    }, 0);
    return totalSeconds / 3600;
  }

  /**
   * Create a new training dataset
   */
  async createDataset(
    name: string,
    language: SupportedLanguage,
    description?: string
  ): Promise<TrainingDataset> {
    const now = new Date();
    const dataset: TrainingDataset = {
      id: `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      language,
      samples: [],
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      status: 'draft',
      metadata: {
        totalDuration: 0,
        totalSamples: 0,
        averageQuality: 0,
        businessCategories: [],
        dateRange: {
          start: now,
          end: now
        }
      }
    };

    await voiceDatabase.createTrainingDataset(dataset);
    return dataset;
  }

  /**
   * Add samples to dataset
   */
  async addSamplesToDataset(datasetId: string, sampleIds: string[]): Promise<void> {
    const dataset = await voiceDatabase.getVoiceSamplesByLanguage('en'); // Placeholder
    
    // Update dataset with new samples
    await voiceDatabase.updateTrainingDataset(datasetId, {
      samples: sampleIds,
      updatedAt: new Date()
    });
  }

  /**
   * Generate quality report
   */
  async generateQualityReport(businessId?: string): Promise<{
    totalSamples: number;
    verifiedSamples: number;
    eligibleSamples: number;
    averageQuality: number;
    languageDistribution: Record<string, number>;
    correctionRate: number;
    recommendations: string[];
  }> {
    const samples = businessId 
      ? await voiceDatabase.getVoiceSamplesByBusiness(businessId, 1000)
      : [];

    const verified = samples.filter(s => s.isVerified).length;
    const eligible = samples.filter(s => s.trainingEligibility === 'eligible').length;
    const corrected = samples.filter(s => s.isEdited).length;

    const languageDistribution: Record<string, number> = {};
    samples.forEach(sample => {
      const lang = sample.detectedLanguage || 'unknown';
      languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
    });

    const recommendations: string[] = [];
    
    if (corrected / samples.length > 0.3) {
      recommendations.push('High correction rate detected. Consider improving speech recognition model.');
    }

    if (eligible / samples.length < 0.5) {
      recommendations.push('Low eligibility rate. Review quality standards and verification process.');
    }

    const languages = Object.keys(languageDistribution);
    if (languages.length === 1) {
      recommendations.push('Consider collecting more diverse language samples.');
    }

    return {
      totalSamples: samples.length,
      verifiedSamples: verified,
      eligibleSamples: eligible,
      averageQuality: 75, // Placeholder
      languageDistribution,
      correctionRate: samples.length > 0 ? (corrected / samples.length) * 100 : 0,
      recommendations
    };
  }
}

export const voiceExport = new VoiceExportService();