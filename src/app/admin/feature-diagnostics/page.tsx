'use client';

// ═══════════════════════════════════════════
//  BUSMO — Admin Feature Diagnostics Page
//  Debug tool for feature registry and access control
// ═══════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { 
  getAllFeatures, 
  getFeaturesByPlan, 
  getFeaturesByBusinessCategory,
  checkFeatureAccess,
  Plan,
  BusinessCategory,
} from '@/lib/featureRegistry';
import { getCategoryBundle, getAllCategoryBundles } from '@/lib/categoryFeatureBundles';
import { isAdmin } from '@/lib/adminAuth';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Settings, 
  Users, 
  Building, 
  Package,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

export default function FeatureDiagnosticsPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [filterPlan, setFilterPlan] = useState<Plan | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<BusinessCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const authorized = await isAdmin();
      setIsAuthorized(authorized);
      if (authorized) {
        loadUsers();
      }
    } catch (error) {
      console.error('Authorization check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { firestore } = initializeFirebase();
      const usersSnapshot = await getDocs(collection(firestore, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const runDiagnostics = async (user: any) => {
    setSelectedUser(user);
    setIsLoading(true);

    try {
      const { firestore } = initializeFirebase();
      
      // Get user's business data
      const businessDoc = await getDoc(doc(firestore, 'businesses', user.businessId));
      const businessData = businessDoc.exists() ? businessDoc.data() : null;

      const userPlan = (user.plan || 'starter') as Plan;
      const businessCategory = (user.category || user.businessType || 'other') as BusinessCategory;
      const selectedFeatures = (user.selectedFeatures || []) as string[];
      const enabledFeatures = new Set(selectedFeatures);

      // Run feature access checks
      const allFeatures = getAllFeatures();
      const featureChecks = allFeatures.map(feature => {
        const access = checkFeatureAccess(feature.id, userPlan, businessCategory, enabledFeatures);
        return {
          feature,
          access,
          isEnabled: enabledFeatures.has(feature.id),
        };
      });

      // Get category bundle
      const categoryBundle = getCategoryBundle(businessCategory);

      // Get plan features
      const planFeatures = getFeaturesByPlan(userPlan);

      // Get category features
      const categoryFeatures = getFeaturesByBusinessCategory(businessCategory);

      setDiagnostics({
        user,
        businessData,
        userPlan,
        businessCategory,
        enabledFeatures,
        featureChecks,
        categoryBundle,
        planFeatures,
        categoryFeatures,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading diagnostics...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    if (filterPlan !== 'all' && user.plan !== filterPlan) return false;
    if (filterCategory !== 'all' && user.category !== filterCategory) return false;
    if (searchQuery && !user.email?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Feature Diagnostics</h1>
          <p className="text-gray-600">Debug feature registry and access control</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value as Plan | 'all')}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Plans</option>
              <option value="starter">Starter</option>
              <option value="standard">Standard</option>
              <option value="pro">Pro</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as BusinessCategory | 'all')}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Categories</option>
              <option value="retail">Retail</option>
              <option value="restaurant">Restaurant</option>
              <option value="grocery">Grocery</option>
              <option value="fashion">Fashion</option>
              <option value="electronics">Electronics</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="services">Services</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="supermarket">Supermarket</option>
              <option value="cafe">Cafe</option>
              <option value="wholesale">Wholesale</option>
              <option value="distributor">Distributor</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* User List */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Users ({filteredUsers.length})</h2>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                onClick={() => runDiagnostics(user)}
              >
                <div className="flex items-center gap-4">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium">{user.email}</div>
                    <div className="text-sm text-gray-500">
                      {user.plan} • {user.category || user.businessType || 'No category'}
                    </div>
                  </div>
                </div>
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostics Results */}
        {diagnostics && (
          <div className="space-y-6">
            {/* User Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium">{diagnostics.user.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Plan</div>
                  <div className="font-medium capitalize">{diagnostics.userPlan}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Category</div>
                  <div className="font-medium capitalize">{diagnostics.businessCategory}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Enabled Features</div>
                  <div className="font-medium">{diagnostics.enabledFeatures.size}</div>
                </div>
              </div>
            </div>

            {/* Feature Access Matrix */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Feature Access Matrix
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {diagnostics.featureChecks.map(({ feature, access, isEnabled }: any) => (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{feature.name}</div>
                        <div className="text-xs text-gray-500">{feature.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs">
                        <span className={`px-2 py-1 rounded ${isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      {access.eligible ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Bundle */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Category Bundle
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Category</div>
                  <div className="font-medium capitalize">{diagnostics.categoryBundle.category}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Recommended Features</div>
                  <div className="font-medium">{diagnostics.categoryBundle.recommendedFeatures.length}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Recommended Plan</div>
                  <div className="font-medium capitalize">{diagnostics.categoryBundle.recommendedPlan}</div>
                </div>
              </div>
            </div>

            {/* Plan Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Plan Features ({diagnostics.planFeatures.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {diagnostics.planFeatures.map((feature: any) => (
                  <span
                    key={feature.id}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {feature.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Category Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Category Features ({diagnostics.categoryFeatures.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {diagnostics.categoryFeatures.map((feature: any) => (
                  <span
                    key={feature.id}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    {feature.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
