'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { 
  DocumentTemplate, 
  InvoiceData, 
  DEFAULT_DOCUMENT_TYPES,
  DEFAULT_TEMPLATE_STYLES
} from './types';
import { templateManager } from './templateManager';
import { getTemplateComponent, TEMPLATE_COMPONENTS } from './templates';
import { TemplateStyle } from './types';
import { 
  FileText, 
  Palette, 
  Eye, 
  Save, 
  Upload, 
  X, 
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react';
import styles from './DocumentTemplateManager.module.css';

export function DocumentTemplateManager() {
  const { showToast, user } = useApp();
  const businessId = user?.businessId || '';
  
  // State
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [documentType, setDocumentType] = useState<string>('sales_invoice');
  const [templateStyle, setTemplateStyle] = useState<TemplateStyle>('modern-corporate');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    branding: true,
    layout: false,
    colors: false,
    sections: false,
    content: false,
  });

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [businessId]);

  const loadTemplates = async () => {
    if (!businessId) return;
    
    setIsLoading(true);
    try {
      const loadedTemplates = await templateManager.loadTemplates(businessId);
      setTemplates(loadedTemplates);
      
      // Select first template or create default
      if (loadedTemplates.length > 0 && !selectedTemplate) {
        setSelectedTemplate(loadedTemplates[0]);
        setDocumentType(loadedTemplates[0].documentType);
        setTemplateStyle(loadedTemplates[0].templateStyle);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      showToast('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!businessId) {
      showToast('Business ID not found');
      return;
    }

    setIsLoading(true);
    try {
      const newTemplate = await templateManager.getOrCreateTemplate(businessId, documentType as any);
      setTemplates([...templates, newTemplate]);
      setSelectedTemplate(newTemplate);
      setTemplateStyle(newTemplate.templateStyle);
      showToast('Template created successfully');
    } catch (error) {
      console.error('Error creating template:', error);
      showToast('Failed to create template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate || !businessId) return;

    setIsSaving(true);
    try {
      await templateManager.saveTemplate(businessId, selectedTemplate);
      showToast('Template saved successfully');
      await loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      showToast('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateField = (field: keyof DocumentTemplate, value: any) => {
    if (!selectedTemplate) return;
    setSelectedTemplate({ ...selectedTemplate, [field]: value });
  };

  const handleUpdateBusinessInfo = (field: string, value: string) => {
    if (!selectedTemplate) return;
    setSelectedTemplate({
      ...selectedTemplate,
      businessInfo: { ...selectedTemplate.businessInfo, [field]: value },
    });
  };

  const handleUpdateSections = (section: string, value: boolean) => {
    if (!selectedTemplate) return;
    setSelectedTemplate({
      ...selectedTemplate,
      sections: { ...selectedTemplate.sections, [section]: value },
    });
  };

  const handleUpdateWatermark = (field: string, value: any) => {
    if (!selectedTemplate) return;
    setSelectedTemplate({
      ...selectedTemplate,
      sections: {
        ...selectedTemplate.sections,
        watermark: { ...selectedTemplate.sections.watermark, [field]: value },
      },
    });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Sample data for preview
  const previewData: InvoiceData = {
    invoiceNumber: 'INV-000284',
    invoiceDate: new Date().toLocaleDateString(),
    dueDate: '2025-01-31',
    salesRepresentative: 'John Doe',
    paymentStatus: 'paid',
    paymentMethod: 'Cash',
    customerName: 'ABC Company Ltd',
    customerCompany: 'ABC Company Ltd',
    customerPhone: '+234 803 123 4567',
    customerAddress: '123 Market Street, Lagos, Nigeria',
    items: [
      {
        serialNumber: 1,
        productName: 'Product A',
        sku: 'SKU001',
        quantity: 10,
        unit: 'pcs',
        unitPrice: 5000,
        discount: 0,
        total: 50000,
      },
      {
        serialNumber: 2,
        productName: 'Product B',
        sku: 'SKU002',
        quantity: 5,
        unit: 'pcs',
        unitPrice: 10000,
        discount: 500,
        total: 49500,
      },
    ],
    subtotal: 99500,
    discountAmount: 500,
    vatAmount: 0,
    vatPercentage: 0,
    otherCharges: 2000,
    grandTotal: 101500,
    amountInWords: 'One Hundred and One Thousand Five Hundred Naira Only',
    notes: 'Thank you for your business!',
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Document Template Manager</h1>
          <p className={styles.subtitle}>Customize your invoices, receipts, and business documents</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.previewButton}
            onClick={() => setShowPreview(true)}
            disabled={!selectedTemplate}
          >
            <Eye size={18} />
            Preview
          </button>
          <button 
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!selectedTemplate || isSaving}
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Left Sidebar - Template Selection */}
        <div className={styles.sidebar}>
          {/* Document Type Selector */}
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>Document Type</h3>
            <select 
              className={styles.select}
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              {DEFAULT_DOCUMENT_TYPES.map(dt => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </select>
            <button 
              className={styles.createButton}
              onClick={handleCreateNew}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Template'}
            </button>
          </div>

          {/* Template List */}
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>Your Templates ({templates.length})</h3>
            <div className={styles.templateList}>
              {templates.map(template => (
                <div
                  key={template.id}
                  className={`${styles.templateListItem} ${selectedTemplate?.id === template.id ? styles.active : ''}`}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setDocumentType(template.documentType);
                    setTemplateStyle(template.templateStyle);
                  }}
                >
                  <div className={styles.templateListItemInfo}>
                    <div className={styles.templateListItemName}>
                      {DEFAULT_DOCUMENT_TYPES.find(dt => dt.value === template.documentType)?.label || template.documentType}
                    </div>
                    <div className={styles.templateListItemStyle}>
                      {DEFAULT_TEMPLATE_STYLES.find(ts => ts.value === template.templateStyle)?.label || template.templateStyle}
                    </div>
                  </div>
                  <CheckCircle size={16} className={styles.templateListCheck} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Editor */}
        {selectedTemplate ? (
          <div className={styles.editor}>
            {/* Template Name & Style */}
            <div className={styles.editorSection}>
              <div className={styles.sectionHeader}>
                <h3>Template Configuration</h3>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label>Template Style</label>
                  <select 
                    className={styles.select}
                    value={selectedTemplate.templateStyle}
                    onChange={(e) => handleUpdateField('templateStyle', e.target.value as any)}
                  >
                    {DEFAULT_TEMPLATE_STYLES.map(ts => (
                      <option key={ts.value} value={ts.value}>{ts.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Paper Size</label>
                  <select 
                    className={styles.select}
                    value={selectedTemplate.paperSize}
                    onChange={(e) => handleUpdateField('paperSize', e.target.value as any)}
                  >
                    <option value="a4">A4</option>
                    <option value="a5">A5</option>
                    <option value="thermal-80mm">Thermal 80mm</option>
                    <option value="thermal-58mm">Thermal 58mm</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Branding Section */}
            <div className={styles.editorSection}>
              <div className={styles.sectionHeader} onClick={() => toggleSection('branding')}>
                <h3>Business Branding</h3>
                {expandedSections.branding ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSections.branding && (
                <div className={styles.sectionContent}>
                  <div className={styles.formGrid}>
                    <div className={styles.formField}>
                      <label>Business Name</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={selectedTemplate.businessInfo.businessName}
                        onChange={(e) => handleUpdateBusinessInfo('businessName', e.target.value)}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Phone</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={selectedTemplate.businessInfo.businessPhone}
                        onChange={(e) => handleUpdateBusinessInfo('businessPhone', e.target.value)}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Email</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={selectedTemplate.businessInfo.businessEmail}
                        onChange={(e) => handleUpdateBusinessInfo('businessEmail', e.target.value)}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Address</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={selectedTemplate.businessInfo.businessAddress}
                        onChange={(e) => handleUpdateBusinessInfo('businessAddress', e.target.value)}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>TIN</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={selectedTemplate.businessInfo.businessTIN}
                        onChange={(e) => handleUpdateBusinessInfo('businessTIN', e.target.value)}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>VAT Number</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={selectedTemplate.businessInfo.businessVAT}
                        onChange={(e) => handleUpdateBusinessInfo('businessVAT', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className={styles.formField}>
                    <label>Logo</label>
                    <div className={styles.logoUpload}>
                      {selectedTemplate.businessInfo.logoUrl ? (
                        <div className={styles.logoPreview}>
                          <img src={selectedTemplate.businessInfo.logoUrl} alt="Logo" />
                          <button 
                            className={styles.removeLogoBtn}
                            onClick={() => handleUpdateBusinessInfo('logoUrl', '')}
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
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  handleUpdateBusinessInfo('logoUrl', reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className={styles.fileInput}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Logo Options */}
                  <div className={styles.formGrid}>
                    <div className={styles.formField}>
                      <label>Logo Position</label>
                      <select 
                        className={styles.select}
                        value={selectedTemplate.logoPosition}
                        onChange={(e) => handleUpdateField('logoPosition', e.target.value)}
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div className={styles.formField}>
                      <label>Logo Size</label>
                      <select 
                        className={styles.select}
                        value={selectedTemplate.logoSize}
                        onChange={(e) => handleUpdateField('logoSize', e.target.value)}
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Colors & Typography */}
            <div className={styles.editorSection}>
              <div className={styles.sectionHeader} onClick={() => toggleSection('colors')}>
                <h3>Colors & Typography</h3>
                {expandedSections.colors ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSections.colors && (
                <div className={styles.sectionContent}>
                  <div className={styles.colorGrid}>
                    <div className={styles.formField}>
                      <label>Primary Color</label>
                      <input
                        type="color"
                        value={selectedTemplate.primaryColor}
                        onChange={(e) => handleUpdateField('primaryColor', e.target.value)}
                        className={styles.colorInput}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Secondary Color</label>
                      <input
                        type="color"
                        value={selectedTemplate.secondaryColor}
                        onChange={(e) => handleUpdateField('secondaryColor', e.target.value)}
                        className={styles.colorInput}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Accent Color</label>
                      <input
                        type="color"
                        value={selectedTemplate.accentColor}
                        onChange={(e) => handleUpdateField('accentColor', e.target.value)}
                        className={styles.colorInput}
                      />
                    </div>
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.formField}>
                      <label>Font Family</label>
                      <select 
                        className={styles.select}
                        value={selectedTemplate.fontFamily}
                        onChange={(e) => handleUpdateField('fontFamily', e.target.value)}
                      >
                        <option value="inter">Inter</option>
                        <option value="roboto">Roboto</option>
                        <option value="open-sans">Open Sans</option>
                        <option value="lato">Lato</option>
                        <option value="poppins">Poppins</option>
                      </select>
                    </div>
                    <div className={styles.formField}>
                      <label>Font Size</label>
                      <select 
                        className={styles.select}
                        value={selectedTemplate.fontSize}
                        onChange={(e) => handleUpdateField('fontSize', e.target.value)}
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sections Visibility */}
            <div className={styles.editorSection}>
              <div className={styles.sectionHeader} onClick={() => toggleSection('sections')}>
                <h3>Document Sections</h3>
                {expandedSections.sections ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSections.sections && (
                <div className={styles.sectionContent}>
                  <div className={styles.toggleGrid}>
                    {Object.entries(selectedTemplate.sections).map(([key, value]) => {
                      if (key === 'watermark') return null;
                      return (
                        <div key={key} className={styles.toggleItem}>
                          <label className={styles.toggleLabel}>
                            <input
                              type="checkbox"
                              checked={value as boolean}
                              onChange={(e) => handleUpdateSections(key, e.target.checked)}
                            />
                            <span className={styles.toggleText}>
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Watermark */}
            <div className={styles.editorSection}>
              <div className={styles.sectionHeader} onClick={() => toggleSection('layout')}>
                <h3>Watermark</h3>
                {expandedSections.layout ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSections.layout && (
                <div className={styles.sectionContent}>
                  <div className={styles.toggleItem}>
                    <label className={styles.toggleLabel}>
                      <input
                        type="checkbox"
                        checked={selectedTemplate.sections.watermark.enabled}
                        onChange={(e) => handleUpdateWatermark('enabled', e.target.checked)}
                      />
                      <span className={styles.toggleText}>Enable Watermark</span>
                    </label>
                  </div>
                  {selectedTemplate.sections.watermark.enabled && (
                    <>
                      <div className={styles.formField}>
                        <label>Watermark Type</label>
                        <select 
                          className={styles.select}
                          value={selectedTemplate.sections.watermark.type}
                          onChange={(e) => handleUpdateWatermark('type', e.target.value)}
                        >
                          <option value="text">Text</option>
                          <option value="logo">Logo</option>
                        </select>
                      </div>
                      {selectedTemplate.sections.watermark.type === 'text' && (
                        <div className={styles.formField}>
                          <label>Watermark Text</label>
                          <input
                            type="text"
                            className={styles.input}
                            value={selectedTemplate.sections.watermark.text || ''}
                            onChange={(e) => handleUpdateWatermark('text', e.target.value)}
                            placeholder={selectedTemplate.businessInfo.businessName}
                          />
                        </div>
                      )}
                      <div className={styles.formField}>
                        <label>Opacity: {Math.round(selectedTemplate.sections.watermark.opacity * 100)}%</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={selectedTemplate.sections.watermark.opacity}
                          onChange={(e) => handleUpdateWatermark('opacity', parseFloat(e.target.value))}
                          className={styles.rangeInput}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Custom Text */}
            <div className={styles.editorSection}>
              <div className={styles.sectionHeader} onClick={() => toggleSection('content')}>
                <h3>Custom Text</h3>
                {expandedSections.content ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSections.content && (
                <div className={styles.sectionContent}>
                  <div className={styles.formField}>
                    <label>Custom Footer</label>
                    <textarea
                      className={styles.textarea}
                      value={selectedTemplate.customFooter || ''}
                      onChange={(e) => handleUpdateField('customFooter', e.target.value)}
                      rows={3}
                      placeholder="Thank you for your business!"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Warehouse Note</label>
                    <textarea
                      className={styles.textarea}
                      value={selectedTemplate.warehouseNote || ''}
                      onChange={(e) => handleUpdateField('warehouseNote', e.target.value)}
                      rows={2}
                      placeholder="Present this invoice at the warehouse for collection."
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Terms & Conditions</label>
                    <textarea
                      className={styles.textarea}
                      value={selectedTemplate.termsAndConditions || ''}
                      onChange={(e) => handleUpdateField('termsAndConditions', e.target.value)}
                      rows={3}
                      placeholder="Payment due within 30 days."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <FileText size={64} />
            <h3>No Template Selected</h3>
            <p>Select a document type and create a template to get started</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (() => {
        const TemplateComponent = getTemplateComponent(selectedTemplate.templateStyle);
        return TemplateComponent ? (
          <div className={styles.modal} onClick={() => setShowPreview(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Template Preview</h2>
                <button className={styles.modalClose} onClick={() => setShowPreview(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.previewContainer}>
                  <TemplateComponent template={selectedTemplate} data={previewData} />
                </div>
                <div className={styles.modalActions}>
                  <button 
                    className={styles.actionButton}
                    onClick={() => window.print()}
                  >
                    <Printer size={18} />
                    Print
                  </button>
                  <button 
                    className={styles.actionButton}
                    onClick={() => showToast('PDF download would be implemented with a library like jsPDF')}
                  >
                    <Download size={18} />
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
}