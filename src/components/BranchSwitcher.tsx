import React, { useState, useRef, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { useTranslation } from '@/app/owner/dashboard/LangContext';
import styles from './BranchSwitcher.module.css';

export function BranchSwitcher() {
  const { t } = useTranslation();
  const {
    selectedBranchId,
    selectedBranchScope,
    branches,
    setSelectedBranch,
    setSelectedBranchScope,
  } = useBranch();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedBranch = branches.find(b => b.id === selectedBranchId);
  const displayName = selectedBranchScope === 'all'
    ? t('branch.switcher.allBranches')
    : selectedBranch?.name || (branches.length > 0 ? 'Select Branch' : 'No Branches');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBranchSelect = (branchId: string) => {
    if (branchId === 'all') {
      setSelectedBranchScope('all');
    } else {
      setSelectedBranchScope('single');
      setSelectedBranch(branchId);
    }
    setIsOpen(false);
    
    // Refresh data by reloading the page or triggering data refresh
    // This will be handled by the BranchContext listeners
  };

  const handleAddBranch = () => {
    // Navigate to branches page to add new branch
    window.location.href = '/owner/dashboard/branches';
    setIsOpen(false);
  };

  return (
    <div className={styles.branchSwitcher} ref={dropdownRef}>
      <button
        className={styles.branchButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.branchName}>{displayName}</span>
        <span className={`${styles.dropdownIcon} ${isOpen ? styles.open : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <div className={styles.dropdownItem} onClick={() => handleBranchSelect('all')}>
            <span className={styles.dropdownIcon}>🏢</span>
            <span>{t('branch.switcher.allBranches')}</span>
          </div>
          <div className={styles.divider} />
          {branches.map(branch => (
            <div
              key={branch.id}
              className={`${styles.dropdownItem} ${selectedBranchId === branch.id ? styles.active : ''}`}
              onClick={() => handleBranchSelect(branch.id)}
            >
              <span className={styles.dropdownIcon}>📍</span>
              <span>{branch.name}</span>
              {branch.location && (
                <span className={styles.branchLocation}>{branch.location}</span>
              )}
            </div>
          ))}
          <div className={styles.divider} />
          <div className={styles.dropdownItem} onClick={handleAddBranch}>
            <span className={styles.dropdownIcon}>➕</span>
            <span>Add Branch</span>
          </div>
        </div>
      )}
    </div>
  );
}
