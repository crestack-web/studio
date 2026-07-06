'use client';

import React, { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { Eye, Edit, Ban, Check, X, Users, Plus, Shield, Search, Trash2 } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  permissions: {
    overview: boolean;
    users: boolean;
    businesses: boolean;
    staff: boolean;
    support: boolean;
    features: boolean;
    analytics: boolean;
    churn: boolean;
    askmo: boolean;
    notifications: boolean;
  };
  status: 'active' | 'disabled';
  lastActive?: string;
  createdAt: string;
}

export default function AdminTeam() {
  const { firestore } = initializeFirebase();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Add admin form state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'super_admin'>('admin');
  const [newAdminPermissions, setNewAdminPermissions] = useState<AdminUser['permissions']>({
    overview: true,
    users: true,
    businesses: true,
    staff: true,
    support: true,
    features: true,
    analytics: true,
    churn: true,
    askmo: true,
    notifications: true,
  });
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Edit permissions state
  const [editingPermissions, setEditingPermissions] = useState<AdminUser['permissions']>({});
  const [editingRole, setEditingRole] = useState<'admin' | 'super_admin'>('admin');
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  useEffect(() => {
    loadAdminUsers();
  }, [firestore]);

  const loadAdminUsers = async () => {
    try {
      setLoading(true);

      // Load from adminUsers collection
      const adminQuery = query(collection(firestore, 'adminUsers'));
      const adminSnapshot = await getDocs(adminQuery);
      
      const adminList: AdminUser[] = [];
      for (const doc of adminSnapshot.docs) {
        const data = doc.data();
        adminList.push({
          id: doc.id,
          email: data.email || '',
          name: data.name || '',
          role: data.role || 'admin',
          permissions: data.permissions || {},
          status: data.status || 'active',
          lastActive: data.lastActive?.toDate?.()?.toLocaleDateString(),
          createdAt: data.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A',
        });
      }

      // Also check if whitelist emails in adminAuth.ts are in the collection
      const { ADMIN_EMAILS } = await import('@/lib/adminAuth');
      
      for (const email of ADMIN_EMAILS) {
        if (!adminList.find(a => a.email.toLowerCase() === email.toLowerCase())) {
          // Add missing admin from whitelist
          const adminId = `admin_${email.replace(/[@.]/g, '_')}`;
          adminList.push({
            id: adminId,
            email,
            name: email.split('@')[0],
            role: 'super_admin',
            permissions: {
              overview: true,
              users: true,
              businesses: true,
              staff: true,
              support: true,
              features: true,
              analytics: true,
              churn: true,
              askmo: true,
              notifications: true,
            },
            status: 'active',
            createdAt: 'N/A',
          });
        }
      }

      setAdminUsers(adminList);
    } catch (error) {
      console.error('Error loading admin users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setEditingPermissions({ ...admin.permissions });
    setEditingRole(admin.role);
    setShowDetailModal(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedAdmin) return;

    setIsSavingPermissions(true);

    try {
      const adminRef = doc(firestore, 'adminUsers', selectedAdmin.id);
      await updateDoc(adminRef, {
        permissions: editingPermissions,
        role: editingRole,
      });

      // Update local state
      setAdminUsers(prev => prev.map(a => 
        a.id === selectedAdmin.id ? { ...a, permissions: editingPermissions, role: editingRole } : a
      ));

      setSelectedAdmin({
        ...selectedAdmin,
        permissions: editingPermissions,
        role: editingRole,
      });

      alert('Admin permissions updated successfully');
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to update permissions');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim() || !newAdminName.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsAddingAdmin(true);

    try {
      const adminId = `admin_${newAdminEmail.replace(/[@.]/g, '_')}`;
      
      await setDoc(doc(firestore, 'adminUsers', adminId), {
        email: newAdminEmail.trim().toLowerCase(),
        name: newAdminName.trim(),
        role: newAdminRole,
        permissions: newAdminPermissions,
        status: 'active',
        createdAt: new Date(),
      });

      // Reload admin list
      await loadAdminUsers();

      // Reset form
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminRole('admin');
      setNewAdminPermissions({
        overview: true,
        users: true,
        businesses: true,
        staff: true,
        support: true,
        features: true,
        analytics: true,
        churn: true,
        askmo: true,
        notifications: true,
      });
      setShowAddModal(false);
      alert('Admin user added successfully');
    } catch (error) {
      console.error('Error adding admin:', error);
      alert('Failed to add admin user');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleDisableAdmin = async (admin: AdminUser) => {
    if (!confirm(`Are you sure you want to disable ${admin.name}? They will not be able to access the admin dashboard.`)) {
      return;
    }

    try {
      const adminRef = doc(firestore, 'adminUsers', admin.id);
      await updateDoc(adminRef, {
        status: 'disabled',
      });

      setAdminUsers(prev => prev.map(a => 
        a.id === admin.id ? { ...a, status: 'disabled' } : a
      ));

      if (selectedAdmin?.id === admin.id) {
        setSelectedAdmin({ ...selectedAdmin, status: 'disabled' });
      }

      alert(`${admin.name} has been disabled successfully`);
    } catch (error) {
      console.error('Error disabling admin:', error);
      alert('Failed to disable admin user');
    }
  };

  const handleEnableAdmin = async (admin: AdminUser) => {
    try {
      const adminRef = doc(firestore, 'adminUsers', admin.id);
      await updateDoc(adminRef, {
        status: 'active',
      });

      setAdminUsers(prev => prev.map(a => 
        a.id === admin.id ? { ...a, status: 'active' } : a
      ));

      if (selectedAdmin?.id === admin.id) {
        setSelectedAdmin({ ...selectedAdmin, status: 'active' });
      }

      alert(`${admin.name} has been enabled successfully`);
    } catch (error) {
      console.error('Error enabling admin:', error);
      alert('Failed to enable admin user');
    }
  };

  const handleRemoveAdmin = async (admin: AdminUser) => {
    if (!confirm(`Are you sure you want to remove ${admin.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await setDoc(doc(firestore, 'adminUsers', admin.id), {
        status: 'removed',
        removedAt: new Date(),
      }, { merge: true });

      setAdminUsers(prev => prev.filter(a => a.id !== admin.id));

      if (selectedAdmin?.id === admin.id) {
        setShowDetailModal(false);
        setSelectedAdmin(null);
      }

      alert(`${admin.name} has been removed successfully`);
    } catch (error) {
      console.error('Error removing admin:', error);
      alert('Failed to remove admin user');
    }
  };

  const AVAILABLE_PERMISSIONS = [
    { key: 'overview' as const, label: 'Dashboard Overview', icon: '📊' },
    { key: 'users' as const, label: 'User Management', icon: '👥' },
    { key: 'businesses' as const, label: 'Business Management', icon: '🏢' },
    { key: 'staff' as const, label: 'Staff Management', icon: '👔' },
    { key: 'support' as const, label: 'Support Inbox', icon: '💬' },
    { key: 'features' as const, label: 'Feature Requests', icon: '💡' },
    { key: 'analytics' as const, label: 'Analytics', icon: '📈' },
    { key: 'churn' as const, label: 'Churn Detection', icon: '⚠️' },
    { key: 'askmo' as const, label: 'Ask MO Analytics', icon: '🤖' },
    { key: 'notifications' as const, label: 'Notifications', icon: '🔔' },
  ];

  const filteredAdmins = adminUsers.filter(admin => {
    const matchesSearch = 
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || admin.role === filterRole;
    const isNotRemoved = admin.status !== 'removed';
    
    return matchesSearch && matchesRole && isNotRemoved;
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
          <h2 className="text-2xl font-bold text-gray-900">Admin Team</h2>
          <p className="text-gray-500 mt-1">Manage admin dashboard access and permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Add Admin
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Admin Dashboard Access</h4>
            <p className="text-sm text-blue-700">
              Super admins have full access to all features. Regular admins can be assigned specific permissions.
              Emails in the admin whitelist (adminAuth.ts) always have super admin access.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Admin Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Admin</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Active</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((admin) => (
              <tr key={admin.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-gray-900">{admin.name}</div>
                    <div className="text-sm text-gray-500">{admin.email}</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    admin.role === 'super_admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    admin.status === 'active' ? 'bg-green-100 text-green-800' :
                    admin.status === 'disabled' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {admin.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {admin.lastActive || 'Never'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleViewDetails(admin)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="View Details & Permissions"
                    >
                      <Edit size={18} />
                    </button>
                    {admin.status === 'active' ? (
                      <button
                        onClick={() => handleDisableAdmin(admin)}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Disable Admin"
                      >
                        <Ban size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnableAdmin(admin)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Enable Admin"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    {admin.role !== 'super_admin' && (
                      <button
                        onClick={() => handleRemoveAdmin(admin)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Admin"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAdmins.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No admin users found</p>
        </div>
      )}

      {/* Admin Detail/Edit Modal */}
      {showDetailModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Admin Details</h3>
                <p className="text-gray-500">{selectedAdmin.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedAdmin(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Admin Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Admin Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500 text-sm">Name</span>
                    <p className="font-medium">{selectedAdmin.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Email</span>
                    <p className="font-medium">{selectedAdmin.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Role</span>
                    <select
                      value={editingRole}
                      onChange={(e) => setEditingRole(e.target.value as 'admin' | 'super_admin')}
                      disabled={selectedAdmin.role === 'super_admin'}
                      className="mt-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Status</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedAdmin.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedAdmin.status === 'disabled' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedAdmin.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              {editingRole !== 'super_admin' && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Permissions</h4>
                    <button
                      onClick={handleSavePermissions}
                      disabled={isSavingPermissions}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    >
                      {isSavingPermissions ? 'Saving...' : 'Save Permissions'}
                    </button>
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
              )}

              {editingRole === 'super_admin' && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <p className="text-sm text-purple-800">
                    <strong>Super Admin:</strong> This user has full access to all admin dashboard features. Permissions cannot be modified for super admins.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Add New Admin</h3>
                <p className="text-gray-500">Add a new admin user to the dashboard</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewAdminEmail('');
                  setNewAdminName('');
                  setNewAdminRole('admin');
                  setNewAdminPermissions({
                    overview: true,
                    users: true,
                    businesses: true,
                    staff: true,
                    support: true,
                    features: true,
                    analytics: true,
                    churn: true,
                    askmo: true,
                    notifications: true,
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
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter admin name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This email will be used for login. Make sure it's the same email they use to sign in.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'super_admin')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Super admins have full access to all features. Regular admins can have custom permissions.
                </p>
              </div>

              {newAdminRole === 'admin' && (
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
                            checked={newAdminPermissions[permission.key] || false}
                            onChange={(e) => {
                              setNewAdminPermissions(prev => ({
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
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddAdmin}
                  disabled={isAddingAdmin}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  {isAddingAdmin ? 'Adding Admin...' : 'Add Admin User'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewAdminEmail('');
                    setNewAdminName('');
                    setNewAdminRole('admin');
                    setNewAdminPermissions({
                      overview: true,
                      users: true,
                      businesses: true,
                      staff: true,
                      support: true,
                      features: true,
                      analytics: true,
                      churn: true,
                      askmo: true,
                      notifications: true,
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