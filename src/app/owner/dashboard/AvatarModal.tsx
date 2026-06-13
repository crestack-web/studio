import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { Button } from './Button';
import { AvatarOption } from './types';
import { AVATAR_COLORS, AVATAR_EMOJIS } from './avatarConfig';
import styles from './AvatarModal.module.css';

// ═══════════════════════════════════════════
//  AvatarModal
//  Pick a colour block or emoji avatar
// ═══════════════════════════════════════════

export function AvatarModal() {
  const { avatarModalOpen, closeAvatarModal, saveAvatar, user, showToast } = useApp();
  const [selected, setSelected] = useState<AvatarOption | null>(null);

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeAvatarModal();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeAvatarModal]);

  function handleSave() {
    if (!selected) return showToast('Pick an avatar first!');
    saveAvatar(selected);
    showToast('✅ Avatar updated!');
  }

  if (!avatarModalOpen) return null;

  const preview = selected ?? {
    content: user.avatarContent,
    bg: (user.avatarStyle?.background as string) ?? 'var(--purple)',
    color: (user.avatarStyle?.color as string) ?? '#fff',
  };

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
              style={{ background: preview.bg, color: preview.color }}
            >
              {preview.content}
            </div>
            <div className={styles.previewInfo}>
              <h4 className={styles.previewName}>{user.name}</h4>
              <p className={styles.previewRole}>{user.role} · {user.plan}</p>
            </div>
          </div>

          {/* Illustrated avatars */}
          <div className={styles.sectionLabel}>Illustrated Avatars</div>
          <div className={styles.grid}>
            {AVATAR_COLORS.map(opt => (
              <button
                key={opt.id}
                className={[styles.avatarOpt, selected?.id === opt.id ? styles.selected : ''].join(' ')}
                style={{ background: opt.bg, color: opt.color }}
                onClick={() => setSelected(opt)}
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
            <Button variant="primary" fullWidth onClick={handleSave}>Save Avatar</Button>
            <Button variant="subtle" fullWidth onClick={closeAvatarModal}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
