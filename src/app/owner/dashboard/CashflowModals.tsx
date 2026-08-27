'use client';

import React from 'react';
import { X } from 'lucide-react';

/** Action modals for Cashflow — split out to restore full UI under API size limits */
export default function CashflowModals(p: any) {
  const {
    activeAction, setActiveAction,
    newAccount, setNewAccount, handleAddAccount, isAddingAccount,
    moneyTransaction, setMoneyTransaction, handleAddMoney, handleTakeMoney,
    bankAccounts, products, suppliers,
    stockAddition, setStockAddition, handleAddPurchase, isAddingPurchase, handleReduceStock,
    stockReduction, setStockReduction,
    supplierPayment, setSupplierPayment, handlePaySupplier,
    newProduct, setNewProduct, handleCreateProduct,
    showNewProductForm, setShowNewProductForm,
    formatMoney, t, styles,
  } = p;

  return (
    <>
      {activeAction && (
        <div className={styles.actionFormOverlay} onClick={() => setActiveAction(null)}>
          <div className={styles.actionForm} onClick={e => e.stopPropagation()}>
            <button className={styles.closeFormBtn} onClick={() => setActiveAction(null)}>
              <X size={16} />
            </button>

            {activeAction === 'add-account' && (
              <div>
                <h3 className={styles.modalTitle}>Add Bank Account</h3>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Account Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={newAccount.accountName}
                    onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                    placeholder="e.g., Main Account"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Bank Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={newAccount.bankName}
                    onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                    placeholder="e.g., GTBank"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Initial Balance</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={newAccount.initialBalance}
                    onChange={(e) => setNewAccount({ ...newAccount, initialBalance: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newAccount.isPosDefault}
                      onChange={(e) => setNewAccount({ ...newAccount, isPosDefault: e.target.checked })}
                    />
                    <span>Set as default for POS & Bank payments</span>
                  </label>
                  <span className={styles.formHint}>Sales paid via POS, card, or bank transfer will be recorded to this account</span>
                </div>
                <div className={styles.modalActions}>
                  <button className={styles.modalButton} onClick={() => setActiveAction(null)} disabled={isAddingAccount}>Cancel</button>
                  <button className={styles.modalButtonPrimary} onClick={handleAddAccount} disabled={isAddingAccount}>
                    {isAddingAccount ? 'Adding...' : 'Add Account'}
                  </button>
                </div>
              </div>
            )}

            {activeAction === 'add-purchase' && (
              <form onSubmit={(e) => { e.preventDefault(); handleAddPurchase(); }}>
                <h3 className={styles.modalTitle}>Add Purchase</h3>
                {!showNewProductForm ? (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Select Product</label>
                    <select className={styles.formInput} value={stockAddition.productId} onChange={(e) => setStockAddition({ ...stockAddition, productId: e.target.value })}>
                      <option value="">Select a product</option>
                      {products.map((product: any) => (
                        <option key={product.id} value={product.id}>{product.name} (Stock: {product.stock})</option>
                      ))}
                    </select>
                    <button type="button" className={styles.linkButton} onClick={() => setShowNewProductForm(true)}>+ Create new product</button>
                  </div>
                ) : (
                  <div className={styles.newProductForm}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Product Name</label>
                      <input type="text" className={styles.formInput} value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="e.g., Rice 50kg" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Cost Price per Unit</label>
                      <input type="number" className={styles.formInput} value={newProduct.costPrice} onChange={(e) => setNewProduct({ ...newProduct, costPrice: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Selling Price (Optional)</label>
                      <input type="number" className={styles.formInput} value={newProduct.sellingPrice} onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Category</label>
                      <input type="text" className={styles.formInput} value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Unit</label>
                      <select className={styles.formInput} value={newProduct.unit} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}>
                        <option value="piece">Piece</option>
                        <option value="kg">Kilogram</option>
                        <option value="liter">Liter</option>
                        <option value="box">Box</option>
                        <option value="carton">Carton</option>
                        <option value="pack">Pack</option>
                      </select>
                    </div>
                    <div className={styles.modalActions}>
                      <button type="button" className={styles.modalButton} onClick={() => { setShowNewProductForm(false); setNewProduct({ name: '', costPrice: 0, sellingPrice: 0, category: '', unit: 'piece' }); }}>Cancel</button>
                      <button type="button" className={styles.modalButtonPrimary} onClick={handleCreateProduct}>Create Product</button>
                    </div>
                  </div>
                )}
                {!showNewProductForm && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Quantity to Add</label>
                      <input type="number" className={styles.formInput} value={stockAddition.quantity} onChange={(e) => setStockAddition({ ...stockAddition, quantity: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Cost Price per Unit</label>
                      <input type="number" className={styles.formInput} value={stockAddition.costPrice} onChange={(e) => setStockAddition({ ...stockAddition, costPrice: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Payment Method</label>
                      <select className={styles.formInput} value={stockAddition.paymentMethod} onChange={(e) => setStockAddition({ ...stockAddition, paymentMethod: e.target.value })}>
                        <option value="credit">Credit (Pay Later)</option>
                        <option value="cash">Cash (Full Payment)</option>
                        <option value="partial">Partial Payment</option>
                      </select>
                    </div>
                    {(stockAddition.paymentMethod === 'cash' || stockAddition.paymentMethod === 'partial') && (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Select Bank Account</label>
                        <select className={styles.formInput} value={stockAddition.bankAccountId} onChange={(e) => setStockAddition({ ...stockAddition, bankAccountId: e.target.value })}>
                          <option value="">Select bank account</option>
                          {bankAccounts.map((account: any) => (
                            <option key={account.id} value={account.id}>{account.accountName} - {account.bankName} (Bal: {formatMoney(account.currentBalance)})</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Select Supplier (Optional)</label>
                      <select className={styles.formInput} value={stockAddition.supplierId} onChange={(e) => setStockAddition({ ...stockAddition, supplierId: e.target.value })}>
                        <option value="">No supplier</option>
                        {suppliers.map((supplier: any) => (
                          <option key={supplier.id} value={supplier.id}>{supplier.supplierName || supplier.businessName}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.modalActions}>
                      <button type="button" className={styles.modalButton} onClick={() => setActiveAction(null)}>Cancel</button>
                      <button type="submit" className={styles.modalButtonPrimary} disabled={isAddingPurchase}>{isAddingPurchase ? 'Recording...' : 'Record Purchase'}</button>
                    </div>
                  </>
                )}
              </form>
            )}

            {activeAction === 'reduce-stock' && (
              <form onSubmit={(e) => { e.preventDefault(); handleReduceStock(); }}>
                <h3 className={styles.modalTitle}>Reduce Stock</h3>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Product</label>
                  <select className={styles.formInput} value={stockReduction?.productId || ''} onChange={(e) => setStockReduction({ ...stockReduction, productId: e.target.value })}>
                    <option value="">Select a product</option>
                    {products.map((product: any) => (
                      <option key={product.id} value={product.id}>{product.name} (Stock: {product.stock})</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Quantity to Reduce</label>
                  <input type="number" className={styles.formInput} value={stockReduction?.quantity || 0} onChange={(e) => setStockReduction({ ...stockReduction, quantity: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reason</label>
                  <select className={styles.formInput} value={stockReduction?.reason || ''} onChange={(e) => setStockReduction({ ...stockReduction, reason: e.target.value })}>
                    <option value="">Select reason</option>
                    <option value="damaged">Damaged</option>
                    <option value="expired">Expired</option>
                    <option value="theft">Theft</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.modalButton} onClick={() => setActiveAction(null)}>Cancel</button>
                  <button type="submit" className={styles.modalButtonPrimary}>Reduce Stock</button>
                </div>
              </form>
            )}

            {activeAction === 'add-money' && (
              <form onSubmit={(e) => { e.preventDefault(); handleAddMoney(); }}>
                <h3 className={styles.modalTitle}>Add Money</h3>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Account</label>
                  <select className={styles.formInput} value={moneyTransaction.accountId} onChange={(e) => setMoneyTransaction({ ...moneyTransaction, accountId: e.target.value })}>
                    <option value="">Select an account</option>
                    {bankAccounts.map((account: any) => (
                      <option key={account.id} value={account.id}>{account.accountName} - {account.bankName}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Amount</label>
                  <input type="number" className={styles.formInput} value={moneyTransaction.amount} onChange={(e) => setMoneyTransaction({ ...moneyTransaction, amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select className={styles.formInput} value={moneyTransaction.category} onChange={(e) => setMoneyTransaction({ ...moneyTransaction, category: e.target.value })}>
                    <option value="">Select category</option>
                    <option value="Sales">Sales</option>
                    <option value="Deposit">Deposit</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <input type="text" className={styles.formInput} value={moneyTransaction.description} onChange={(e) => setMoneyTransaction({ ...moneyTransaction, description: e.target.value })} />
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.modalButton} onClick={() => setActiveAction(null)}>Cancel</button>
                  <button type="submit" className={styles.modalButtonPrimary}>Add Money</button>
                </div>
              </form>
            )}

            {activeAction === 'take-money' && (
              <form onSubmit={(e) => { e.preventDefault(); handleTakeMoney(); }}>
                <h3 className={styles.modalTitle}>Take Money</h3>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Account</label>
                  <select className={styles.formInput} value={moneyTransaction.accountId} onChange={(e) => setMoneyTransaction({ ...moneyTransaction, accountId: e.target.value })}>
                    <option value="">Select an account</option>
                    {bankAccounts.map((account: any) => (
                      <option key={account.id} value={account.id}>{account.accountName} - {account.bankName}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Amount</label>
                  <input type="number" className={styles.formInput} value={moneyTransaction.amount} onChange={(e) => setMoneyTransaction({ ...moneyTransaction, amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select className={styles.formInput} value={moneyTransaction.category} onChange={(e) => setMoneyTransaction({ ...moneyTransaction, category: e.target.value })}>
                    <option value="">Select category</option>
                    <option value="Expense">Expense</option>
                    <option value="Withdrawal">Withdrawal</option>
                    <option value="Bank Charges / Fees">Bank Charges / Fees</option>
                    <option value="Tax / Government Fees">Tax / Government Fees</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Purchase">Purchase</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <input type="text" className={styles.formInput} value={moneyTransaction.description} onChange={(e) => setMoneyTransaction({ ...moneyTransaction, description: e.target.value })} />
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.modalButton} onClick={() => setActiveAction(null)}>Cancel</button>
                  <button type="submit" className={styles.modalButtonPrimary}>Take Money</button>
                </div>
              </form>
            )}

            {activeAction === 'pay-supplier' && (
              <form onSubmit={(e) => { e.preventDefault(); handlePaySupplier(); }}>
                <h3 className={styles.modalTitle}>Pay Supplier</h3>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Supplier</label>
                  <select className={styles.formInput} value={supplierPayment.supplierId} onChange={(e) => setSupplierPayment({ ...supplierPayment, supplierId: e.target.value })}>
                    <option value="">Select a supplier</option>
                    {suppliers.map((supplier: any) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.supplierName || supplier.businessName}
                        {supplier.currentBalance ? ` (Balance: ${formatMoney(supplier.currentBalance)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payment Amount</label>
                  <input type="number" className={styles.formInput} value={supplierPayment.amount} onChange={(e) => setSupplierPayment({ ...supplierPayment, amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payment Method</label>
                  <select className={styles.formInput} value={supplierPayment.paymentMethod} onChange={(e) => setSupplierPayment({ ...supplierPayment, paymentMethod: e.target.value })}>
                    <option value="cash">Cash</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="pos">POS / Card</option>
                  </select>
                </div>
                {(supplierPayment.paymentMethod === 'transfer' || supplierPayment.paymentMethod === 'pos') && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Select Bank Account</label>
                    <select className={styles.formInput} value={supplierPayment.bankAccountId} onChange={(e) => setSupplierPayment({ ...supplierPayment, bankAccountId: e.target.value })}>
                      <option value="">Select bank account</option>
                      {bankAccounts.map((account: any) => (
                        <option key={account.id} value={account.id}>{account.accountName} - {account.bankName}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className={styles.modalActions}>
                  <button type="button" className={styles.modalButton} onClick={() => setActiveAction(null)}>Cancel</button>
                  <button type="submit" className={styles.modalButtonPrimary}>Record Payment</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
