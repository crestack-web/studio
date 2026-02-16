import { Calendar, Package, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { addDays, format } from 'date-fns';

interface Product {
  id: string;
  name: string;
  costPrice: number;
  defaultShelfLife?: number;
  hasExpiryDate: boolean;
}

interface AddStockFormProps {
  product: Product;
  onSubmit: (stockData: any) => void;
  onCancel: () => void;
}

export function AddStockForm({ product, onSubmit, onCancel }: AddStockFormProps) {
  const [quantity, setQuantity] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(product.costPrice || 0);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [useDefaultShelfLife, setUseDefaultShelfLife] = useState(true);
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-calculate expiry if using default shelf life
  const calculatedExpiryDate = product.defaultShelfLife 
    ? addDays(new Date(), product.defaultShelfLife)
    : null;

  const finalExpiryDate = useDefaultShelfLife ? calculatedExpiryDate : expiryDate;
  const totalCost = quantity * costPrice;

  const handleSubmit = () => {
    if (!product.hasExpiryDate || !finalExpiryDate) {
      // Handle error - expiry date required
      return;
    }

    const stockData = {
      productId: product.id,
      quantity,
      costPrice,
      expiryDate: finalExpiryDate,
      supplier,
      notes,
      addedDate: new Date(),
    };

    onSubmit(stockData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Add Stock - {product.name}
        </h2>
      </div>
      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quantity to Add *
        </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          min="1"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          placeholder="e.g., 50"
        />
      </div>
      {/* Cost Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cost Price per Unit *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
          <input
            type="number"
            value={costPrice}
            onChange={(e) => setCostPrice(Number(e.target.value))}
            min="0"
            step="0.01"
            className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            placeholder="0.00"
          />
        </div>
      </div>
      {/* Expiry Date (if product has expiry tracking) */}
      {product.hasExpiryDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Expiry Date *
          </label>
          {product.defaultShelfLife && (
            <label className="flex items-center gap-3 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useDefaultShelfLife}
                onChange={(e) => setUseDefaultShelfLife(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Use default shelf life ({product.defaultShelfLife} days)
                {calculatedExpiryDate && (
                  <span className="ml-2 text-purple-600 font-medium">
                    → {format(calculatedExpiryDate, 'MMM dd, yyyy')}
                  </span>
                )}
              </span>
            </label>
          )}
          {!useDefaultShelfLife && (
            <input
              type="date"
              value={expiryDate ? format(expiryDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setExpiryDate(new Date(e.target.value))}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          )}
          {finalExpiryDate && (
            <div className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                This stock will expire on <strong>{format(finalExpiryDate, 'MMMM dd, yyyy')}</strong>
                {' '}({Math.ceil((finalExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days from now)
              </div>
            </div>
          )}
        </div>
      )}
      {/* Supplier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Supplier (Optional)
        </label>
        <input
          type="text"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          placeholder="e.g., ABC Distributors"
        />
      </div>
      {/* Batch Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Batch Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          placeholder="e.g., Invoice #12345, Delivered on Feb 15"
        />
      </div>
      {/* Summary */}
      <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4">
        <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-2">
          Summary
        </h3>
        <div className="space-y-1 text-sm text-purple-800 dark:text-purple-300">
          <p>Adding <strong>{quantity}</strong> units at <strong>₦{costPrice.toLocaleString()}</strong>/unit</p>
          <p>Total Cost: <strong>₦{totalCost.toLocaleString()}</strong></p>
          {finalExpiryDate && (
            <p>Expires: <strong>{format(finalExpiryDate, 'MMMM dd, yyyy')}</strong> 
              ({Math.ceil((finalExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days)
            </p>
          )}
        </div>
      </div>
      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!quantity || !costPrice || (product.hasExpiryDate && !finalExpiryDate)}
          className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Stock
        </button>
      </div>
    </div>
  );
}
