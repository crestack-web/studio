'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { Button } from './Button';
import { AvatarOption } from './types';
import { AVATAR_COLORS, AVATAR_EMOJIS } from './avatarConfig';
import { getSupabase } from '@/lib/supabase';
import styles from './AvatarModal.module.css';

/**
 * Avatar modal — persists to Supabase (users.avatar_url + metadata + auth user_metadata)
 * so AppContext loadUser restores the same avatar after refresh.
 */
export function AvatarModal() {
  const { avatarModalOpen, closeAvatarModal, saveAvatar, user, showToast } =
    useApp();
  const [selected, setSelected] = useState<AvatarOption | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeAvatarModal();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeAvatarModal]);

  // Reset selection when opening
  useEffect(() => {
    if (avatarModalOpen) {
      setSelected(null);
      setUploadedImage(null);
    }
  }, [avatarModalOpen]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB');
      return;
    }
    if (!user?.id) {
      showToast('Not signed in');
      return;
    }

    setUploading(true);
    try {
      const supabase = getSupabase();
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `avatars/${user.id}/${Date.now()}.${ext}`;

      // Prefer public "avatars" bucket; fall back to "products" path if needed
      let publicUrl: string | null = null;
      let lastError: any = null;

      for (const bucket of ['avatars', 'products', 'public']) {
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, { upsert: true, contentType: file.type });
        if (uploadError) {
          lastError = uploadError;
          continue;
        }
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        publicUrl = data.publicUrl;
        break;
      }

      if (!publicUrl) {
        // Last resort: data URL (persists in DB, no storage bucket required)
        publicUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        if (lastError) {
          console.warn(
            'Storage upload failed, using data URL',
            lastError.message
          );
        }
      }

      setUploadedImage(publicUrl);
      setSelected({
        id: 'uploaded',
        type: 'color',
        content: publicUrl,
        bg: publicUrl,
        color: '#fff',
      });
      showToast('Image ready — tap Save Avatar');
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      showToast(error?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  async function persistAvatar(payload: {
    photoURL: string | null;
    avatarContent: string;
    avatarBg: string;
    avatarColor: string;
  }) {
    const supabase = getSupabase();
    const uid = user.id;
    if (!uid) throw new Error('Not signed in');

    // 1) Auth user_metadata — survives refresh via session
    await supabase.auth.updateUser({
      data: {
        photoURL: payload.photoURL,
        avatar_url: payload.photoURL,
        avatarContent: payload.avatarContent,
        avatarBg: payload.avatarBg,
        avatarColor: payload.avatarColor,
      },
    });

    // 2) public.users row (avatar_url + metadata)
    const { data: existing } = await supabase
      .from('users')
      .select('id, metadata')
      .eq('id', uid)
      .maybeSingle();

    const prevMeta =
      existing?.metadata && typeof existing.metadata === 'object'
        ? (existing.metadata as Record<string, unknown>)
        : {};

    const nextMeta = {
      ...prevMeta,
      photoURL: payload.photoURL,
      avatarContent: payload.avatarContent,
      avatarBg: payload.avatarBg,
      avatarColor: payload.avatarColor,
    };

    const row = {
      avatar_url: payload.photoURL,
      metadata: nextMeta,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error } = await supabase.from('users').update(row).eq('id', uid);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('users').upsert({
        id: uid,
        email: user.email || null,
        ...row,
      });
      if (error) throw error;
    }
  }

  async function handleSave() {
    if (!selected && !uploadedImage) {
      showToast('Pick an avatar first!');
      return;
    }

    setSaving(true);
    try {
      if (uploadedImage) {
        await persistAvatar({
          photoURL: uploadedImage,
          avatarContent: uploadedImage,
          avatarBg: uploadedImage,
          avatarColor: '#fff',
        });
        saveAvatar({
          content: uploadedImage,
          bg: uploadedImage,
          color: '#fff',
        });
      } else if (selected) {
        const content =
          selected.type === 'color' ? user.initials || selected.content : selected.content;
        const isHttp =
          typeof selected.bg === 'string' &&
          (selected.bg.startsWith('http') || selected.bg.startsWith('data:'));
        await persistAvatar({
          photoURL: isHttp ? selected.bg : null,
          avatarContent: content,
          avatarBg: selected.bg,
          avatarColor: selected.color,
        });
        saveAvatar(
          selected.type === 'color'
            ? { ...selected, content: user.initials }
            : selected
        );
      }

      showToast('Avatar updated');
      closeAvatarModal();
    } catch (error: any) {
      console.error('Error saving avatar:', error);
      showToast(error?.message || 'Failed to save avatar. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!avatarModalOpen) return null;

  const preview = selected ?? {
    content: user.avatarContent,
    bg: (user.avatarStyle?.background as string) ?? 'var(--purple)',
    color: (user.avatarStyle?.color as string) ?? '#fff',
  };

  const isImagePreview =
    typeof preview.bg === 'string' &&
    (preview.bg.startsWith('http') || preview.bg.startsWith('data:'));

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAvatarModal();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Choose avatar"
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Choose Your Profile Avatar</h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeAvatarModal}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.preview}>
            <div
              className={styles.previewCircle}
              style={{
                background: isImagePreview
                  ? `url(${preview.bg}) center/cover`
                  : preview.bg,
                color: preview.color,
              }}
            >
              {!isImagePreview && preview.content}
            </div>
            <div className={styles.previewInfo}>
              <h4 className={styles.previewName}>{user.name}</h4>
              <p className={styles.previewRole}>
                {user.role} · {user.plan}
              </p>
            </div>
          </div>

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
              disabled={uploading || saving}
            >
              {uploading ? 'Uploading...' : '📷 Choose Image'}
            </Button>
            <p className={styles.uploadHint}>JPG, PNG or GIF (max 5MB)</p>
          </div>

          <div className={styles.sectionLabel} style={{ marginTop: 16 }}>
            Color Avatars
          </div>
          <div className={styles.grid}>
            {AVATAR_COLORS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={[
                  styles.avatarOpt,
                  selected?.id === opt.id ? styles.selected : '',
                ].join(' ')}
                style={{ background: opt.bg, color: opt.color }}
                onClick={() => setSelected({ ...opt, content: user.initials })}
                aria-label={`Color avatar ${opt.id}`}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1rem',
                    fontWeight: 700,
                  }}
                >
                  {user.initials}
                </span>
              </button>
            ))}
          </div>

          <div className={styles.sectionLabel} style={{ marginTop: 8 }}>
            Emoji Avatars
          </div>
          <div className={styles.grid}>
            {AVATAR_EMOJIS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={[
                  styles.avatarOpt,
                  styles.emojiOpt,
                  selected?.id === opt.id ? styles.selected : '',
                ].join(' ')}
                onClick={() => setSelected(opt)}
                aria-label={`Emoji avatar ${opt.content}`}
              >
                {opt.content}
              </button>
            ))}
          </div>

          <div className={styles.actions}>
            <Button
              variant="primary"
              fullWidth
              onClick={handleSave}
              disabled={uploading || saving}
            >
              {saving ? 'Saving…' : 'Save Avatar'}
            </Button>
            <Button variant="subtle" fullWidth onClick={closeAvatarModal}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
