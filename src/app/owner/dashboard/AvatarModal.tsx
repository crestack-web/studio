import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { Button } from './Button';
import { AvatarOption } from './types';
import { AVATAR_COLORS, AVATAR_EMOJIS } from './avatarConfig';
import { initializeFirebase } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import styles from './AvatarModal.module.css';

// ═══════════════════════════════════════════
//  AvatarModal
//  Upload profile picture or choose colour/emoji avatar
// ═══════════════════════════════════════════

export function AvatarModal() {
  const { avatarModalOpen, closeAvatarModal, saveAvatar, user, showToast } = useApp();
  const [selected, setSelected] = useState<AvatarOption | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeAvatarModal();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeAvatarModal]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const { storage, firestore } = initializeFirebase();
      
      if (!storage) {
        console.error('❌ Firebase Storage not initialized');
        showToast('❌ Storage not available. Please check your connection.');
        return;
      }
      
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `avatars/${user.id}_${timestamp}`;
      const imageRef = ref(storage, filename);
      console.log('📤 Image ref:', imageRef.fullPath);

      // Upload the file
      const uploadResult = await uploadBytes(imageRef, file);
      console.log('✅ Image uploaded successfully:', uploadResult);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(imageRef);
      console.log('✅ Image URL obtained:', downloadURL);
      
      setUploadedImage(downloadURL);
      setSelected({ id: 'uploaded', type: 'color', content: downloadURL, bg: downloadURL, color: '#fff' });
      showToast('✅ Image uploaded successfully!');
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      console.error('Upload error details:', {
        code: (error as any).code,
        message: (error as any).message,
        serverResponse: (error as any).serverResponse,
      });
      
      // Provide user-friendly error messages based on error type
      const errorCode = (error as any).code;
      if (errorCode === 'storage/unauthorized') {
        showToast('❌ Permission denied. You may not have access to upload images.');
      } else if (errorCode === 'storage/canceled') {
        showToast('❌ Upload was cancelled.');
      } else if (errorCode === 'storage/unknown') {
        showToast('❌ Upload failed. Please check your internet connection.');
      } else {
        showToast('❌ Failed to upload image: ' + (error as any).message);
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!selected && !uploadedImage) return showToast('Pick an avatar first!');
    
    try {
      const { firestore } = initializeFirebase();
      
      if (uploadedImage) {
        // Save uploaded image URL to Firestore
        await updateDoc(doc(firestore, 'users', user.id), {
          photoURL: uploadedImage,
          avatarContent: uploadedImage,
          avatarBg: uploadedImage,
          avatarColor: '#fff',
        });
        
        // Update local state
        saveAvatar({ content: uploadedImage, bg: uploadedImage, color: '#fff' });
      } else if (selected) {
        // For color/emoji avatars, clear photoURL and save the selected option
        await updateDoc(doc(firestore, 'users', user.id), {
          photoURL: null,
          avatarContent: selected.type === 'color' ? user.initials : selected.content,
          avatarBg: selected.bg,
          avatarColor: selected.color,
        });
        
        // Update local state with real initials for color avatars
        const optionToSave = selected.type === 'color' 
          ? { ...selected, content: user.initials }
          : selected;
        saveAvatar(optionToSave);
      }
      
      showToast('✅ Avatar updated!');
      closeAvatarModal();
    } catch (error) {
      console.error('Error saving avatar:', error);
      showToast('Failed to save avatar. Please try again.');
    }
  }

  if (!avatarModalOpen) return null;

  const preview = selected ?? {
    content: user.avatarContent,
    bg: (user.avatarStyle?.background as string) ?? 'var(--purple)',
    color: (user.avatarStyle?.color as string) ?? '#fff',
  };

  const isImagePreview = preview.bg.startsWith('http') || preview.bg.startsWith('data:');

  return (
    <div
      className={styles.overlay}
      onClick={e => { if (e.target === e.currentTarget) closeAvatarModal(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Choose avatar"
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Choose Your Profile Avatar</h3>
          <button className={styles.closeBtn} onClick={closeAvatarModal} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          {/* Preview */}
          <div className={styles.preview}>
            <div
              className={styles.previewCircle}
              style={{ 
                background: isImagePreview ? `url(${preview.bg}) center/cover` : preview.bg, 
                color: preview.color 
              }}
            >
              {!isImagePreview && preview.content}
            </div>
            <div className={styles.previewInfo}>
              <h4 className={styles.previewName}>{user.name}</h4>
              <p className={styles.previewRole}>{user.role} · {user.plan}</p>
            </div>
          </div>

          {/* Upload Profile Picture */}
          <div className={styles.sectionLabel}>Upload Profile Picture</div>
          <div className={styles.uploadSection}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <Button 
              variant="subtle" 
              fullWidth 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : '📷 Choose Image'}
            </Button>
            <p className={styles.uploadHint}>JPG, PNG or GIF (max 5MB)</p>
          </div>

          {/* Color avatars with real initials */}
          <div className={styles.sectionLabel} style={{ marginTop: 16 }}>Color Avatars</div>
          <div className={styles.grid}>
            {AVATAR_COLORS.map(opt => (
              <button
                key={opt.id}
                className={[styles.avatarOpt, selected?.id === opt.id ? styles.selected : ''].join(' ')}
                style={{ background: opt.bg, color: opt.color }}
                onClick={() => setSelected({ ...opt, content: user.initials })}
                aria-label={`Color avatar ${opt.id}`}
              >
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>
                  {user.initials}
                </span>
              </button>
            ))}
          </div>

          {/* Emoji avatars */}
          <div className={styles.sectionLabel} style={{ marginTop: 8 }}>Emoji Avatars</div>
          <div className={styles.grid}>
            {AVATAR_EMOJIS.map(opt => (
              <button
                key={opt.id}
                className={[styles.avatarOpt, styles.emojiOpt, selected?.id === opt.id ? styles.selected : ''].join(' ')}
                onClick={() => setSelected(opt)}
                aria-label={`Emoji avatar ${opt.content}`}
              >
                {opt.content}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Button variant="primary" fullWidth onClick={handleSave} disabled={uploading}>
              Save Avatar
            </Button>
            <Button variant="subtle" fullWidth onClick={closeAvatarModal}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
