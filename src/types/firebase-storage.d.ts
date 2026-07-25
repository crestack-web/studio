// Firebase v12 removed the .d.ts from @firebase/storage package.
// This restores the client-side exports that 9 files depend on.

declare module 'firebase/storage' {
  import { FirebaseApp } from 'firebase/app';

  export function getStorage(app?: FirebaseApp, bucketUrl?: string): FirebaseStorage;
  export function ref(storage: FirebaseStorage, path?: string): StorageReference;
  export function uploadBytes(
    ref: StorageReference,
    data: Blob | Uint8Array | ArrayBuffer,
    metadata?: UploadMetadata
  ): Promise<UploadTaskSnapshot>;
  export function getDownloadURL(ref: StorageReference): Promise<string>;
  export function deleteObject(ref: StorageReference): Promise<void>;
  export function uploadString(
    ref: StorageReference,
    value: string,
    format?: string,
    metadata?: UploadMetadata
  ): Promise<UploadTaskSnapshot>;

  export interface FirebaseStorage {
    app: FirebaseApp;
    maxOperationRetryTime: number;
    maxUploadRetryTime: number;
    name: string;
    bucket: string | null;
  }

  export interface StorageReference {
    bucket: string;
    fullPath: string;
    name: string;
    parent: StorageReference | null;
    root: StorageReference;
    storage: FirebaseStorage;
    toString(): string;
  }

  export interface UploadMetadata {
    cacheControl?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    contentType?: string;
    customMetadata?: Record<string, string>;
  }

  export interface UploadTaskSnapshot {
    bytesTransferred: number;
    ref: StorageReference;
    state: string;
    totalBytes: number;
  }
}
