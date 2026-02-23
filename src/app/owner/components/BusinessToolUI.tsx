// Business Tool UI - Multi-tab interface for business operations
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, serverTimestamp, query } from 'firebase/firestore';
import { Loader2, ArrowLeft, Package, Plus, CircleDollarSign, FilePlus } from 'lucide-react';
import { useLanguage } from '@/context/language-provider';

interface BusinessToolUIProps {
  activeTab?: string;
  onClose: () => void;
}

interface AppUser {
  businessId?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  hasVariants?: boolean;
  variants?: { id: string; name: string; price: number; cost?: number; quantity: number }[];
}

export default function BusinessToolUI({ activeTab, onClose }: BusinessToolUIProps) {
  const [currentTab, setCurrentTab] = useState(activeTab || 'add-product');
  const { toast } = useToast();
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  // Sync tab state with activeTab prop
  useEffect(() => {
    if (activeTab && activeTab !== currentTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);
  const { data: userProfile } = useDoc<AppUser>(userProfileRef);
  const businessId = userProfile?.businessId;

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !businessId) return null;
    return query(collection(firestore, `businesses/${businessId}/products`));
  }, [firestore, businessId]);
  const { data: productsData } = useCollection<Product>(productsQuery);

  // Add Product / Record Sale State
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [saleAmount, setSaleAmount] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [isSaving, setIsSaving] = useState(false);

  // Add Expense State
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // Cashflow State
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [cashAmount, setCashAmount] = useState('');
  const [cashDescription, setCashDescription] = useState('');

  // Add Stock State
  const [stockProduct, setStockProduct] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');

  const handleRecordSale = async () => {
    if (!selectedProduct || !quantity) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a product and enter quantity' });
      return;
    }

    if (!businessId || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Business information not found' });
      return;
    }

    const product = productsData?.find(p => p.id === selectedProduct);
    if (!product) {
      toast({ variant: 'destructive', title: 'Error', description: 'Product not found' });
      return;
    }

    const qty = parseInt(quantity);
    const amount = parseFloat(saleAmount) || (product.price * qty);

    setIsSaving(true);
    try {
      const salesColRef = collection(firestore, `businesses/${businessId}/sales`);
      await addDoc(salesColRef, {
        productId: product.id,
        productName: product.name,
        quantity: qty,
        amount: amount,
        paymentType: paymentType,
        timestamp: serverTimestamp(),
      });

      toast({ title: 'Sale Recorded', description: `Successfully recorded sale of ${qty} ${product.name}` });
      setSelectedProduct('');
      setQuantity('1');
      setSaleAmount('');
      onClose();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseTitle || !expenseAmount) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please enter expense details' });
      return;
    }

    if (!businessId || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Business information not found' });
      return;
    }

    setIsSaving(true);
    try {
      const expensesColRef = collection(firestore, `businesses/${businessId}/expenses`);
      await addDoc(expensesColRef, {
        category: expenseCategory || 'other',
        title: expenseTitle,
        amount: parseFloat(expenseAmount),
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Expense Added', description: 'Successfully recorded expense' });
      setExpenseCategory('');
      setExpenseTitle('');
      setExpenseAmount('');
      onClose();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCashflow = async () => {
    if (!cashAmount) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please enter amount' });
      return;
    }

    if (!businessId || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Business information not found' });
      return;
    }

    setIsSaving(true);
    try {
      const transactionsColRef = collection(firestore, `businesses/${businessId}/transactions`);
      await addDoc(transactionsColRef, {
        type: transactionType,
        amount: parseFloat(cashAmount),
        description: cashDescription,
        createdAt: serverTimestamp(),
      });

      toast({
        title: transactionType === 'deposit' ? 'Deposit Recorded' : 'Withdrawal Recorded',
        description: `Successfully recorded ${transactionType}`
      });
      setCashAmount('');
      setCashDescription('');
      onClose();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedProductData = productsData?.find(p => p.id === selectedProduct);
  const calculatedAmount = selectedProductData && quantity ? selectedProductData.price * parseInt(quantity) : 0;

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">Business Tools</h2>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 rounded-none border-b">
          <TabsTrigger value="add-product">Record Sale</TabsTrigger>
          <TabsTrigger value="add-inventory">Add Stock</TabsTrigger>
          <TabsTrigger value="add-expense">Add Expense</TabsTrigger>
          <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
        </TabsList>

        <div className="p-6">
          {/* Record Sale Tab */}
          <TabsContent value="add-product" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Record Sale
                </CardTitle>
                <CardDescription>Record a product sale to track inventory and revenue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Product *</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {productsData?.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ${product.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Sale Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(e.target.value)}
                    placeholder={calculatedAmount ? `Default: ${calculatedAmount}` : '0.00'}
                  />
                  {calculatedAmount > 0 && !saleAmount && (
                    <p className="text-sm text-muted-foreground">Will use default price: ${calculatedAmount}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentType">Payment Method</Label>
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger id="paymentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  onClick={handleRecordSale}
                  disabled={isSaving || !selectedProduct || !quantity}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Sale
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Stock Tab */}
          <TabsContent value="add-inventory" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Add Stock
                </CardTitle>
                <CardDescription>Add inventory to your products</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stockProduct">Product *</Label>
                  <Select value={stockProduct} onValueChange={setStockProduct}>
                    <SelectTrigger id="stockProduct">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {productsData?.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} (Current: {product.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Quantity to Add *</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="1"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={async () => {
                    // Simplified stock add - full implementation would update product quantity
                    toast({ title: 'Coming Soon', description: 'Full stock management feature coming soon' });
                    onClose();
                  }}
                  disabled={isSaving || !stockProduct || !stockQuantity}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Stock
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Expense Tab */}
          <TabsContent value="add-expense" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FilePlus className="h-5 w-5" />
                  Add Expense
                </CardTitle>
                <CardDescription>Record business expenses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expenseCategory">Category</Label>
                  <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                    <SelectTrigger id="expenseCategory">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="salaries">Salaries</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expenseTitle">Description *</Label>
                  <Input
                    id="expenseTitle"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    placeholder="What was this expense for?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expenseAmount">Amount *</Label>
                  <Input
                    id="expenseAmount"
                    type="number"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleAddExpense}
                  disabled={isSaving || !expenseTitle || !expenseAmount}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Expense
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cashflow Tab */}
          <TabsContent value="cashflow" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CircleDollarSign className="h-5 w-5" />
                  Cashflow
                </CardTitle>
                <CardDescription>Record deposits and withdrawals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transactionType">Transaction Type</Label>
                  <Select value={transactionType} onValueChange={(value: 'deposit' | 'withdrawal') => setTransactionType(value)}>
                    <SelectTrigger id="transactionType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">Deposit (Money In)</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal (Money Out)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cashAmount">Amount *</Label>
                  <Input
                    id="cashAmount"
                    type="number"
                    step="0.01"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cashDescription">Description (Optional)</Label>
                  <Textarea
                    id="cashDescription"
                    value={cashDescription}
                    onChange={(e) => setCashDescription(e.target.value)}
                    placeholder="Add a note about this transaction"
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleCashflow}
                  disabled={isSaving || !cashAmount}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record {transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
