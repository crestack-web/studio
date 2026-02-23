import React from 'react';
import styles from './Toggle.module.css';

// ═══════════════════════════════════════════
//  Toggle — settings row with label & switch
// ═══════════════════════════════════════════

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
}

export function Toggle({ label, description, checked, onChange, id }: ToggleProps) {
  return (
    <div className={styles.row}>
      <div className={styles.info}>
        <div className={styles.label}>{label}</div>
        {description && <div className={styles.description}>{description}</div>}
      </div>
      <label className={styles.toggle} htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <span className={styles.slider} />
      </label>
    </div>
  );
}
