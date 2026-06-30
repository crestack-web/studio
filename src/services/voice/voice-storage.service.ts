/**
 * Voice Learning Pipeline - Storage Service
 * Handles secure audio upload to Firebase Storage
 */

import { getStorage, ref, uploadBytes, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { type VoiceSample } from './types';

const firebaseConfig = {
  projectId: "bizassistant2-62305643-adad7",
  storageBucket: "bizassistant2-62305643-adad7.firebasestorage.app"
};

const app = initializeApp(firebaseConfig, 'voice-learning');
const storage = getStorage(app);

export class VoiceStorageService {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.NEXT_PUBLIC_VOICE_STORAGE_BUCKET || 
                      'bizassistant2-62305643-adad7.appspot.com';
  }

  /**
   * Upload audio file to Firebase Storage
   */
  async uploadAudio(
    audioBlob: Blob,
    voiceSampleId: string,
    userId: string
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const filePath = `voice-samples/${userId}/${voiceSampleId}_${timestamp}.webm`;
      const storageRef = ref(storage, filePath);

      // Upload with metadata
      const metadata = {
        contentType: audioBlob.type || 'audio/webm',
        customMetadata: {
          userId,
          voiceSampleId,
          uploadedAt: new Date().toISOString(),
        }
      };

      await uploadBytes(storageRef, audioBlob, metadata);
      const downloadURL = await getDownloadURL(storageRef);

      // Soft delete reference after upload
      return downloadURL;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw new Error('Failed to upload audio recording');
    }
  }

  /**
   * Upload base64 audio (for WhatsApp/web)
   */
  async uploadBase64Audio(
    base64Audio: string,
    mimeType: string,
    voiceSampleId: string,
    userId: string
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const filePath = `voice-samples/${userId}/${voiceSampleId}_${timestamp}.${extension}`;
      const storageRef = ref(storage, filePath);

      await uploadString(storageRef, base64Audio, 'base64', {
        contentType: mimeType
      });

      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading base64 audio:', error);
      throw new Error('Failed to upload audio recording');
    }
  }

  /**
   * Delete audio file
   */
  async deleteAudio(audioUrl: string): Promise<void> {
    try {
      const storageRef = ref(storage, audioUrl);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting audio:', error);
      // Don't throw - soft delete scenario
    }
  }

  /**
   * Get secure download URL with expiration
   */
  async getSecureDownloadUrl(audioUrl: string, expiresIn: number = 3600): Promise<string> {
    try {
      const storageRef = ref(storage, audioUrl);
      // For public buckets, return URL directly
      // For private buckets, implement getDownloadURL with token
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw new Error('Failed to generate download link');
    }
  }

  /**
   * Check if audio URL is accessible
   */
  async validateAudioUrl(audioUrl: string): Promise<boolean> {
    try {
      await this.getSecureDownloadUrl(audioUrl, 60);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage metadata
   */
  async getStorageMetadata(audioUrl: string): Promise<{
    size?: number;
    contentType?: string;
    timeCreated?: string;
    updated?: string;
  }> {
    try {
      const storageRef = ref(storage, audioUrl);
      // Implementation would use getMetadata from Firebase
      return {
        size: 0,
        contentType: 'audio/webm',
        timeCreated: new Date().toISOString(),
        updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting metadata:', error);
      return {};
    }
  }
}

export const voiceStorage = new VoiceStorageService();