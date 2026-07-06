'use client';

import React, { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where,
  updateDoc 
} from 'firebase/firestore';
import { Eye, Edit, Ban, Check, X, Users, Plus, UserPlus, Shield, Search } from 'lucide-react';

interface Staff {
  id: string;
  userId: string;
  staffId: string;
  name: string;
  role: string;
  email: string;
  businessId: string;
  businessName: string;
  permissions: Record<string, boolean>;
  status: 'active' | 'banned' | 'removed';
  createdAt: string;
}

interface Business {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
}

export default function StaffManagement() {
  const { firestore } = initializeFirebase();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBusiness, setFilterBusiness] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  // Add staff form state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [newStaffPermissions, setNewStaffPermissions] = useState<Record<string, boolean>>({
    sale: true,
    inv: false,
    hist: false,
    atd: false,
    msg: false,
  });
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  // Edit permissions state
  const [editingPermissions, setEditingPermissions] = useState<Record<string, boolean>>({});
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  const AVAILABLE_PERMISSIONS = [
    { key: 'sale', label: 'Sales Recording', icon: '🛒' },
    { key: 'inv', label: 'Inventory View', icon: '📦' },
    { key: 'hist', label: 'History & Reports', icon: '📊' },
    { key: 'atd', label: 'Attendance', icon: '⏰' },
    { key: 'msg', label: 'Messages', icon: '💬' },
  ];

  const AVAILABLE_ROLES = [
    'Cashier',
    'Sales Associate',
    'Inventory Manager',
    'Store Manager',
    'Accountant',
    'Supervisor',
    'Warehouse Staff',
    'Customer Service',
    'Assistant Manager',
    'General Staff',
    'Chef',
    'Waiter',
    'Bartender',
    'Delivery Staff',
  ];

  useEffect(() => {
    loadData();
  }, [firestore]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all businesses
      const businessesQuery = query(collection(firestore, 'businesses'));
      const businessesSnapshot = await getDocs(businessesQuery);
      
      const businessList: Business[] = [];
      for (const bizDoc of businessesSnapshot.docs) {
        const bizData = bizDoc.data();
        businessList.push({
          id: bizDoc.id,
          name: bizData.name || 'Unnamed Business',
          ownerId: bizData.ownerId || '',
          ownerName: bizData.ownerName || 'Unknown',
          ownerEmail: bizData.ownerEmail || '',
        });
      }
      setBusinesses(businessList);

      // Load all staff from all businesses
      const allStaff: Staff[] = [];
      
      for (const business of businessList) {
        try {
          const staffQuery = query(
            collection(firestore, 'businesses', business.id, 'staff'),
            where('status', '!=', 'removed')
          );
          const staffSnapshot = await getDocs(staffQuery);
          
          for (const staffDoc of staffSnapshot.docs) {
            const staffData = staffDoc.data();
            allStaff.push({
              id: staffDoc.id,
              userId: staffData.userId || staffDoc.id,
              staffId: staffData.staffId || '',
              name: staffData.name || 'Unknown',
              role: staffData.role || 'General Staff',
              email: staffData.email || '',
              businessId: business.id,
              businessName: business.name,
              permissions: staffData.permissions || {},
              status: staffData.status || 'active',
              createdAt: staffData.createdAt?.toDate?.()?.toLocaleDateString() || staffData.createdAt || 'N/A',
            });
          }
        } catch (error) {
          console.error(`Error loading staff for business ${business.id}:`, error);
        }
      }

      // Also check users collection for staff with businessId
      try {
        const usersQuery = query(
          collection(firestore, 'users'),
          where('role', 'not-in', ['owner', 'admin'])
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          
          // Skip if already found in business staff collection
          if (allStaff.find(s => s.userId === userDoc.id || s.id === userDoc.id)) {
            continue;
          }
          
          // If user has businessId, add them as staff
          if (userData.businessId) {
            const business = businessList.find(b => b.id === userData.businessId);
            allStaff.push({
              id: userDoc.id,
              userId: userDoc.id,
              staffId: userData.staffId || '',
              name: userData.name || 'Unknown',
              role: userData.role || 'General Staff',
              email: userData.email || '',
              businessId: userData.businessId,
              businessName: business?.name || 'Unknown Business',
              permissions: userData.permissions || {},
              status: userData.status || 'active',
              createdAt: userData.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A',
            });
          }
        }
      } catch (error) {
        console.error('Error loading staff from users collection:', error);
      }

      setStaff(allStaff);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setShowDetailModal(true);
  };

  const handleEditPermissions = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setEditingPermissions({ ...staffMember.permissions });
    setShowDetailModal(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedStaff) return;

    setIsSavingPermissions(true);

    try {
      // Update in business staff collection
      const staffRef = doc(firestore, 'businesses', selectedStaff.businessId, 'staff', selectedStaff.id);
      await updateDoc(staffRef, {
        permissions: editingPermissions,
      });

      // Update in users collection
      const userRef = doc(firestore, 'users', selectedStaff.userId);
      await updateDoc(userRef, {
        permissions: editingPermissions,
      });

      // Update local state
      setStaff(prev => prev.map(s => 
        s.id === selectedStaff.id ? { ...s, permissions: editingPermissions } : s
      ));

      // Update selected staff
      setSelectedStaff({
        ...selectedStaff,
        permissions: editingPermissions,
      });

      alert('Permissions updated successfully');
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to update permissions');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaffName.trim() || !newStaffEmail.trim() || !selectedBusinessId || !newStaffRole.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsAddingStaff(true);

    try {
      // Get business details
      const businessDoc = await getDoc(doc(firestore, 'businesses', selectedBusinessId));
      if (!businessDoc.exists()) {
        alert('Selected business not found');
        setIsAddingStaff(false);
        return;
      }
      const businessData = businessDoc.data();

      // Create user document in users collection
      const staffUserId = `staff_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const staffId = `STF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      await setDoc(doc(firestore, 'users', staffUserId), {
        name: newStaffName.trim(),
        email: newStaffEmail.trim().toLowerCase(),
        role: newStaffRole.trim(),
        staffId: staffId,
        businessId: selectedBusinessId,
        businessName: businessData.name,
        permissions: newStaffPermissions,
        status: 'active',
        createdAt: new Date(),
      });

      // Create staff document in business staff collection
      await setDoc(doc(firestore, 'businesses', selectedBusinessId, 'staff', staffUserId), {
        userId: staffUserId,
        staffId: staffId,
        name: newStaffName.trim(),
        role: newStaffRole.trim(),
        email: newStaffEmail.trim().toLowerCase(),
        permissions: newStaffPermissions,
        status: 'active',
        createdAt: new Date(),
      });

      // Reload staff list
      await loadData();

      // Reset form
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffRole('');
      setSelectedBusinessId('');
      setNewStaffPermissions({
        sale: true,
        inv: false,
        hist: false,
        atd: false,
        msg: false,
      });
      setShowAddModal(false);
      alert('Staff member added successfully');
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Failed to add staff member');
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleBanStaff = async (staffMember: Staff) => {
    if (!confirm(`Are you sure you want to ban ${staffMember.name}? They will not be able to access the dashboard.`)) {
      return;
    }

    try {
      // Update in business staff collection
      const staffRef = doc(firestore, 'businesses', staffMember.businessId, 'staff', staffMember.id);
      await updateDoc(staffRef, {
        status: 'banned',
        bannedAt: new Date(),
      });

      // Update in users collection
      const userRef = doc(firestore, 'users', staffMember.userId);
      await updateDoc(userRef, {
        status: 'banned',
      });

      // Update local state
      setStaff(prev => prev.map(s => 
        s.id === staffMember.id ? { ...s, status: 'banned' } : s
      ));

      if (selectedStaff?.id === staffMember.id) {
        setSelectedStaff({ ...selectedStaff, status: 'banned' });
      }

      alert(`${staffMember.name} has been banned successfully`);
    } catch (error) {
      console.error('Error banning staff:', error);
      alert('Failed to ban staff member');
    }
  };

  const handleUnbanStaff = async (staffMember: Staff) => {
    try {
      // Update in business staff collection
      const staffRef = doc(firestore, 'businesses', staffMember.businessId, 'staff', staffMember.id);
      await updateDoc(staffRef, {
        status: 'active',
      });

      // Update in users collection
      const userRef = doc(firestore, 'users', staffMember.userId);
      await updateDoc(userRef, {
        status: 'active',
      });

      // Update local state
      setStaff(prev => prev.map(s => 
        s.id === staffMember.id ? { ...s, status: 'active' } : s
      ));

      if (selectedStaff?.id === staffMember.id) {
        setSelectedStaff({ ...selectedStaff, status: 'active' });
      }

      alert(`${staffMember.name} has been unbanned successfully`);
    } catch (error) {
      console.error('Error unbanning staff:', error);
      alert('Failed to unban staff member');
    }
  };

  const filteredStaff = staff.filter(staffMember => {
    const matchesSearch = 
      staffMember.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBusiness = filterBusiness === 'all' || staffMember.businessId === filterBusiness;
    const matchesRole = filterRole === 'all' || staffMember.role === filterRole;
    
    return matchesSearch && matchesBusiness && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-gray-500 mt-1">Manage staff members across all businesses</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <UserPlus size={18} />
          Add Staff
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterBusiness}
            onChange={(e) => setFilterBusiness(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Businesses</option>
            {businesses.map(business => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            {AVAILABLE_ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Staff</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Business</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Staff ID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((staffMember) => (
              <tr key={staffMember.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-gray-900">{staffMember.name}</div>
                    <div className="text-sm text-gray-500">{staffMember.email}</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    {staffMember.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-700">{staffMember.businessName}</td>
                <td className="py-3 px-4">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{staffMember.staffId}</code>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    staffMember.status === 'active' ? 'bg-green-100 text-green-800' :
                    staffMember.status === 'banned' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {staffMember.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleViewDetails(staffMember)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEditPermissions(staffMember)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Permissions"
                    >
                      <Shield size={18} />
                    </button>
                    {staffMember.status === 'active' ? (
                      <button
                        onClick={() => handleBanStaff(staffMember)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Ban Staff"
                      >
                        <Ban size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnbanStaff(staffMember)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Unban Staff"
                      >
                        <Check size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No staff members found matching your criteria</p>
        </div>
      )}

      {/* Staff Detail/Edit Modal */}
      {showDetailModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Staff Details</h3>
                <p className="text-gray-500">{selectedStaff.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedStaff(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Staff Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Staff Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500 text-sm">Name</span>
                    <p className="font-medium">{selectedStaff.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Email</span>
                    <p className="font-medium">{selectedStaff.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Role</span>
                    <p className="font-medium">{selectedStaff.role}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Staff ID</span>
                    <p className="font-medium font-mono text-sm">{selectedStaff.staffId}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Business</span>
                    <p className="font-medium">{selectedStaff.businessName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Status</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedStaff.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedStaff.status === 'banned' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedStaff.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Permissions</h4>
                  {editingPermissions && Object.keys(editingPermissions).length > 0 && (
                    <button
                      onClick={handleSavePermissions}
                      disabled={isSavingPermissions}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    >
                      {isSavingPermissions ? 'Saving...' : 'Save Permissions'}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {AVAILABLE_PERMISSIONS.map(permission => (
                    <div
                      key={permission.key}
                      className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{permission.icon}</span>
                        <span className="font-medium text-gray-900">{permission.label}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingPermissions[permission.key] || false}
                          onChange={(e) => {
                            setEditingPermissions(prev => ({
                              ...prev,
                              [permission.key]: e.target.checked,
                            }));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Add New Staff Member</h3>
                <p className="text-gray-500">Create a new staff account for a business</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewStaffName('');
                  setNewStaffEmail('');
                  setNewStaffRole('');
                  setSelectedBusinessId('');
                  setNewStaffPermissions({
                    sale: true,
                    inv: false,
                    hist: false,
                    atd: false,
                    msg: false,
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Business *
                </label>
                <select
                  value={selectedBusinessId}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Choose a business...</option>
                  {businesses.map(business => (
                    <option key={business.id} value={business.id}>
                      {business.name} (Owner: {business.ownerName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staff Name *
                </label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter staff name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a role...</option>
                  {AVAILABLE_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Permissions
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {AVAILABLE_PERMISSIONS.map(permission => (
                    <div
                      key={permission.key}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{permission.icon}</span>
                        <span className="font-medium text-gray-900">{permission.label}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newStaffPermissions[permission.key] || false}
                          onChange={(e) => {
                            setNewStaffPermissions(prev => ({
                              ...prev,
                              [permission.key]: e.target.checked,
                            }));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Note: Sales Recording permission is automatically enabled for all staff members.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddStaff}
                  disabled={isAddingStaff}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  {isAddingStaff ? 'Adding Staff...' : 'Add Staff Member'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewStaffName('');
                    setNewStaffEmail('');
                    setNewStaffRole('');
                    setSelectedBusinessId('');
                    setNewStaffPermissions({
                      sale: true,
                      inv: false,
                      hist: false,
                      atd: false,
                      msg: false,
                    });
                  }}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}