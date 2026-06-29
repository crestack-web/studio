'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { checkFeatureAccess } from '@/lib/featureRestrictions';
import { Plus, Edit2, Trash2, Search, DollarSign, Users, Calendar, TrendingUp, FileText, Download } from 'lucide-react';
import styles from './PayrollPage.module.css';

interface PayrollEntry {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  period: string; // e.g., "2025-06"
  baseSalary: number;
  bonuses: number;
  deductions: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimePay: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  active: boolean;
}

let firestoreInstance: ReturnType<typeof initializeFirebase>['firestore'] | null = null;

export default function PayrollPage() {
  const { user, showToast } = useApp();
  const { formatMoney } = useCurrency();
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PayrollEntry | null>(null);
  const [formData, setFormData] = useState({
    staffId: '',
    period: '',
    baseSalary: '',
    bonuses: '',
    deductions: '',
    overtimeHours: '',
    overtimeRate: '',
    notes: '',
  });

  // Check feature access
  useEffect(() => {
    const checkAccess = async () => {
      if (user?.id) {
        const hasAccess = await checkFeatureAccess(user.id, 'payroll-management');
        if (!hasAccess.eligible) {
          showToast('This feature requires a Pro plan or higher');
        }
      }
    };
    checkAccess();
  }, [user]);

  // Load payroll entries and staff
  useEffect(() => {
    loadPayrollEntries();
    loadStaffMembers();
  }, [user?.businessId]);

  const loadPayrollEntries = async () => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const payrollCollection = collection(firestore, 'businesses', user.businessId, 'payroll');
      const snapshot = await getDocs(payrollCollection);
      
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        paidDate: doc.data().paidDate?.toDate(),
      })) as PayrollEntry[];
      
      // Sort by period (descending)
      entries.sort((a, b) => b.period.localeCompare(a.period));
      
      setPayrollEntries(entries);
    } catch (error) {
      console.error('Failed to load payroll entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaffMembers = async () => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const staffCollection = collection(firestore, 'businesses', user.businessId, 'staff');
      const snapshot = await getDocs(staffCollection);
      
      const staff = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as StaffMember[];
      
      setStaffMembers(staff.filter(s => s.active));
    } catch (error) {
      console.error('Failed to load staff:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const payrollCollection = collection(firestore, 'businesses', user.businessId, 'payroll');
      
      const overtimeHours = parseFloat(formData.overtimeHours) || 0;
      const overtimeRate = parseFloat(formData.overtimeRate) || 0;
      const overtimePay = overtimeHours * overtimeRate;
      const baseSalary = parseFloat(formData.baseSalary);
      const bonuses = parseFloat(formData.bonuses) || 0;
      const deductions = parseFloat(formData.deductions) || 0;
      const netSalary = baseSalary + bonuses + overtimePay - deductions;
      
      const staffMember = staffMembers.find(s => s.id === formData.staffId);
      
      const entryData = {
        staffId: formData.staffId,
        staffName: staffMember?.name || 'Unknown',
        staffRole: staffMember?.role || 'Staff',
        period: formData.period,
        baseSalary,
        bonuses,
        deductions,
        overtimeHours,
        overtimeRate,
        overtimePay,
        netSalary,
        status: 'pending',
        notes: formData.notes,
        createdAt: new Date(),
      };

      if (editingEntry) {
        await updateDoc(doc(payrollCollection, editingEntry.id), entryData);
        showToast('Payroll entry updated successfully');
      } else {
        await addDoc(payrollCollection, entryData);
        showToast('Payroll entry created successfully');
      }

      setShowAddModal(false);
      setEditingEntry(null);
      resetForm();
      loadPayrollEntries();
    } catch (error) {
      console.error('Failed to save payroll entry:', error);
      showToast('Failed to save payroll entry');
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this payroll entry?')) return;
    
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      await deleteDoc(doc(firestore, 'businesses', user.businessId, 'payroll', entryId));
      
      showToast('Payroll entry deleted successfully');
      loadPayrollEntries();
    } catch (error) {
      console.error('Failed to delete payroll entry:', error);
      showToast('Failed to delete payroll entry');
    }
  };

  const handleStatusChange = async (entry: PayrollEntry, newStatus: PayrollEntry['status']) => {
    try {
      if (!user?.businessId) return;
      
      const { firestore } = initializeFirebase();
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'paid') {
        updateData.paidDate = new Date();
      }
      
      await updateDoc(doc(firestore, 'businesses', user.businessId, 'payroll', entry.id), updateData);
      
      showToast(`Payroll status updated to ${newStatus}`);
      loadPayrollEntries();
    } catch (error) {
      console.error('Failed to update payroll status:', error);
      showToast('Failed to update payroll status');
    }
  };

  const handleProcessPayroll = async (entry: PayrollEntry) => {
    if (!confirm(`Process payroll for ${entry.staffName} - ${formatMoney(entry.netSalary)}?`)) return;
    
    try {
      await handleStatusChange(entry, 'processed');
    } catch (error) {
      console.error('Failed to process payroll:', error);
    }
  };

  const handleMarkAsPaid = async (entry: PayrollEntry) => {
    if (!confirm(`Mark payroll as paid for ${entry.staffName}?`)) return;
    
    try {
      await handleStatusChange(entry, 'paid');
    } catch (error) {
      console.error('Failed to mark as paid:', error);
    }
  };

  const handleEdit = (entry: PayrollEntry) => {
    setEditingEntry(entry);
    setFormData({
      staffId: entry.staffId,
      period: entry.period,
      baseSalary: entry.baseSalary.toString(),
      bonuses: entry.bonuses.toString(),
      deductions: entry.deductions.toString(),
      overtimeHours: entry.overtimeHours.toString(),
      overtimeRate: entry.overtimeRate.toString(),
      notes: entry.notes || '',
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      staffId: '',
      period: new Date().toISOString().slice(0, 7), // YYYY-MM format
      baseSalary: '',
      bonuses: '',
      deductions: '',
      overtimeHours: '',
      overtimeRate: '',
      notes: '',
    });
  };

  const filteredEntries = payrollEntries.filter(entry => {
    const matchesSearch = entry.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.staffRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.period.includes(searchQuery);
    const matchesPeriod = filterPeriod === 'all' || entry.period === filterPeriod;
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    return matchesSearch && matchesPeriod && matchesStatus;
  });

  const getStatusColor = (status: PayrollEntry['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'processed': return 'bg-blue-100 text-blue-700';
      case 'paid': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateTotalPayroll = () => {
    return payrollEntries.reduce((total, entry) => total + entry.netSalary, 0);
  };

  const calculatePendingPayroll = () => {
    return payrollEntries
      .filter(e => e.status === 'pending')
      .reduce((total, entry) => total + entry.netSalary, 0);
  };

  const getPaidPayroll = () => {
    return payrollEntries
      .filter(e => e.status === 'paid')
      .reduce((total, entry) => total + entry.netSalary, 0);
  };

  const getUniquePeriods = () => {
    const periods = new Set(payrollEntries.map(e => e.period));
    return Array.from(periods).sort().reverse();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading payroll data...</p>
        </div>
      </div>
    );
  }

  const uniquePeriods = getUniquePeriods();
  const totalPayroll = calculateTotalPayroll();
  const pendingPayroll = calculatePendingPayroll();
  const paidPayroll = getPaidPayroll();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Payroll Management</h1>
          <p className="text-gray-600">Manage staff salaries and payments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Export functionality would go here
              showToast('Export feature coming soon');
            }}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            <Download size={20} />
            Export
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingEntry(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Payroll Entry
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Total Payroll</p>
              <p className="text-2xl font-bold">{formatMoney(totalPayroll)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold">{formatMoney(pendingPayroll)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Paid</p>
              <p className="text-2xl font-bold">{formatMoney(paidPayroll)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-500">Active Staff</p>
              <p className="text-2xl font-bold">{staffMembers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Periods</option>
            {uniquePeriods.map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processed">Processed</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Staff</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Period</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Base Salary</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Bonuses</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Overtime</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Deductions</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Net Salary</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredEntries.map(entry => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{entry.staffName}</div>
                  <div className="text-sm text-gray-500">{entry.staffRole}</div>
                </td>
                <td className="px-4 py-3 text-sm">{entry.period}</td>
                <td className="px-4 py-3 text-sm">{formatMoney(entry.baseSalary)}</td>
                <td className="px-4 py-3 text-sm text-green-600">+{formatMoney(entry.bonuses)}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="text-green-600">+{formatMoney(entry.overtimePay)}</div>
                  <div className="text-xs text-gray-500">{entry.overtimeHours}h @ {formatMoney(entry.overtimeRate)}/h</div>
                </td>
                <td className="px-4 py-3 text-sm text-red-600">-{formatMoney(entry.deductions)}</td>
                <td className="px-4 py-3 font-semibold">{formatMoney(entry.netSalary)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getStatusColor(entry.status)}`}>
                    {entry.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {entry.status === 'pending' && (
                      <button
                        onClick={() => handleProcessPayroll(entry)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        title="Process"
                      >
                        Process
                      </button>
                    )}
                    {entry.status === 'processed' && (
                      <button
                        onClick={() => handleMarkAsPaid(entry)}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        title="Mark as paid"
                      >
                        Pay
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredEntries.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No payroll entries found</p>
            <button
              onClick={() => {
                resetForm();
                setEditingEntry(null);
                setShowAddModal(true);
              }}
              className="mt-4 text-blue-600 hover:underline"
            >
              Add your first payroll entry
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingEntry ? 'Edit Payroll Entry' : 'Add Payroll Entry'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Staff Member</label>
                <select
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select staff member</option>
                  {staffMembers.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} - {staff.role} ({formatMoney(staff.baseSalary)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Period (YYYY-MM)</label>
                <input
                  type="month"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Base Salary</label>
                <input
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bonuses</label>
                  <input
                    type="number"
                    value={formData.bonuses}
                    onChange={(e) => setFormData({ ...formData, bonuses: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Deductions</label>
                  <input
                    type="number"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Overtime Hours</label>
                  <input
                    type="number"
                    value={formData.overtimeHours}
                    onChange={(e) => setFormData({ ...formData, overtimeHours: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Overtime Rate</label>
                  <input
                    type="number"
                    value={formData.overtimeRate}
                    onChange={(e) => setFormData({ ...formData, overtimeRate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEntry(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingEntry ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

