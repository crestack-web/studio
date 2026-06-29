'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { Pill } from './Badge';
import { NavIcons } from './NavIcons';
import styles from './StaffPage.module.css';
import { ChatPanel } from './ChatPanel';
import { initializeFirebase } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { BrevoService } from '@/services/email/brevo-service';
import { isRestaurantBusiness, getBusinessCategory } from './utils/restaurantHelpers';
import { getFeaturesByBusinessCategory, BusinessCategory } from '@/lib/featureRegistry';

interface StaffMember {
  id: string;
  staffId: string;
  name: string;
  role: string;
  email?: string;
  password?: string;
  avatarBg: string;
  avatarColor: string;
  initials: string;
  revenue: number;
  transactions: number;
  online: boolean;
  permissions: Record<string, boolean>;
  targets?: {
    revenue: number;
    transactions: number;
    period: 'daily' | 'weekly' | 'monthly';
  };
  activities?: ActivityLog[];
  // Restaurant-specific fields
  salary?: number;
  hourlyRate?: number;
  attendanceRecords?: AttendanceRecord[];
  payrollRecords?: PayrollRecord[];
}

interface AttendanceRecord {
  date: string;
  clockIn: string;
  clockOut?: string;
  shiftHours: number;
  isLate: boolean;
  status: 'present' | 'absent' | 'late';
}

interface PayrollRecord {
  period: string;
  baseSalary: number;
  overtimeHours: number;
  overtimePay: number;
  totalPay: number;
  paid: boolean;
}

interface ActivityLog {
  id: string;
  staffId: string;
  staffName: string;
  action: string;
  description: string;
  timestamp: number;
  metadata?: {
    amount?: number;
    items?: string[];
    branch?: string;
  };
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'owner' | 'staff';
  text: string;
  timestamp: number;
}

