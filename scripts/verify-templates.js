// Quick script to verify document templates in Firestore
const { initializeFirebase } = require('../src/firebase');
const { getDocs, collection, query, where, setDoc, doc, getDoc } = require('firebase/firestore');

async function verifyTemplates() {
  console.log('🔍 Verifying Document Templates\n');
  
  try {
    // Initialize Firebase
    const { firestore } = initializeFirebase();
    console.log('✅ Firebase initialized\n');
    
    // Get first business
    const businessesSnapshot = await getDocs(collection(firestore, 'businesses'));
    console.log(`📊 Found ${businessesSnapshot.size} businesses`);
    
    if (businessesSnapshot.size === 0) {
      console.log('⚠️  No businesses found. Templates are created on first business creation.');
      return;
    }
    
    // Use first business for testing
    let businessId = null;
    businessesSnapshot.forEach(doc => {
      if (!businessId) businessId = doc.id;
    });
    
    console.log(`🏢 Testing with business: ${businessId}\n`);
    
    // Check for existing templates
    const templatesRef = collection(firestore, 'businesses', businessId, 'documentTemplates');
    const templatesSnapshot = await getDocs(templatesRef);
    
    console.log(`📄 Found ${templatesSnapshot.size} templates`);
    
    if (templatesSnapshot.size === 0) {
      console.log('⚠️  No templates found - they will be auto-created when accessing Document Template Manager\n');
      
      // Test auto-creation logic
      console.log('🧪 Testing template auto-creation...\n');
      
      const documentTypes = ['sales_invoice', 'payment_receipt', 'delivery_note', 'quotation', 'purchase_order', 'proforma_invoice', 'credit_note'];
      
      for (const docType of documentTypes) {
        const templateId = `${businessId}_${docType}_${Date.now()}`;
        const templateData = {
          id: templateId,
          businessId,
          documentType: docType,
          templateStyle: 'modern-corporate',
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
            watermark: { enabled: false, type: 'text', text: '', opacity: 0.1 },
            footer: true,
          },
          customHeader: '',
          customFooter: 'Thank you for your business!',
          warehouseNote: 'Present this invoice at the warehouse for collection of goods.',
          termsAndConditions: 'Payment due within 30 days.',
          paperSize: 'a4',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await setDoc(doc(templatesRef, templateId), templateData);
        console.log(`  ✅ Created ${docType}`);
      }
      
      // Verify creation
      const newSnapshot = await getDocs(templatesRef);
      console.log(`\n✨ Auto-created ${newSnapshot.size} templates successfully!\n`);
      
    } else {
      console.log('📋 Existing templates:');
      templatesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  ✅ ${data.documentType} (${data.templateStyle}) - Updated: ${data.updatedAt?.toDate().toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyTemplates();