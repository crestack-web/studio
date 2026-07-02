// ═══════════════════════════════════════════
//  BUSMO — Document Template Manager Service
// ═══════════════════════════════════════════

import { 
  DocumentTemplate, 
  DocumentType, 
  TemplateStyle,
  BusinessInfo,
  DEFAULT_DOCUMENT_TYPES,
  DEFAULT_TEMPLATE_STYLES
} from './types';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

const TEMPLATE_VERSION = '1.0.0';

export class TemplateManager {
  private static instance: TemplateManager;
  private firestore: ReturnType<typeof initializeFirebase>['firestore'] | null = null;

  private constructor() {}

  static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager();
    }
    return TemplateManager.instance;
  }

  private getFirestore() {
    if (!this.firestore) {
      const { firestore } = initializeFirebase();
      this.firestore = firestore;
    }
    return this.firestore;
  }

  // Create default template for a business
  createDefaultTemplate(businessId: string, documentType: DocumentType): DocumentTemplate {
    const defaultStyle: TemplateStyle = 'modern-corporate';
    
    return {
      id: `${businessId}_${documentType}_${Date.now()}`,
      businessId,
      documentType,
      templateStyle: defaultStyle,
      
      businessInfo: {
        businessName: '',
        businessAddress: '',
        businessPhone: '',
        businessEmail: '',
        businessWebsite: '',
        businessTIN: '',
        businessVAT: '',
        businessRegNumber: '',
      },
      
      primaryColor: '#6B3FE7',
      secondaryColor: '#4B27B0',
      accentColor: '#8B5CF6',
      
      fontFamily: 'inter',
      fontSize: 'medium',
      
      showLogo: true,
      logoPosition: 'left',
      logoSize: 'medium',
      
      sections: {
        header: true,
        businessInfo: true,
        invoiceInfo: true,
        customerInfo: true,
        itemTable: true,
        sku: true,
        discount: true,
        totals: true,
        amountInWords: true,
        notes: true,
        termsAndConditions: true,
        signatures: true,
        warehouseNote: true,
        qrCode: true,
        watermark: {
          enabled: false,
          type: 'text',
          text: '',
          opacity: 0.1,
        },
        footer: true,
      },
      
      customHeader: '',
      customFooter: 'Thank you for your business!',
      warehouseNote: 'Present this invoice at the warehouse for collection of goods.',
      termsAndConditions: 'Payment due within 30 days.',
      
      paperSize: 'a4',
      
      version: TEMPLATE_VERSION,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Load all templates for a business
  async loadTemplates(businessId: string): Promise<DocumentTemplate[]> {
    try {
      const db = this.getFirestore();
      const templatesRef = collection(db, 'businesses', businessId, 'documentTemplates');
      const snapshot = await getDocs(templatesRef);
      
      const templates: DocumentTemplate[] = [];
      snapshot.forEach(doc => {
        templates.push({ ...doc.data() as DocumentTemplate, id: doc.id });
      });
      
      return templates;
    } catch (error) {
      console.error('Error loading templates:', error);
      return [];
    }
  }

  // Load template for specific document type
  async loadTemplate(businessId: string, documentType: DocumentType): Promise<DocumentTemplate | null> {
    try {
      const templates = await this.loadTemplates(businessId);
      return templates.find(t => t.documentType === documentType) || null;
    } catch (error) {
      console.error('Error loading template:', error);
      return null;
    }
  }

  // Save template
  async saveTemplate(businessId: string, template: DocumentTemplate): Promise<void> {
    try {
      const db = this.getFirestore();
      const templateRef = doc(db, 'businesses', businessId, 'documentTemplates', template.id);
      
      await setDoc(templateRef, {
        ...template,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error saving template:', error);
      throw new Error('Failed to save template');
    }
  }

  // Update template
  async updateTemplate(businessId: string, templateId: string, updates: Partial<DocumentTemplate>): Promise<void> {
    try {
      const db = this.getFirestore();
      const templateRef = doc(db, 'businesses', businessId, 'documentTemplates', templateId);
      
      await updateDoc(templateRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating template:', error);
      throw new Error('Failed to update template');
    }
  }

  // Get or create template for document type
  async getOrCreateTemplate(businessId: string, documentType: DocumentType): Promise<DocumentTemplate> {
    const existing = await this.loadTemplate(businessId, documentType);
    if (existing) {
      return existing;
    }
    
    const newTemplate = this.createDefaultTemplate(businessId, documentType);
    await this.saveTemplate(businessId, newTemplate);
    return newTemplate;
  }

  // Update business info across all templates
  async updateBusinessInfo(businessId: string, businessInfo: Partial<BusinessInfo>): Promise<void> {
    try {
      const templates = await this.loadTemplates(businessId);
      
      for (const template of templates) {
        await this.updateTemplate(businessId, template.id, {
          businessInfo: { ...template.businessInfo, ...businessInfo },
        });
      }
    } catch (error) {
      console.error('Error updating business info:', error);
      throw new Error('Failed to update business info');
    }
  }

  // Delete template
  async deleteTemplate(businessId: string, templateId: string): Promise<void> {
    try {
      const db = this.getFirestore();
      const templateRef = doc(db, 'businesses', businessId, 'documentTemplates', templateId);
      
      // Note: In Firestore, you typically update a 'deleted' flag rather than actually deleting
      // For this implementation, we'll just update it to mark as deleted
      await updateDoc(templateRef, {
        deleted: true,
        deletedAt: new Date(),
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      throw new Error('Failed to delete template');
    }
  }

  // Get available document types
  getDocumentTypes() {
    return DEFAULT_DOCUMENT_TYPES;
  }

  // Get available template styles
  getTemplateStyles() {
    return DEFAULT_TEMPLATE_STYLES;
  }

  // Validate template
  validateTemplate(template: Partial<DocumentTemplate>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!template.businessId) {
      errors.push('Business ID is required');
    }
    
    if (!template.documentType) {
      errors.push('Document type is required');
    }
    
    if (!template.templateStyle) {
      errors.push('Template style is required');
    }
    
    if (!template.paperSize) {
      errors.push('Paper size is required');
    }
    
    if (template.sections?.watermark?.opacity && (template.sections.watermark.opacity < 0 || template.sections.watermark.opacity > 1)) {
      errors.push('Watermark opacity must be between 0 and 1');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Version compatibility check
  isCompatible(version: string): boolean {
    const [major] = version.split('.').map(Number);
    const [currentMajor] = TEMPLATE_VERSION.split('.').map(Number);
    return major === currentMajor;
  }
}

export const templateManager = TemplateManager.getInstance();