export default function StaffPage() {
  const generateStaffId = () => {
    return 'STF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const generateStaffPassword = () => {
    const length = 12;
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };
  const { navigateTo, showToast, user } = useApp();
  const { t } = useTranslation();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewCredentialsModal, setShowViewCredentialsModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showRemoveConfirmationModal, setShowRemoveConfirmationModal] = useState(false);
  const [staffToRemove, setStaffToRemove] = useState<StaffMember | null>(null);
  const credentialsRef = useRef<HTMLDivElement>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);
  const [targetStaff, setTargetStaff] = useState<StaffMember | null>(null);
  const [activityStaff, setActivityStaff] = useState<StaffMember | null>(null);
  const [newStaffCredentials, setNewStaffCredentials] = useState<{ staffId: string; password: string; name: string; email: string } | null>(null);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPermissions, setNewStaffPermissions] = useState<Record<string, boolean>>({
    sale: true,
    inv: false,
    hist: false,
    atd: false,
    msg: false,
    earn: false,
  });
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory>('other');
  const [availablePermissions, setAvailablePermissions] = useState<Array<{key: string, label: string, icon: string}>>([]);
  const [targetRevenue, setTargetRevenue] = useState(0);
  const [targetTransactions, setTargetTransactions] = useState(0);
  const [targetPeriod, setTargetPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [isRestaurant, setIsRestaurant] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [isSavingTargets, setIsSavingTargets] = useState(false);
  const [isBanningStaff, setIsBanningStaff] = useState(false);
  const [isRemovingStaff, setIsRemovingStaff] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Chat state
  const [activeTab, setActiveTab] = useState<'staff' | 'chat' | 'attendance' | 'payroll' | 'performance'>('staff');
  const [selectedChat, setSelectedChat] = useState<string>('team');
  const [selectedPerformanceStaff, setSelectedPerformanceStaff] = useState<StaffMember | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState<{ [key: string]: { id: string; messages: ChatMessage[] } }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load staff from Firestore on mount
  useEffect(() => {
    const loadStaffFromFirestore = async () => {
      try {
        const { auth, firestore } = initializeFirebase();
        const currentUserId = auth.currentUser?.uid || '';
        
        if (!currentUserId) {
          console.error('No current user found');
          return;
        }

        // Get owner's business ID
        const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
        const businessId = ownerDoc.data()?.businessId || 'default';

        // Check if business is a restaurant
        const restaurant = await isRestaurantBusiness(businessId);
        setIsRestaurant(restaurant);

        // Get business category
        const category = await getBusinessCategory(businessId);
        setBusinessCategory(category as BusinessCategory);

        // Load staff from Firestore
        const staffCollection = collection(firestore, 'businesses', businessId, 'staff');
        const staffSnapshot = await getDocs(staffCollection);
        
        const staffList: StaffMember[] = [];
        staffSnapshot.forEach((doc) => {
          const data = doc.data();
          const avatarBg = ['#D1FAE5', '#EDE8FC', '#EFF6FF', '#FEF3C7', '#FEE2E2', '#CCFBF1'][Math.floor(Math.random() * 6)];
          const avatarColor = ['#14A05A', '#7C3AED', '#2563EB', '#D97706', '#DC2626', '#0D9488'][Math.floor(Math.random() * 6)];
          
          staffList.push({
            id: doc.id,
            staffId: data.staffId || '',
            name: data.name || '',
            role: data.role || '',
            email: data.email || '',
            avatarBg,
            avatarColor,
            initials: getInitials(data.name || ''),
            revenue: data.revenue || 0,
            transactions: data.transactions || 0,
            online: data.online || false,
            permissions: data.permissions || {},
          });
        });

        setStaffMembers(staffList);
        
        // Also save to localStorage for backup
        localStorage.setItem('staff-members', JSON.stringify(staffList));
      } catch (error) {
        console.error('Error loading staff from Firestore:', error);
        // Fallback to localStorage if Firestore fails
        const savedStaff = localStorage.getItem('staff-members');
        if (savedStaff) {
          try {
            const parsedStaff = JSON.parse(savedStaff);
            const migratedStaff = parsedStaff.map((staff: any) => ({
              ...staff,
              permissions: staff.permissions || {},
            }));
            setStaffMembers(migratedStaff);
          } catch (e) {
            console.error('Failed to load staff from localStorage');
          }
        }
      }
    };

    loadStaffFromFirestore();
    
    // Load conversations
    const savedConvos = localStorage.getItem('staff-chat-conversations');
    if (savedConvos) {
      try {
        setConversations(JSON.parse(savedConvos));
      } catch (e) {
        initializeConversations();
      }
    } else {
      initializeConversations();
    }
  }, []);

  // Save staff to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('staff-members', JSON.stringify(staffMembers));
  }, [staffMembers]);

  // Save conversations to localStorage
  useEffect(() => {
    localStorage.setItem('staff-chat-conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedChat]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate available permissions based on business category
  useEffect(() => {
    const features = getFeaturesByBusinessCategory(businessCategory);
    const permissions = features.map(feature => ({
      key: feature.id,
      label: `${feature.icon} ${feature.name}`,
      icon: feature.icon,
    }));
    setAvailablePermissions(permissions);
    
    // Initialize permissions object with all available permissions set to false
    const initialPermissions: Record<string, boolean> = {};
    permissions.forEach(perm => {
      initialPermissions[perm.key] = false;
    });
    // Always enable sales by default
    initialPermissions['sales-recording'] = true;
    setNewStaffPermissions(initialPermissions);
  }, [businessCategory]);

  const initializeConversations = () => {
    const initialConvos: { [key: string]: { id: string; messages: ChatMessage[] } } = {
      'team': {
        id: 'team',
        messages: [
          { id: '1', senderId: 'system', senderName: 'System', senderType: 'staff', text: 'Welcome to the Team Chat! 👋', timestamp: Date.now() - 86400000 },
        ],
      },
    };
    setConversations(initialConvos);
  };

  const handleStartChat = (staffId: string) => {
    // Initialize conversation for this staff if it doesn't exist
    if (!conversations[staffId]) {
      setConversations(prev => ({
        ...prev,
        [staffId]: {
          id: staffId,
          messages: [],
        },
      }));
    }
    setSelectedChat(staffId);
    setActiveTab('chat');
  };

  const handleAddStaff = async () => {
    if (!newStaffName.trim() || !newStaffRole.trim() || !newStaffEmail.trim()) {
      showToast('Please fill in required fields');
      return;
    }

    setIsAddingStaff(true);

    const staffId = generateStaffId();
    const password = generateStaffPassword();
    const avatarBg = ['#D1FAE5', '#EDE8FC', '#EFF6FF', '#FEF3C7', '#FEE2E2', '#CCFBF1'][
      Math.floor(Math.random() * 6)
    ];
    const avatarColor = ['#14A05A', '#7C3AED', '#2563EB', '#D97706', '#DC2626', '#0D9488'][
      Math.floor(Math.random() * 6)
    ];

    try {
      const { auth, firestore } = initializeFirebase();
      const currentUserId = auth.currentUser?.uid || '';

      // Get current owner's business ID
      const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
      const businessId = ownerDoc.data()?.businessId || 'default';

      let firebaseUser: any;
      let isNewUser = true;

      try {
        // Call API route to create staff user using admin SDK
        // This prevents the owner from being signed out
        const response = await fetch('/api/staff/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: newStaffEmail.trim(),
            password: password,
            name: newStaffName.trim(),
            role: newStaffRole.trim(),
            staffId: staffId,
            businessId: businessId,
            permissions: newStaffPermissions,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create staff user');
        }

        firebaseUser = { uid: data.uid };
        isNewUser = data.isNewUser;
      } catch (authError: any) {
        console.error('Error creating staff:', authError);
        const errorMessage = authError.message || 'Failed to create staff member. Please try again.';
        showToast(errorMessage);
        setIsAddingStaff(false);
        return;
      }

      const newStaff: StaffMember = {
        id: firebaseUser.uid,
        staffId,
        name: newStaffName.trim(),
        role: newStaffRole.trim(),
        email: newStaffEmail.trim(),
        password: password,
        avatarBg,
        avatarColor,
        initials: getInitials(newStaffName.trim()),
        revenue: 0,
        transactions: 0,
        online: false,
        permissions: newStaffPermissions,
      };

      setStaffMembers((prev) => [...prev, newStaff]);
      setNewStaffName('');
      setNewStaffRole('');
      setNewStaffEmail('');
      // Reset permissions to default state
      const initialPermissions: Record<string, boolean> = {};
      availablePermissions.forEach(perm => {
        initialPermissions[perm.key] = false;
      });
      initialPermissions['sales-recording'] = true;
      setNewStaffPermissions(initialPermissions);
      setShowAddModal(false);
      setNewStaffCredentials({ staffId, password, name: newStaff.name, email: newStaffEmail.trim() });
      setShowCredentialsModal(true);
      showToast('Staff member added successfully!');
      setIsAddingStaff(false);
      
      // Send staff invitation email using Brevo
      try {
        const { auth, firestore } = initializeFirebase();
        const ownerDoc = await getDoc(doc(firestore, 'users', auth.currentUser?.uid || ''));
        const businessName = ownerDoc.data()?.businessName || 'Your Business';
        
        await BrevoService.sendStaffInvitationEmail(
          newStaffEmail.trim(),
          newStaff.name,
          businessName,
          password
        );
        console.log('Staff invitation email sent successfully');
      } catch (emailError) {
        console.error('Failed to send staff invitation email:', emailError);
        // Don't fail the whole process if email fails
      }
      
      // Create conversation for new staff
      setConversations((prev) => ({
        ...prev,
        [newStaff.id]: {
          id: newStaff.id,
          messages: [
            {
              id: `welcome-${newStaff.id}`,
              senderId: 'owner',
              senderName: 'Owner',
              senderType: 'owner',
              text: `Welcome to the team, ${newStaff.name}! 🎉`,
              timestamp: Date.now(),
            },
          ],
        },
      }));
    } catch (error: any) {
      console.error('Error creating staff member:', error);
      showToast('Failed to create staff member. Please try again.');
      setIsAddingStaff(false);
    }
  };

  const handleRemoveStaff = (staff: StaffMember) => {
    setStaffToRemove(staff);
    setShowRemoveConfirmationModal(true);
  };

  const confirmRemoveStaff = async () => {
    if (!staffToRemove) return;

    setIsRemovingStaff(true);

    try {
      const { auth, firestore } = initializeFirebase();
      const currentUserId = auth.currentUser?.uid || '';
      const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
      const businessId = ownerDoc.data()?.businessId || 'default';

      // Remove from businesses/staff collection
      await setDoc(doc(firestore, 'businesses', businessId, 'staff', staffToRemove.id), {
        status: 'removed',
        removedAt: new Date(),
      }, { merge: true });

      // Update user role in users collection
      await setDoc(doc(firestore, 'users', staffToRemove.id), {
        role: 'Removed',
        businessId: null,
      }, { merge: true });

      setStaffMembers((prev) => prev.filter((s) => s.id !== staffToRemove.id));
      setConversations((prev) => {
        const newConvos = { ...prev };
        delete newConvos[staffToRemove.id];
        return newConvos;
      });
      showToast(`${staffToRemove.name} has been removed`);
      setShowRemoveConfirmationModal(false);
      setStaffToRemove(null);
      setIsRemovingStaff(false);
    } catch (error) {
      console.error('Error removing staff:', error);
      showToast('Failed to remove staff member');
      setIsRemovingStaff(false);
    }
  };

  const handleBanStaff = async (staffId: string, staffName: string) => {
    if (confirm(`Are you sure you want to ban ${staffName}? They will not be able to access the dashboard.`)) {
      setIsBanningStaff(true);
      try {
        const { auth, firestore } = initializeFirebase();
        const currentUserId = auth.currentUser?.uid || '';
        const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
        const businessId = ownerDoc.data()?.businessId || 'default';

        // Update status in businesses/staff collection
        await setDoc(doc(firestore, 'businesses', businessId, 'staff', staffId), {
          status: 'banned',
          bannedAt: new Date(),
        }, { merge: true });

        // Update user in users collection
        await setDoc(doc(firestore, 'users', staffId), {
          status: 'banned',
        }, { merge: true });

        // Update local state
        setStaffMembers((prev) =>
          prev.map((s) =>
            s.id === staffId ? { ...s, status: 'banned' } : s
          )
        );
        showToast(`${staffName} has been banned`);
        setIsBanningStaff(false);
      } catch (error) {
        console.error('Error banning staff:', error);
        showToast('Failed to ban staff member');
        setIsBanningStaff(false);
      }
    }
  };

  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setNewStaffPermissions({ 
      ...staff.permissions, 
    });
    setShowEditModal(true);
  };

  const handleViewCredentials = (staff: StaffMember) => {
    setViewingStaff(staff);
    setShowViewCredentialsModal(true);
  };

  const handleSetTargets = (staff: StaffMember) => {
    setTargetStaff(staff);
    setTargetRevenue(staff.targets?.revenue || 0);
    setTargetTransactions(staff.targets?.transactions || 0);
    setTargetPeriod(staff.targets?.period || 'monthly');
    setShowTargetModal(true);
  };

  const handleViewActivities = (staff: StaffMember) => {
    setSelectedPerformanceStaff(staff);
    setActiveTab('performance');
  };

  const handleSaveTargets = async () => {
    if (!targetStaff) return;

    setIsSavingTargets(true);

    try {
      const { auth, firestore } = initializeFirebase();
      const currentUserId = auth.currentUser?.uid || '';
      const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
      const businessId = ownerDoc.data()?.businessId || 'default';

      // Update targets in Firestore
      await setDoc(doc(firestore, 'businesses', businessId, 'staff', targetStaff.id), {
        targets: {
          revenue: targetRevenue,
          transactions: targetTransactions,
          period: targetPeriod,
        },
      }, { merge: true });

      // Update local state
      setStaffMembers((prev) =>
        prev.map((s) =>
          s.id === targetStaff.id ? { ...s, targets: { revenue: targetRevenue, transactions: targetTransactions, period: targetPeriod } } : s
        )
      );

      setShowTargetModal(false);
      setTargetStaff(null);
      showToast('Targets updated successfully');
      setIsSavingTargets(false);
    } catch (error) {
      console.error('Error updating targets:', error);
      showToast('Failed to update targets');
      setIsSavingTargets(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!editingStaff) return;

    setIsSavingPermissions(true);

    try {
      const { auth, firestore } = initializeFirebase();
      const currentUserId = auth.currentUser?.uid || '';
      const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
      const businessId = ownerDoc.data()?.businessId || 'default';

      // Update permissions in Firestore
      await setDoc(doc(firestore, 'businesses', businessId, 'staff', editingStaff.id), {
        permissions: newStaffPermissions,
      }, { merge: true });

      // Update permissions in users collection
      await setDoc(doc(firestore, 'users', editingStaff.id), {
        permissions: newStaffPermissions,
      }, { merge: true });

      // Update local state
      setStaffMembers((prev) =>
        prev.map((s) =>
          s.id === editingStaff.id ? { ...s, permissions: newStaffPermissions } : s
        )
      );

      setShowEditModal(false);
      setEditingStaff(null);
      showToast('Permissions updated successfully');
      setIsSavingPermissions(false);
    } catch (error) {
      console.error('Error updating permissions:', error);
      showToast('Failed to update permissions');
      setIsSavingPermissions(false);
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'owner',
      senderName: 'Owner',
      senderType: 'owner',
      text: messageInput.trim(),
      timestamp: Date.now(),
    };

    setConversations((prev) => ({
      ...prev,
      [selectedChat]: {
        ...prev[selectedChat],
        messages: [...prev[selectedChat].messages, newMessage],
      },
    }));

    setMessageInput('');

    // Dispatch event for staff to receive
    window.dispatchEvent(new CustomEvent('owner-chat-message', {
      detail: {
        conversationId: selectedChat,
        message: newMessage,
      },
    }));
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const copyCredentials = () => {
    if (!newStaffCredentials) return;
    const credentials = `Staff Login Credentials\n\nName: ${newStaffCredentials.name}\nEmail: ${newStaffCredentials.email}\nStaff ID: ${newStaffCredentials.staffId}\nPassword: ${newStaffCredentials.password}`;
    navigator.clipboard.writeText(credentials);
    showToast('Credentials copied to clipboard');
  };

  const downloadCredentialsAsImage = async () => {
    if (!newStaffCredentials || !credentialsRef.current) return;
    
    try {
      // Use html2canvas to capture the credentials card as an image
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(credentialsRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${newStaffCredentials.name.replace(/\s+/g, '_')}_credentials.png`;
          link.click();
          URL.revokeObjectURL(url);
          showToast('Credentials image downloaded');
        }
      });
    } catch (error) {
      console.error('Error generating credentials image:', error);
      showToast('Failed to generate credentials image');
    }
  };

  const getSelectedConversation = () => {
    return conversations[selectedChat];
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>{t('staff.title')}</h2>
          <p className={styles.pageDesc}>{t('staff.subtitle')}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>+ {t('staff.addMember')}</Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'staff' ? styles.active : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          {t('nav.staff')}
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'attendance' ? styles.active : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Attendance
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'payroll' ? styles.active : ''}`}
          onClick={() => setActiveTab('payroll')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          Payroll
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.active : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          {t('nav.chat')}
        </button>
      </div>

      {/* Staff cards */}
      {activeTab === 'staff' && (
        staffMembers.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '80px 20px',
          }}>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ marginBottom: '24px' }}>
              <circle cx="60" cy="60" r="58" fill="var(--surface)"></circle>
              <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(42,191,191,.12)" strokeWidth="1.5" strokeDasharray="6,4"></circle>
              <rect x="24" y="68" width="24" height="4" rx="2" fill="rgba(255,255,255,.08)"></rect>
              <rect x="28" y="72" width="4" height="12" rx="2" fill="rgba(255,255,255,.07)"></rect>
              <rect x="40" y="72" width="4" height="12" rx="2" fill="rgba(255,255,255,.07)"></rect>
              <rect x="24" y="58" width="24" height="10" rx="4" fill="none" stroke="rgba(42,191,191,.15)" strokeWidth="1.5" strokeDasharray="3,3"></rect>
              <rect x="72" y="68" width="24" height="4" rx="2" fill="rgba(255,255,255,.08)"></rect>
              <rect x="76" y="72" width="4" height="12" rx="2" fill="rgba(255,255,255,.07)"></rect>
              <rect x="88" y="72" width="4" height="12" rx="2" fill="rgba(255,255,255,.07)"></rect>
              <rect x="72" y="58" width="24" height="10" rx="4" fill="none" stroke="rgba(42,191,191,.15)" strokeWidth="1.5" strokeDasharray="3,3"></rect>
              <circle cx="36" cy="52" r="8" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.06)" strokeWidth="1.5" strokeDasharray="2,2"></circle>
              <circle cx="84" cy="52" r="8" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.06)" strokeWidth="1.5" strokeDasharray="2,2"></circle>
              <circle cx="60" cy="44" r="13" fill="#F5C9A0"></circle>
              <path d="M47 40 C47 31 73 31 73 40 L73 36 C73 28 47 28 47 36 Z" fill="#2C1A0E"></path>
              <circle cx="54" cy="43" r="2.8" fill="#1A2B3C"></circle>
              <circle cx="66" cy="43" r="2.8" fill="#1A2B3C"></circle>
              <circle cx="55" cy="41.8" r="1" fill="white"></circle>
              <circle cx="67" cy="41.8" r="1" fill="white"></circle>
              <path d="M54 49 Q60 53 66 49" stroke="#CC7A3A" strokeWidth="1.8" strokeLinecap="round" fill="none"></path>
              <circle cx="74" cy="32" r="10" fill="#162334" stroke="#2ABFBF" strokeWidth="1.5"></circle>
              <line x1="74" y1="27" x2="74" y2="37" stroke="#2ABFBF" strokeWidth="2.5" strokeLinecap="round"></line>
              <line x1="69" y1="32" x2="79" y2="32" stroke="#2ABFBF" strokeWidth="2.5" strokeLinecap="round"></line>
              <rect x="50" y="57" width="20" height="13" rx="5" fill="#F5C9A0"></rect>
              <ellipse cx="60" cy="74" rx="15" ry="6" fill="#1A8F8F" opacity=".8"></ellipse>
            </svg>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '8px' }}>
              No staff members yet
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '24px', maxWidth: '300px' }}>
              Add your first team member to start managing staff and tracking performance.
            </p>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>+ Add Your First Staff</Button>
          </div>
        ) : (
          <div className={styles.staffGrid}>
            {staffMembers.map((member) => (
              <div key={member.id} className={styles.staffCard}>
                <div
                  className={styles.staffAvatar}
                  style={{ background: member.avatarBg, color: member.avatarColor }}
                >
                  {member.initials}
                </div>
                <div className={styles.staffName}>{member.name}</div>
                <div className={styles.staffRole}>
                  <Pill color="purple">{member.role}</Pill>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginBottom: '10px' }}>
                  ID: {member.staffId}
                </div>
                <div className={styles.staffStats}>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>₦{member.revenue.toLocaleString()}</div>
                    <div className={styles.statLabel}>Revenue</div>
                  </div>
                  <div className={styles.statDivider} />
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>{member.transactions}</div>
                    <div className={styles.statLabel}>Transactions</div>
                  </div>
                </div>
                <div className={styles.staffActions}>
                  <div className={styles.menuContainer} ref={menuRef}>
                    <button
                      className={styles.menuButton}
                      onClick={() => setActiveMenu(activeMenu === member.id ? null : member.id)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={18} height={18}>
                        <circle cx="12" cy="12" r="1"/>
                        <circle cx="12" cy="5" r="1"/>
                        <circle cx="12" cy="19" r="1"/>
                      </svg>
                    </button>
                    {activeMenu === member.id && (
                      <div className={styles.menuDropdown}>
                        <button className={styles.menuItem} onClick={() => { handleEditStaff(member); setActiveMenu(null); }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Edit Permissions
                        </button>
                        <button className={styles.menuItem} onClick={() => { handleViewCredentials(member); setActiveMenu(null); }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                          View Credentials
                        </button>
                        <button className={styles.menuItem} onClick={() => { handleSetTargets(member); setActiveMenu(null); }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                          Set Targets
                        </button>
                        <button className={styles.menuItem} onClick={() => { handleViewActivities(member); setActiveMenu(null); }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                          View Activities
                        </button>
                        <button className={styles.menuItem} onClick={() => { handleStartChat(member.id); setActiveMenu(null); }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                          Send Message
                        </button>
                        <div className={styles.menuDivider} />
                        <button className={styles.menuItem} onClick={() => { handleBanStaff(member.id, member.name); setActiveMenu(null); }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                          Ban Staff
                        </button>
                        <button className={`${styles.menuItem} ${styles.dangerItem}`} onClick={() => { handleRemoveStaff(member); setActiveMenu(null); }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          Remove Staff
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add new card */}
            <button
              className={styles.addCard}
              onClick={() => setShowAddModal(true)}
            >
              <div className={styles.addIcon}>+</div>
              <div className={styles.addLabel}>Add Team Member</div>
            </button>
          </div>
        )
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <ChatPanel
          staffMembers={staffMembers}
          conversations={conversations}
          setConversations={setConversations}
          initialSelectedChat={selectedChat}
        />
      )}

      {/* Attendance Tab - Restaurant Only */}
      {activeTab === 'attendance' && isRestaurant && (
        <Card>
          <CardHeader>
            <CardIcon bg="var(--blue-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </CardIcon>
            Staff Attendance
          </CardHeader>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Button variant="primary" size="sm">Clock In All</Button>
              <Button variant="subtle" size="sm">Clock Out All</Button>
              <Button variant="subtle" size="sm">View Attendance Report</Button>
            </div>
            
            <div style={{ 
              border: '1px solid var(--border)', 
              borderRadius: '8px', 
              overflow: 'hidden' 
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg)' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>Staff</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>Clock In</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>Clock Out</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>Hours</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffMembers.map(member => (
                    <tr key={member.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            background: member.avatarBg, 
                            color: member.avatarColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {member.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{member.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{member.role}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: 500,
                          background: 'var(--green-bg)',
                          color: 'var(--green)'
                        }}>
                          Present
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem' }}>9:00 AM</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem' }}>-</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem' }}>0h</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <Button variant="subtle" size="sm">Clock Out</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Payroll Tab - Restaurant Only */}
      {activeTab === 'payroll' && isRestaurant && (
        <Card>
          <CardHeader>
            <CardIcon bg="var(--green-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2}>
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
              </svg>
            </CardIcon>
            Payroll Management
          </CardHeader>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Button variant="primary" size="sm">Generate Weekly Payroll</Button>
              <Button variant="subtle" size="sm">Generate Monthly Payroll</Button>
              <Button variant="subtle" size="sm">Payroll History</Button>
            </div>

            <div style={{ 
              border: '1px solid var(--border)', 
              borderRadius: '8px', 
              overflow: 'hidden' 
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg)' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>Staff</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>Base Salary</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>Overtime Hours</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>Overtime Pay</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>Total Pay</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staffMembers.map(member => (
                    <tr key={member.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            background: member.avatarBg, 
                            color: member.avatarColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {member.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{member.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{member.role}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem' }}>
                        ₦{member.salary?.toLocaleString() || '0'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem' }}>0h</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem' }}>₦0</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                        ₦{member.salary?.toLocaleString() || '0'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: 500,
                          background: 'var(--amber-bg)',
                          color: 'var(--amber)'
                        }}>
                          Pending
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && selectedPerformanceStaff && (
        <Card>
          <CardHeader>
            <CardIcon bg="var(--green-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2}>
                <path d="M12 20V10"/>
                <path d="M18 20V4"/>
                <path d="M6 20v-4"/>
              </svg>
            </CardIcon>
            {selectedPerformanceStaff.name} Performance
          </CardHeader>
          <div style={{ padding: '20px' }}>
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: 'var(--bg)',
              borderRadius: '8px',
              border: '1.5px solid var(--border)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Current Performance</span>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-1)' }}>₦{selectedPerformanceStaff.revenue.toLocaleString()}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Revenue</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-1)' }}>{selectedPerformanceStaff.transactions}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Transactions</div>
                </div>
              </div>
              {selectedPerformanceStaff.targets && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: '8px' }}>
                    Targets ({selectedPerformanceStaff.targets.period})
                  </div>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-1)' }}>₦{selectedPerformanceStaff.targets.revenue.toLocaleString()}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Revenue Target</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-1)' }}>{selectedPerformanceStaff.targets.transactions}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Transaction Target</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{
              padding: '16px',
              background: 'var(--bg)',
              borderRadius: '8px',
              border: '1.5px solid var(--border)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Recent Activities</span>
              </div>
              {selectedPerformanceStaff.activities && selectedPerformanceStaff.activities.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedPerformanceStaff.activities.slice(0, 10).map((activity) => (
                    <div key={activity.id} style={{
                      padding: '12px',
                      background: 'var(--surface)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-1)' }}>{activity.action}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{activity.description}</div>
                      {activity.metadata && (
                        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-3)' }}>
                          {activity.metadata.amount && <span>Amount: ₦{activity.metadata.amount.toLocaleString()} </span>}
                          {activity.metadata.items && <span>Items: {activity.metadata.items.join(', ')}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
                  <div style={{ fontSize: '0.85rem' }}>No activities recorded yet</div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflow: 'auto',
            animation: 'modalIn 0.2s ease',
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-1)',
                  margin: 0,
                }}>Add Staff Member</h3>
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-3)',
                  margin: '4px 0 0 0',
                }}>Fill in the details to add a new team member</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--bg)',
                  color: 'var(--text-2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  transition: 'all 0.2s',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: 'var(--text-2)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}>
                  Full Name <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Enter full name"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--rsm)',
                    border: '1.5px solid var(--border)',
                    fontSize: '0.9rem',
                    color: 'var(--text-1)',
                    background: 'var(--surface)',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--purple)';
                    e.target.style.boxShadow = '0 0 0 3px var(--purple-lt)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: 'var(--text-2)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}>
                  Role <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  placeholder="e.g., Cashier, Sales Attendant, Store Manager"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--rsm)',
                    border: '1.5px solid var(--border)',
                    fontSize: '0.9rem',
                    color: 'var(--text-1)',
                    background: 'var(--surface)',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--purple)';
                    e.target.style.boxShadow = '0 0 0 3px var(--purple-lt)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: 'var(--text-2)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}>
                  Email Address <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <input
                  type="email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="Enter email address"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--rsm)',
                    border: '1.5px solid var(--border)',
                    fontSize: '0.9rem',
                    color: 'var(--text-1)',
                    background: 'var(--surface)',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--purple)';
                    e.target.style.boxShadow = '0 0 0 3px var(--purple-lt)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: 'var(--text-2)',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}>
                  Permissions
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                }}>
                  {availablePermissions.map((perm) => (
                    <label key={perm.key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      background: 'var(--bg)',
                      borderRadius: 'var(--rsm)',
                      border: '1.5px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }} onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--purple)';
                    }} onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}>
                      <input
                        type="checkbox"
                        checked={newStaffPermissions[perm.key as keyof typeof newStaffPermissions]}
                        onChange={(e) => setNewStaffPermissions({
                          ...newStaffPermissions,
                          [perm.key]: e.target.checked,
                        })}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                        }}
                      />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-1)' }}>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{
                padding: '16px',
                background: 'var(--purple-lt)',
                borderRadius: 'var(--rsm)',
                border: '1px solid var(--border)',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>ℹ️</span>
                  <div>
                    <div style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-2)',
                      marginBottom: '4px',
                    }}>
                      Firebase Auth Account Created
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-3)',
                      lineHeight: 1.5,
                    }}>
                      A Firebase Auth account has been created with the provided email. Share the credentials below with the staff member.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg)',
              display: 'flex',
              gap: '10px',
              borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
            }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-2)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg)';
                  e.currentTarget.style.borderColor = 'var(--text-3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--surface)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddStaff}
                disabled={isAddingStaff}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isAddingStaff ? 'var(--purple-dark)' : 'var(--purple)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: isAddingStaff ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
                  opacity: isAddingStaff ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isAddingStaff) {
                    e.currentTarget.style.background = 'var(--purple-dark)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAddingStaff) {
                    e.currentTarget.style.background = 'var(--purple)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(124, 58, 237, 0.25)';
                  }
                }}
              >
                {isAddingStaff ? 'Adding...' : 'Add Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {showEditModal && editingStaff && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={() => setShowEditModal(false)}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflow: 'auto',
            animation: 'modalIn 0.2s ease',
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-1)',
                  margin: 0,
                }}>Edit Permissions</h3>
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-3)',
                  margin: '4px 0 0 0',
                }}>Manage access for {editingStaff.name}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--bg)',
                  color: 'var(--text-2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  transition: 'all 0.2s',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: 'var(--text-2)',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}>
                  Permissions
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                }}>
                  {availablePermissions.map((perm) => (
                    <label key={perm.key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      background: 'var(--bg)',
                      borderRadius: 'var(--rsm)',
                      border: '1.5px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }} onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--purple)';
                    }} onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}>
                      <input
                        type="checkbox"
                        checked={newStaffPermissions[perm.key as keyof typeof newStaffPermissions]}
                        onChange={(e) => setNewStaffPermissions({
                          ...newStaffPermissions,
                          [perm.key]: e.target.checked,
                        })}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                        }}
                      />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-1)' }}>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg)',
              display: 'flex',
              gap: '10px',
              borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
            }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-2)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg)';
                  e.currentTarget.style.borderColor = 'var(--text-3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--surface)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={isSavingPermissions}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSavingPermissions ? 'var(--purple-dark)' : 'var(--purple)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: isSavingPermissions ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
                  opacity: isSavingPermissions ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSavingPermissions) {
                    e.currentTarget.style.background = 'var(--purple-dark)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSavingPermissions) {
                    e.currentTarget.style.background = 'var(--purple)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(124, 58, 237, 0.25)';
                  }
                }}
              >
                {isSavingPermissions ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && newStaffCredentials && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={() => setShowCredentialsModal(false)}>
          <div 
            ref={credentialsRef}
            style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '420px',
            animation: 'modalIn 0.2s ease',
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '24px 24px 16px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--green)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                margin: '0 auto 12px',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
              }}>✅</div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-1)',
                margin: '0 0 4px 0',
              }}>Staff Added Successfully!</h3>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-3)',
                margin: 0,
              }}>Share these credentials with <strong style={{ color: 'var(--text-2)' }}>{newStaffCredentials.name}</strong></p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '16px 24px 20px' }}>
              <div style={{
                marginBottom: '14px',
                padding: '16px',
                background: 'var(--bg)',
                borderRadius: 'var(--rsm)',
                border: '1.5px solid var(--border)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Email</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Login email</span>
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-1)',
                  letterSpacing: '0.02em',
                }}>
                  {newStaffCredentials.email}
                </div>
              </div>

              <div style={{
                marginBottom: '14px',
                padding: '16px',
                background: 'var(--bg)',
                borderRadius: 'var(--rsm)',
                border: '1.5px solid var(--border)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Staff ID</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Auto-generated</span>
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--purple)',
                  letterSpacing: '0.05em',
                }}>
                  {newStaffCredentials.staffId}
                </div>
              </div>

              <div style={{
                marginBottom: '20px',
                padding: '16px',
                background: 'var(--bg)',
                borderRadius: 'var(--rsm)',
                border: '1.5px solid var(--border)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Temporary Password</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>One-time use</span>
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--text-1)',
                  letterSpacing: '0.05em',
                }}>
                  {newStaffCredentials.password}
                </div>
              </div>

              <div style={{
                padding: '14px',
                background: 'var(--amber-bg)',
                borderRadius: 'var(--rsm)',
                border: '1px solid var(--amber)',
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--amber)',
                      marginBottom: '3px',
                    }}>
                      Important Security Note
                    </div>
                    <div style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-3)',
                      lineHeight: 1.5,
                    }}>
                      The staff member should change their password after first login. The Staff ID is permanent and cannot be changed.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg)',
              borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
            }}>
              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '10px',
              }}>
                <button
                  onClick={copyCredentials}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-2)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  Copy
                </button>
                <button
                  onClick={downloadCredentialsAsImage}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-2)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download Image
                </button>
              </div>
              <button
                onClick={() => { setShowCredentialsModal(false); setNewStaffCredentials(null); }}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--purple)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--purple-dark)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--purple)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(124, 58, 237, 0.25)';
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Credentials Modal */}
      {showViewCredentialsModal && viewingStaff && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={() => setShowViewCredentialsModal(false)}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '420px',
            animation: 'modalIn 0.2s ease',
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '24px 24px 16px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--purple)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                margin: '0 auto 12px',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
              }}>🔑</div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-1)',
                margin: '0 0 4px 0',
              }}>{viewingStaff.name} Credentials</h3>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-3)',
                margin: 0,
              }}>Login credentials for <strong style={{ color: 'var(--text-2)' }}>{viewingStaff.name}</strong></p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '16px 24px 20px' }}>
              <div style={{
                marginBottom: '14px',
                padding: '16px',
                background: 'var(--bg)',
                borderRadius: 'var(--rsm)',
                border: '1.5px solid var(--border)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Email</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Login email</span>
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-1)',
                  letterSpacing: '0.02em',
                }}>
                  {viewingStaff.email}
                </div>
              </div>

              <div style={{
                marginBottom: '14px',
                padding: '16px',
                background: 'var(--bg)',
                borderRadius: 'var(--rsm)',
                border: '1.5px solid var(--border)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Staff ID</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Auto-generated</span>
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--purple)',
                  letterSpacing: '0.05em',
                }}>
                  {viewingStaff.staffId}
                </div>
              </div>

              <div style={{
                marginBottom: '20px',
                padding: '16px',
                background: 'var(--bg)',
                borderRadius: 'var(--rsm)',
                border: '1.5px solid var(--border)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Password</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Staff password</span>
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--text-1)',
                  letterSpacing: '0.05em',
                }}>
                  {viewingStaff.password || 'Not set'}
                </div>
              </div>

              <div style={{
                padding: '14px',
                background: 'var(--amber-bg)',
                borderRadius: 'var(--rsm)',
                border: '1px solid var(--amber)',
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--amber)',
                      marginBottom: '3px',
                    }}>
                      Important Security Note
                    </div>
                    <div style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-3)',
                      lineHeight: 1.5,
                    }}>
                      The staff member should change their password after first login. The Staff ID is permanent and cannot be changed.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg)',
              borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
            }}>
              <button
                onClick={() => { setShowViewCredentialsModal(false); setViewingStaff(null); }}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--purple)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--purple-dark)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--purple)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(124, 58, 237, 0.25)';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target Setting Modal */}
      {showTargetModal && targetStaff && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={() => setShowTargetModal(false)}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '420px',
            animation: 'modalIn 0.2s ease',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '24px 24px 16px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--blue)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                margin: '0 auto 12px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}>🎯</div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-1)',
                margin: '0 0 4px 0',
              }}>Set Targets for {targetStaff.name}</h3>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-3)',
                margin: 0,
              }}>Define performance targets for <strong style={{ color: 'var(--text-2)' }}>{targetStaff.name}</strong></p>
            </div>

            <div style={{ padding: '16px 24px 20px' }}>
              <div style={{
                marginBottom: '14px',
                padding: '16px',
                background: 'var(--bg)',
                borderRadius: 'var(--rsm)',
                border: '1.5px solid var(--border)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Target Period</span>
                </div>
                <select
                  value={targetPeriod}
                  onChange={(e) => setTargetPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--rsm)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-1)',
                    fontSize: '0.9rem',
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div style={{
                marginBottom: '14px',
                padding: '16px',
                background: 'var(--bg)',
                borderRadius: 'var(--rsm)',
                border: '1.5px solid var(--border)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Revenue Target (₦)</span>
                </div>
                <input
                  type="number"
                  value={targetRevenue}
                  onChange={(e) => setTargetRevenue(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--rsm)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-1)',
                    fontSize: '0.9rem',
                  }}
                  placeholder="0"
                />
              </div>

              <div style={{
                marginBottom: '14px',
                padding: '16px',
                background: 'var(--bg)',
                borderRadius: 'var(--rsm)',
                border: '1.5px solid var(--border)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Transaction Target</span>
                </div>
                <input
                  type="number"
                  value={targetTransactions}
                  onChange={(e) => setTargetTransactions(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--rsm)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-1)',
                    fontSize: '0.9rem',
                  }}
                  placeholder="0"
                />
              </div>

              <div style={{
                padding: '14px',
                background: 'var(--blue-bg)',
                borderRadius: 'var(--rsm)',
                border: '1px solid var(--blue)',
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--blue)',
                      marginBottom: '3px',
                    }}>
                      Performance Tracking
                    </div>
                    <div style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-3)',
                      lineHeight: 1.5,
                    }}>
                      Staff performance will be tracked against these targets. Progress will be visible in the activities dashboard.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg)',
              borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
              display: 'flex',
              gap: '10px',
            }}>
              <button
                onClick={() => { setShowTargetModal(false); setTargetStaff(null); }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-2)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTargets}
                disabled={isSavingTargets}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSavingTargets ? 'var(--blue-dark)' : 'var(--blue)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: isSavingTargets ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                  opacity: isSavingTargets ? 0.7 : 1,
                }}
              >
                {isSavingTargets ? 'Saving...' : 'Save Targets'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirmationModal && staffToRemove && (
        <div className={styles.modalOverlay} onClick={() => setShowRemoveConfirmationModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowRemoveConfirmationModal(false)}>✕</button>
            <h2 className={styles.modalTitle}>Remove Staff Member</h2>
            <div className={styles.modalContent}>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', marginBottom: '12px' }}>
                  Are you sure you want to remove <strong>{staffToRemove.name}</strong>? This will permanently delete their account and they will lose access to the dashboard.
                </p>
                <div style={{
                  padding: '12px',
                  background: 'var(--red-bg)',
                  border: '1px solid var(--red)',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: 'var(--red)',
                }}>
                  ⚠️ This action cannot be undone. The staff member will be permanently removed from your business.
                </div>
              </div>
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px',
              }}>
                <button
                  onClick={() => setShowRemoveConfirmationModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-2)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveStaff}
                  disabled={isRemovingStaff}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isRemovingStaff ? 'var(--red-dark)' : 'var(--red)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: isRemovingStaff ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
                    opacity: isRemovingStaff ? 0.7 : 1,
                  }}
                >
                  {isRemovingStaff ? 'Removing...' : 'Remove Staff'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

