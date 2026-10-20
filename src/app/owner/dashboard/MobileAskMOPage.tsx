'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { ReceiptGenerator, type ReceiptData } from './ReceiptGenerator';
import { loadBusinessReceiptSettings, buildSaleReceiptData } from './utils/saleReceipt';
import { useCurrency } from './CurrencyContext';
import { useTranslation } from './LangContext';
import { MoIcon } from './NavIcons';
import { Lightbulb, BarChart, DollarSign, Package, Heart, Plus, Cpu, Settings, Trash2 } from 'lucide-react';
import styles from './MobileAskMOPage.module.css';
import { useAskMO } from './useAskMO';
import { getSupabase } from '@/lib/supabase';
import { CreditPurchaseModal } from '@/components/CreditPurchaseModal';
import { SaleConfirmationCard } from '@/components/SaleConfirmationCard';
import { useIsMobileStrict } from '@/hooks/use-mobile';

export function MobileAskMOPage() {
  const { user, showToast, navigateTo, theme } = useApp();
  const isMobile = useIsMobileStrict();

  useEffect(() => {
    if (isMobile === false) {
      navigateTo('home');
    }
  }, [isMobile, navigateTo]);

  if (isMobile !== true) {
    return null;
  }

  return <MobileAskMOInner />;
}

function MobileAskMOInner() {
  return (
    <div className={styles.page}>
      <p style={{ padding: 16 }}>Loading mobile Ask MO… If this persists, hard-refresh.</p>
    </div>
  );
}
