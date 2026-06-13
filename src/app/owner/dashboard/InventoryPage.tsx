import React, { useState, useEffect } from 'react';
import { Product } from './inventoryData';
import InventoryOverviewCards from './InventoryOverviewCards';
import InventoryTable from './InventoryTable';
import LowStockPanel from './LowStockPanel';
import DeadStockInsights from './DeadStockInsights';
import ProductDetailModal from './ProductDetailModal';
import { AddProductPage } from './Addproductpage';
import { useTranslation } from './LangContext';
import { useFirestore } from '@/firebase/provider';
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useApp } from './AppContext';
import './inventory.css';

const InventoryPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast, user } = useApp();
  const firestore = useFirestore();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user?.id || !firestore) {
        setIsLoading(true);
        return;
      }

      try {
        setIsLoading(true);
        
        // Get user's business ID
        const userSnapshot = await getDocs(query(collection(firestore, 'users'), where('__name__', '==', user.id)));
        
        let businessId = user.id;
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          businessId = userData.businessId || user.id;
        }

        // Fetch products from Firestore
        const productsQuery = query(
          collection(firestore, 'businesses', businessId, 'products'),
          where('active', '==', true)
        );
        
        const productsSnapshot = await getDocs(productsQuery);
        const productsList: Product[] = [];
        
        productsSnapshot.forEach(doc => {
          const data = doc.data();
          productsList.push({
            id: doc.id,
            name: data.name || '',
            sku: data.sku || '',
            category: data.category || '',
            stock: data.stock || 0,
            currentStock: data.stock || 0,
            costPrice: data.cost || data.costPrice || 0, // Read from 'cost' field (what Addproductpage saves)
            sellingPrice: data.price || 0,
            unitsSold30d: data.unitsSold30d || 0,
            lastSaleDate: data.lastSaleDate || '',
            reorderThreshold: data.lowStockThreshold || 10,
            suggestedReorder: 0,
            emoji: data.attributes?.emoji || '',
            trend: 'flat' as const,
            movement: [],
            imageUrl: data.imageUrl || '',
          });
        });

        setProducts(productsList);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        
        // Handle Firebase permissions error specifically
        if (err.code === 'permission-denied' || err.message?.includes('Missing or insufficient permissions')) {
          setError('You do not have permission to access this data. Please contact your administrator or check your account permissions.');
        } else {
          setError(err?.message || 'Unable to fetch inventory products.');
        }
        
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [user?.id, firestore]);

  const handleProductUpdate = (updated: Product) => {
    setProducts(prev =>
      prev.map(p => (p.id === updated.id ? updated : p))
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (products.length === 0) {
      showToast('No products to export');
      return;
    }

    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Stock',
      'Cost Price',
      'Selling Price',
      'Profit',
      'Total Value',
      'Status',
      'Units Sold (30d)',
      'Last Sale',
    ];

    const rows = products.map(p => {
      const profit = p.sellingPrice - p.costPrice;
      const totalValue = p.costPrice * p.stock;
      const status = p.stock === 0 ? 'Out of Stock' : p.stock <= p.reorderThreshold ? 'Low Stock' : 'In Stock';
      const lastSale = p.lastSaleDate ? new Date(p.lastSaleDate).toLocaleDateString() : 'Never';

      return [
        `"${p.name}"`,
        p.sku,
        p.category,
        p.stock,
        p.costPrice.toFixed(2),
        p.sellingPrice.toFixed(2),
        profit.toFixed(2),
        totalValue.toFixed(2),
        status,
        p.unitsSold30d,
        lastSale,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('✅ Inventory exported successfully!');
  };

  // Import from CSV
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

      const importedProducts: Product[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const product: any = { id: `import-${Date.now()}-${i}` };
        
        headers.forEach((header, index) => {
          const value = values[index];
          switch (header.toLowerCase()) {
            case 'product name':
            case 'name':
              product.name = value;
              break;
            case 'sku':
              product.sku = value;
              break;
            case 'category':
              product.category = value;
              break;
            case 'stock':
              product.stock = parseInt(value) || 0;
              break;
            case 'cost price':
            case 'cost':
              product.costPrice = parseFloat(value) || 0;
              break;
            case 'selling price':
            case 'price':
              product.sellingPrice = parseFloat(value) || 0;
              break;
          }
        });

        if (product.name) {
          importedProducts.push(product as Product);
        }
      }

      // Add imported products to Firestore
      const addImportedProducts = async () => {
        try {
          const businessId = user?.businessId || 'demo';
          for (const product of importedProducts) {
            await addDoc(collection(firestore, 'businesses', businessId, 'products'), {
              ...product,
              active: true,
              createdAt: new Date(),
              lowStockThreshold: 10,
            });
          }
          setProducts(prev => [...prev, ...importedProducts]);
          showToast(`✅ ${importedProducts.length} products imported successfully!`);
          setShowImportModal(false);
        } catch (error) {
          console.error('Error importing products:', error);
          showToast('❌ Error importing products');
        }
      };

      addImportedProducts();
    };

    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="inv-page">
        <div className="inv-empty-state">
          <div className="inv-empty-icon">⏳</div>
          <h3>Loading Inventory...</h3>
          <p>Please wait while we fetch your products</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inv-page">
      {/* ── Page Header ── */}
      <div className="inv-page-header">
        <div className="inv-page-title-wrap">
          <h1 className="inv-page-title">{t('inventory.title')}</h1>
          <p className="inv-page-sub">{t('inventory.subtitle')}</p>
        </div>
        <div className="inv-header-actions">
          <button className="btn bsm bgh" onClick={handleExportCSV} disabled={products.length === 0}>
            <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 3h11M1 6.5h7M1 10h4"/>
            </svg>
            {t('inventory.exportCsv')}
          </button>
          <button className="btn bsm bgh" onClick={() => setShowImportModal(true)}>
            <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6.5 2v9M2 6.5h9"/>
            </svg>
            Import CSV
          </button>
          <button className="btn bsm bpr" onClick={() => setShowAddModal(true)}>
            <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6.5 2v9M2 6.5h9"/>
            </svg>
            {t('inventory.addProduct')}
          </button>
        </div>
      </div>

      {error && (
        <div className="inv-error-banner">
          <strong>Inventory load failed:</strong> {error}
        </div>
      )}

      {/* ── 1. Overview Cards ── */}
      <section className="inv-section">
        <InventoryOverviewCards products={products} />
      </section>

      {/* ── 2. Low Stock Panel ── */}
      <section className="inv-section">
        {products.length === 0 ? (
          <div className="inv-section-empty">
            <svg className="inv-empty-svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
              <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(244,165,53,.12)" strokeWidth="1.5" strokeDasharray="6,4"/>
              {/* empty shelf */}
              <rect x="18" y="72" width="84" height="5" rx="2.5" fill="rgba(255,255,255,.08)"/>
              <rect x="18" y="52" width="84" height="5" rx="2.5" fill="rgba(255,255,255,.06)"/>
              {/* faint dashed outlines of missing products */}
              <rect x="24" y="56" width="20" height="16" rx="3" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1.5" strokeDasharray="3,3"/>
              <rect x="50" y="56" width="20" height="16" rx="3" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1.5" strokeDasharray="3,3"/>
              <rect x="76" y="56" width="20" height="16" rx="3" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1.5" strokeDasharray="3,3"/>
              {/* Mo looking around with magnifier */}
              <circle cx="60" cy="36" r="13" fill="#F5C9A0"/>
              <path d="M47 32 C47 23 73 23 73 32 L73 28 C73 20 47 20 47 28 Z" fill="#2C1A0E"/>
              <circle cx="54" cy="35" r="3" fill="#1A2B3C"/>
              <circle cx="66" cy="35" r="3" fill="#1A2B3C"/>
              <circle cx="55" cy="33.8" r="1" fill="white"/>
              <circle cx="67" cy="33.8" r="1" fill="white"/>
              <path d="M54 41 Q60 45 66 41" stroke="#CC7A3A" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              {/* magnifier */}
              <circle cx="82" cy="22" r="9" fill="none" stroke="#F4A535" strokeWidth="2.5"/>
              <circle cx="82" cy="22" r="6" fill="rgba(244,165,53,.1)"/>
              <line x1="89" y1="29" x2="95" y2="35" stroke="#F4A535" strokeWidth="2.5" strokeLinecap="round"/>
              {/* arm holding magnifier */}
              <path d="M73 40 Q78 32 82 26" stroke="#F5C9A0" strokeWidth="4" strokeLinecap="round" fill="none"/>
              {/* other arm */}
              <path d="M47 40 Q42 42 38 48" stroke="#F5C9A0" strokeWidth="4" strokeLinecap="round" fill="none"/>
              {/* question marks on shelves */}
              <text x="30" y="68" fontSize="10" fill="rgba(244,165,53,.3)" textAnchor="middle">?</text>
              <text x="60" y="68" fontSize="10" fill="rgba(244,165,53,.3)" textAnchor="middle">?</text>
              <text x="86" y="68" fontSize="10" fill="rgba(244,165,53,.3)" textAnchor="middle">?</text>
            </svg>
            <h4>No Products Yet</h4>
            <p>Start by adding your first product to track inventory, sales, and stock levels</p>
            <button className="inv-add-first-btn" onClick={() => setShowAddModal(true)}>
              <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6.5 2v9M2 6.5h9"/>
              </svg>
              Add Your First Product
            </button>
          </div>
        ) : (
          <LowStockPanel
            products={products}
            onProductClick={setSelected}
          />
        )}
      </section>

      {/* ── 3. Inventory Table ── */}
      <section className="inv-section">
        {products.length === 0 ? (
          <div className="inv-section-empty">
            <svg className="inv-empty-svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
              {/* empty cart */}
              <path d="M22 38 L30 38 L38 70 L82 70 L90 50 L34 50" stroke="rgba(255,255,255,.12)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="42" cy="76" r="4" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="2"/>
              <circle cx="76" cy="76" r="4" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="2"/>
              {/* Mo sitting in cart */}
              <circle cx="62" cy="52" r="13" fill="#F5C9A0"/>
              <path d="M49 48 C49 39 75 39 75 48 L75 44 C75 36 49 36 49 44 Z" fill="#2C1A0E"/>
              <circle cx="56" cy="51" r="2.8" fill="#1A2B3C"/>
              <circle cx="68" cy="51" r="2.8" fill="#1A2B3C"/>
              <path d="M55 57 Q62 60 69 57" stroke="#CC7A3A" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              {/* shrug arms */}
              <path d="M49 56 Q44 54 42 50" stroke="#F5C9A0" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              <circle cx="41" cy="49" r="3.5" fill="#F5C9A0"/>
              <path d="M75 56 Q80 54 82 50" stroke="#F5C9A0" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              <circle cx="83" cy="49" r="3.5" fill="#F5C9A0"/>
              {/* price tags floating */}
              <rect x="14" y="20" width="18" height="12" rx="3" fill="rgba(29,185,84,.15)" stroke="rgba(29,185,84,.3)" strokeWidth="1"/>
              <circle cx="16" cy="23" r="1.5" fill="#1DB954" opacity=".5"/>
              <rect x="88" y="22" width="18" height="12" rx="3" fill="rgba(29,185,84,.15)" stroke="rgba(29,185,84,.3)" strokeWidth="1"/>
              <circle cx="90" cy="25" r="1.5" fill="#1DB954" opacity=".5"/>
            </svg>
            <h4>No Inventory Items</h4>
            <p>Your inventory table is empty. Start by adding your first product!</p>
            <button className="inv-add-product-btn" onClick={() => setShowAddModal(true)}>
              + Add Product
            </button>
          </div>
        ) : (
          <InventoryTable
            products={products}
            onProductClick={setSelected}
          />
        )}
      </section>

      {/* ── 4. Dead Stock Intelligence ── */}
      <section className="inv-section">
        {products.length === 0 ? (
          <div className="inv-section-empty">
            <div className="inv-section-empty-icon">🔮</div>
            <h4>No Dead Stock Data</h4>
            <p>Once you add products, we'll help you identify slow-moving items</p>
          </div>
        ) : (
          <DeadStockInsights
            products={products}
            onProductClick={setSelected}
          />
        )}
      </section>

      {/* ── 5. Product Detail Modal ── */}
      {selected && (
        <ProductDetailModal
          product={selected}
          onClose={() => setSelected(null)}
          onSave={updated => {
            handleProductUpdate(updated);
            setSelected(updated);
          }}
        />
      )}

      {/* ── 6. Add Product Modal ── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <AddProductPage
              onClose={() => setShowAddModal(false)}
              onProductAdded={(newProduct) => {
                setProducts(prev => [...prev, newProduct]);
                setShowAddModal(false);
                showToast('✅ Product added successfully!');
              }}
            />
          </div>
        </div>
      )}

      {/* ── 7. Import CSV Modal ── */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content csv-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Import Products from CSV</h2>
              <button className="modal-close" onClick={() => setShowImportModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="csv-modal-description">
                Upload a CSV file with the following columns: Product Name, SKU, Category, Stock, Cost Price, Selling Price
              </p>
              <div className="csv-modal-example">
                <strong>Example CSV format:</strong><br/>
                Product Name,SKU,Category,Stock,Cost Price,Selling Price<br/>
                "Indomie","IND001","Food",50,2500,3500
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="csv-modal-input"
              />
              <div className="csv-modal-actions">
                <button className="csv-modal-btn" onClick={() => setShowImportModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
