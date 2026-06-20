'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Palette, Settings, Eye, Save, Upload, X } from 'lucide-react';
import styles from './ReceiptThemeConfig.module.css';

interface ReceiptTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  fontSize: 'small' | 'medium' | 'large';
  showLogo: boolean;
  showBusinessAddress: boolean;
  showCustomerDetails: boolean;
  showBarcode: boolean;
  customHeader?: string;
  customFooter?: string;
  logoUrl?: string;
}

const DEFAULT_THEMES: ReceiptTheme[] = [
  {
    id: 'classic',
    name: 'Classic',
    primaryColor: '#000000',
    secondaryColor: '#333333',
    textColor: '#000000',
    backgroundColor: '#FFFFFF',
    fontSize: 'medium',
    showLogo: true,
    showBusinessAddress: true,
    showCustomerDetails: true,
    showBarcode: true,
  },
  {
    id: 'modern',
    name: 'Modern',
    primaryColor: '#6B3FE7',
    secondaryColor: '#4B27B0',
    textColor: '#0A0A0F',
    backgroundColor: '#FFFFFF',
    fontSize: 'medium',
    showLogo: true,
    showBusinessAddress: true,
    showCustomerDetails: true,
    showBarcode: true,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    primaryColor: '#333333',
    secondaryColor: '#666666',
    textColor: '#333333',
    backgroundColor: '#FFFFFF',
    fontSize: 'small',
    showLogo: false,
    showBusinessAddress: false,
    showCustomerDetails: true,
    showBarcode: false,
  },
  {
    id: 'bold',
    name: 'Bold',
    primaryColor: '#DC2626',
    secondaryColor: '#B91C1C',
    textColor: '#000000',
    backgroundColor: '#FFF5F5',
    fontSize: 'large',
    showLogo: true,
    showBusinessAddress: true,
    showCustomerDetails: true,
    showBarcode: true,
  },
];

export function ReceiptThemeConfig() {
  const { showToast, user } = useApp();
  const { firestore } = initializeFirebase();
  
  const [currentTheme, setCurrentTheme] = useState<ReceiptTheme>(DEFAULT_THEMES[0]);
  const [selectedPreset, setSelectedPreset] = useState('classic');
  const [isCustom, setIsCustom] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    loadCurrentTheme();
  }, [firestore, user]);

  const loadCurrentTheme = async () => {
    if (!firestore || !user) return;

    try {
      const businessId = user.id;
      const businessDoc = await getDoc(doc(firestore, 'businesses', businessId));
      
      if (businessDoc.exists()) {
        const savedTheme = businessDoc.data()?.receiptTheme;
        if (savedTheme) {
          setCurrentTheme(savedTheme);
          setIsCustom(!DEFAULT_THEMES.find(t => t.id === savedTheme.id));
          setSelectedPreset(savedTheme.id || 'classic');
        }
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const handlePresetSelect = (themeId: string) => {
    const theme = DEFAULT_THEMES.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme({ ...theme });
      setSelectedPreset(themeId);
      setIsCustom(false);
    }
  };

  const handleColorChange = (field: keyof ReceiptTheme, value: string) => {
    setCurrentTheme(prev => ({ ...prev, [field]: value }));
    setIsCustom(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setCurrentTheme(prev => ({ ...prev, logoUrl: reader.result as string }));
        setIsCustom(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setCurrentTheme(prev => ({ ...prev, logoUrl: '' }));
    setIsCustom(true);
  };

  const handleToggleChange = (field: keyof ReceiptTheme) => {
    setCurrentTheme(prev => ({ ...prev, [field]: !prev[field] }));
    setIsCustom(true);
  };

  const handleSaveTheme = async () => {
    if (!firestore || !user) return;

    try {
      setIsSaving(true);
      const businessId = user.businessId;

      if (!businessId) {
        showToast('Business ID not found');
        return;
      }

      await updateDoc(doc(firestore, 'businesses', businessId), {
        receiptTheme: currentTheme,
      });

      showToast('Receipt theme saved successfully');
    } catch (error) {
      console.error('Error saving theme:', error);
      showToast('Failed to save theme');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    // Open receipt preview in new window with current theme
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Receipt Preview</title>
            <style>
              body {
                font-family: monospace;
                max-width: 300px;
                margin: 20px auto;
                padding: 20px;
                background-color: ${currentTheme.backgroundColor};
                color: ${currentTheme.textColor};
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid ${currentTheme.primaryColor};
                padding-bottom: 10px;
              }
              .logo {
                font-size: 24px;
                margin-bottom: 10px;
              }
              .business-name {
                font-size: ${currentTheme.fontSize === 'large' ? '18px' : currentTheme.fontSize === 'small' ? '12px' : '16px'};
                font-weight: bold;
                color: ${currentTheme.primaryColor};
              }
              .section {
                margin: 15px 0;
              }
              .section-title {
                font-weight: bold;
                color: ${currentTheme.secondaryColor};
                margin-bottom: 8px;
              }
              .item {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
                font-size: ${currentTheme.fontSize === 'large' ? '14px' : currentTheme.fontSize === 'small' ? '11px' : '12px'};
              }
              .total {
                border-top: 1px dashed ${currentTheme.primaryColor};
                padding-top: 10px;
                margin-top: 15px;
                font-weight: bold;
                font-size: ${currentTheme.fontSize === 'large' ? '16px' : currentTheme.fontSize === 'small' ? '13px' : '14px'};
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 11px;
                color: ${currentTheme.secondaryColor};
              }
            </style>
          </head>
          <body>
            <div class="header">
              ${currentTheme.showLogo ? '<div class="logo">🏪</div>' : ''}
              <div class="business-name">BUSMO STORE</div>
              ${currentTheme.showBusinessAddress ? '<div>123 Business Street<br>City, Country</div>' : ''}
            </div>
            
            <div class="section">
              <div class="section-title">RECEIPT #00123</div>
              <div>Date: ${new Date().toLocaleDateString()}</div>
              ${currentTheme.showCustomerDetails ? '<div>Customer: John Doe</div>' : ''}
            </div>
            
            <div class="section">
              <div class="section-title">ITEMS</div>
              <div class="item"><span>Product A x2</span><span>$20.00</span></div>
              <div class="item"><span>Product B x1</span><span>$15.00</span></div>
              <div class="item"><span>Product C x3</span><span>$45.00</span></div>
            </div>
            
            <div class="total">
              <div class="item"><span>Subtotal</span><span>$80.00</span></div>
              <div class="item"><span>Tax</span><span>$8.00</span></div>
              <div class="item"><span>TOTAL</span><span>$88.00</span></div>
            </div>
            
            <div class="footer">
              Thank you for your business!<br>
              ${currentTheme.showBarcode ? '||||| ||||| |||||' : ''}
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Receipt Theme Configuration</h1>
        <p>Customize your receipt and invoice appearance</p>
      </div>

      {/* Preset Themes */}
      <Card className={styles.section}>
        <CardHeader>
          <CardIcon bg="#6B3FE7">
            <Palette size={20} />
          </CardIcon>
          <h2>Preset Themes</h2>
        </CardHeader>
        
        <div className={styles.themeGrid}>
          {DEFAULT_THEMES.map(theme => (
            <div
              key={theme.id}
              className={`${styles.themeCard} ${selectedPreset === theme.id ? styles.selected : ''}`}
              onClick={() => handlePresetSelect(theme.id)}
            >
              <div
                className={styles.themePreview}
                style={{
                  backgroundColor: theme.backgroundColor,
                  color: theme.textColor,
                  borderColor: theme.primaryColor,
                }}
              >
                <div className={styles.previewHeader} style={{ color: theme.primaryColor }}>
                  {theme.showLogo && <Palette size={16} />}
                  <div className={styles.previewTitle}>BUSMO</div>
                </div>
                <div className={styles.previewBody}>
                  <div className={styles.previewLine} style={{ backgroundColor: theme.secondaryColor }}></div>
                  <div className={styles.previewLine} style={{ backgroundColor: theme.secondaryColor, width: '60%' }}></div>
                </div>
              </div>
              <div className={styles.themeName}>{theme.name}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Custom Theme Editor */}
      <Card className={styles.section}>
        <CardHeader>
          <CardIcon bg="#6B3FE7">
            <Settings size={20} />
          </CardIcon>
          <h2>Custom Theme Editor</h2>
        </CardHeader>
        
        <div className={styles.editorGrid}>
          <div className={styles.editorSection}>
            <h3>Colors</h3>
            <div className={styles.colorPicker}>
              <label>Primary Color</label>
              <input
                type="color"
                value={currentTheme.primaryColor}
                onChange={(e) => handleColorChange('primaryColor', e.target.value)}
              />
            </div>
            <div className={styles.colorPicker}>
              <label>Secondary Color</label>
              <input
                type="color"
                value={currentTheme.secondaryColor}
                onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
              />
            </div>
            <div className={styles.colorPicker}>
              <label>Text Color</label>
              <input
                type="color"
                value={currentTheme.textColor}
                onChange={(e) => handleColorChange('textColor', e.target.value)}
              />
            </div>
            <div className={styles.colorPicker}>
              <label>Background Color</label>
              <input
                type="color"
                value={currentTheme.backgroundColor}
                onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.editorSection}>
            <h3>Font Size</h3>
            <div className={styles.fontSizeOptions}>
              {(['small', 'medium', 'large'] as const).map(size => (
                <button
                  key={size}
                  className={`${styles.fontSizeButton} ${currentTheme.fontSize === size ? styles.active : ''}`}
                  onClick={() => handleColorChange('fontSize', size)}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.editorSection}>
            <h3>Logo</h3>
            <div className={styles.logoUpload}>
              {logoPreview || currentTheme.logoUrl ? (
                <div className={styles.logoPreview}>
                  <img src={logoPreview || currentTheme.logoUrl} alt="Logo" className={styles.logoImage} />
                  <button
                    type="button"
                    className={styles.removeLogoBtn}
                    onClick={handleRemoveLogo}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className={styles.uploadLabel}>
                  <Upload size={24} />
                  <span>Upload Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className={styles.fileInput}
                  />
                </label>
              )}
            </div>
            <div className={styles.toggleOptions}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={currentTheme.showLogo}
                  onChange={() => handleToggleChange('showLogo')}
                />
                Show Logo on Receipt
              </label>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={currentTheme.showBusinessAddress}
                  onChange={() => handleToggleChange('showBusinessAddress')}
                />
                Show Business Address
              </label>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={currentTheme.showCustomerDetails}
                  onChange={() => handleToggleChange('showCustomerDetails')}
                />
                Show Customer Details
              </label>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={currentTheme.showBarcode}
                  onChange={() => handleToggleChange('showBarcode')}
                />
                Show Barcode
              </label>
            </div>
          </div>

          <div className={styles.editorSection}>
            <h3>Custom Text</h3>
            <div className={styles.textInput}>
              <label>Custom Header</label>
              <input
                type="text"
                value={currentTheme.customHeader || ''}
                onChange={(e) => handleColorChange('customHeader', e.target.value)}
                placeholder="Optional custom header text"
              />
            </div>
            <div className={styles.textInput}>
              <label>Custom Footer</label>
              <input
                type="text"
                value={currentTheme.customFooter || ''}
                onChange={(e) => handleColorChange('customFooter', e.target.value)}
                placeholder="Optional custom footer text"
              />
            </div>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <Button onClick={handlePreview} className={styles.previewButton}>
            <Eye size={18} />
            Preview Receipt
          </Button>
          <Button 
            onClick={handleSaveTheme} 
            className={styles.saveButton}
            disabled={isSaving}
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Theme'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
