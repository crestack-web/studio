'use client';

import React, { useEffect, useState } from 'react';
import { useSell } from '../context/SellContext';
import { StorefrontCanvas } from '../components/StorefrontCanvas';
import { CartProvider } from '@/app/store/[storeSlug]/context/CartContext';
import type { StorefrontTheme, StoreSection } from '@/app/sell/mo-sell.types';
import styles from './ThemeEditorPage.module.css';

interface MobilePreviewPageProps {
  theme: StorefrontTheme;
  storeName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  sections: StoreSection[];
  storeSlug: string;
  products: any[];
  collections: any[];
  fontFamily?: string | null;
  buttonStyle?: 'pill' | 'square' | 'rounded';
  bodyTextColor?: string | null;
  hideStoreNameWithLogo?: boolean;
}

export function MobilePreviewPage() {
  const { storeConfig } = useSell();
  const [previewData, setPreviewData] = useState<MobilePreviewPageProps | null>(null);

  useEffect(() => {
    // Load preview data from sessionStorage
    const stored = sessionStorage.getItem('mobilePreviewData');
    if (stored) {
      try {
        setPreviewData(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse preview data:', e);
      }
    }
  }, []);

  if (!previewData) {
    return (
      <div className={styles.mobilePreviewLoading}>
        <div className={styles.loadingSpinner} />
        <p>Loading preview...</p>
      </div>
    );
  }

  const { theme, storeName, tagline, primaryColor, secondaryColor, logoUrl, sections, storeSlug, products, collections, fontFamily, buttonStyle, bodyTextColor, hideStoreNameWithLogo } = previewData;

  return (
    <div className={styles.mobilePreviewPage}>
      <div className={styles.mobilePreviewHeader}>
        <button 
          className={styles.backButton}
          onClick={() => window.close()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Editor
        </button>
        <span className={styles.previewTitle}>Mobile Preview</span>
      </div>

      <div className={styles.phoneMockupContainer}>
        <div className={styles.phoneFrame}>
          <div className={styles.phoneBezel}>
            <div className={styles.phoneNotch} />
            <div className={styles.phoneScreen}>
              <CartProvider storeSlug={storeSlug}>
                <StorefrontCanvas
                  theme={theme}
                  storeName={storeName}
                  tagline={tagline}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  logoUrl={logoUrl}
                  sections={sections}
                  width={375}
                  storeSlug={storeSlug}
                  products={products}
                  collections={collections}
                  fontFamily={fontFamily ?? null}
                  buttonStyle={buttonStyle}
                  bodyTextColor={bodyTextColor ?? null}
                  hideStoreNameWithLogo={hideStoreNameWithLogo}
                />
              </CartProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
