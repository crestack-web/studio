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
import { doc, setDoc, getDoc, getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { BrevoService } from '@/services/email/brevo-service';
import { sendStaffRoleUpdatedEmail, sendStaffRemovedEmail } from '@/services/email/team-management-emails';
import { isRestaurantBusiness, getBusinessCategory } from './utils/restaurantHelpers';
import AttendanceTab from './AttendanceTab';
import { StaffPayrollSection } from './StaffPayrollSection';

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
  // Payroll fields
  paymentFrequency?: string;
  nextPaymentDate?: string;
  paymentAccount?: string;
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

  const AVATAR_PALETTE = [
    { bg: '#D1FAE5', color: '#14A05A' },
    { bg: '#EDE8FC', color: '#7C3AED' },
    { bg: '#EFF6FF', color: '#2563EB' },
    { bg: '#FEF3C7', color: '#D97706' },
    { bg: '#FEE2E2', color: '#DC2626' },
    { bg: '#CCFBF1', color: '#0D9488' },
  ];

  const getAvatarColors = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
  };

  const { navigateTo, showToast, user } = useApp();
  const { t } = useTranslation();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
  });
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

        // Load staff from Firestore
        const staffCollection = collection(firestore, 'businesses', businessId, 'staff');
        const staffSnapshot = await getDocs(staffCollection);
        
        const staffList: StaffMember[] = [];
        staffSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const seed = data.staffId || docSnap.id || data.name || '';
          const { bg: avatarBg, color: avatarColor } = getAvatarColors(seed);
          
          staffList.push({
            id: docSnap.id,
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
      } finally {
        setIsLoading(false);
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

  // Use fixed staff dashboard permissions (not feature registry)
  // Staff dashboard only has: sale, inv, hist, atd, msg
  const STAFF_PERMISSIONS = [
    { key: 'sale', label: '🛒 Sales Recording', icon: 'ShoppingCart' },
    { key: 'inv', label: '📦 Inventory View', icon: 'Package' },
    { key: 'hist', label: '📊 History & Reports', icon: 'BarChart3' },
    { key: 'atd', label: '⏰ Attendance', icon: 'Clock' },
    { key: 'msg', label: '💬 Messages', icon: 'MessageSquare' },
  ];
  
  // Initialize available permissions with fixed staff dashboard permissions
  useEffect(() => {
    setAvailablePermissions(STAFF_PERMISSIONS);
    
    // Initialize permissions object with all available permissions set to false
    const initialPermissions: Record<string, boolean> = {};
    STAFF_PERMISSIONS.forEach(perm => {
      initialPermissions[perm.key] = false;
    });
    // Always enable sales by default
    initialPermissions['sale'] = true;
    setNewStaffPermissions(initialPermissions);
  }, []);

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
      showToast(t('toast.fillRequiredFields'));
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
      initialPermissions['sale'] = true;
      setNewStaffPermissions(initialPermissions);
      setShowAddModal(false);
      setNewStaffCredentials({ staffId, password, name: newStaff.name, email: newStaffEmail.trim() });
      setShowCredentialsModal(true);
      showToast(t('toast.staffAddedSuccess'));
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
      showToast(t('toast.staffCreateFailed'));
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
      const businessName = ownerDoc.data()?.businessName || 'Your Business';
      const ownerName = ownerDoc.data()?.fullName || ownerDoc.data()?.displayName || 'Business Owner';
      const ownerEmail = ownerDoc.data()?.email;

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

      // Send staff removal email notification
      if (staffToRemove.email && ownerEmail) {
        try {
          await sendStaffRemovedEmail({
            email: staffToRemove.email,
            staffName: staffToRemove.name,
            businessName,
            role: staffToRemove.role || 'Staff',
            removedDate: new Date().toLocaleDateString(),
            reason: 'Staff member removed by business owner',
          });
          console.log('Staff removal email sent');
        } catch (emailError) {
          console.error('Failed to send staff removal email:', emailError);
        }
      }

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
      showToast(t('toast.staffRemoveFailed'));
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
        showToast(t('toast.staffBanFailed'));
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
      showToast(t('toast.targetsUpdated'));
      setIsSavingTargets(false);
    } catch (error) {
      console.error('Error updating targets:', error);
      showToast(t('toast.targetsUpdateFailed'));
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
      const businessName = ownerDoc.data()?.businessName || 'Your Business';
      const ownerName = ownerDoc.data()?.fullName || ownerDoc.data()?.displayName || 'Business Owner';
      const ownerEmail = ownerDoc.data()?.email;

      // Update permissions in Firestore
      await setDoc(doc(firestore, 'businesses', businessId, 'staff', editingStaff.id), {
        permissions: newStaffPermissions,
      }, { merge: true });

      // Update permissions in users collection
      await setDoc(doc(firestore, 'users', editingStaff.id), {
        permissions: newStaffPermissions,
      }, { merge: true });

      // Send staff role update email notification
      if (editingStaff.email && ownerEmail) {
        try {
          await sendStaffRoleUpdatedEmail({
            email: editingStaff.email,
            staffName: editingStaff.name,
            businessName,
            oldRole: editingStaff.role,
            newRole: editingStaff.role,
            updatedDate: new Date().toLocaleDateString(),
          });
          console.log('Staff role update email sent');
        } catch (emailError) {
          console.error('Failed to send staff role update email:', emailError);
        }
      }

      // Update local state
      setStaffMembers((prev) =>
        prev.map((s) =>
          s.id === editingStaff.id ? { ...s, permissions: newStaffPermissions } : s
        )
      );

      setShowEditModal(false);
      setEditingStaff(null);
      showToast(t('toast.permissionsUpdated'));
      setIsSavingPermissions(false);
    } catch (error) {
      console.error('Error updating permissions:', error);
      showToast(t('toast.permissionsUpdateFailed'));
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
    showToast(t('toast.credentialsCopied'));
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
          showToast(t('toast.credentialsDownloaded'));
        }
      });
    } catch (error) {
      console.error('Error generating credentials image:', error);
      showToast(t('toast.credentialsImageFailed'));
    }
  };

  const getSelectedConversation = () => {
    return conversations[selectedChat];
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredStaff = q
    ? staffMembers.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        (m.role || '').toLowerCase().includes(q) ||
        (m.staffId || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q)
      )
    : staffMembers;

  const teamStats = {
    total: staffMembers.length,
    online: staffMembers.filter((m) => m.online).length,
    revenue: staffMembers.reduce((s, m) => s + (Number(m.revenue) || 0), 0),
    transactions: staffMembers.reduce((s, m) => s + (Number(m.transactions) || 0), 0),
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
      <div className={styles.tabNav} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'staff'}
          className={`${styles.tabBtn} ${activeTab === 'staff' ? styles.active : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          <span>{t('nav.staff')}</span>
          {staffMembers.length > 0 && <span className={styles.tabCount}>{staffMembers.length}</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'attendance'}
          className={`${styles.tabBtn} ${activeTab === 'attendance' ? styles.active : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>Attendance</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'payroll'}
          className={`${styles.tabBtn} ${activeTab === 'payroll' ? styles.active : ''}`}
          onClick={() => setActiveTab('payroll')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          <span>Payroll</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'chat'}
          className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.active : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span>{t('nav.chat')}</span>
        </button>
      </div>

      {/* Staff cards */}
      {activeTab === 'staff' && (
        isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} aria-hidden />
            <p>Loading team…</p>
          </div>
        ) : staffMembers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={40} height={40}>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No staff members yet</h3>
            <p className={styles.emptyDesc}>
              Add your first team member to track sales, attendance, and performance — even when you are not in the shop.
            </p>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>+ Add Your First Staff</Button>
          </div>
        ) : (
          <>
            <div className={styles.summaryBar}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>{teamStats.total}</span>
                <span className={styles.summaryLabel}>Team</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>
                  <span className={styles.onlineDot} />
                  {teamStats.online}
                </span>
                <span className={styles.summaryLabel}>Online</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>₦{teamStats.revenue.toLocaleString()}</span>
                <span className={styles.summaryLabel}>Revenue</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>{teamStats.transactions}</span>
                <span className={styles.summaryLabel}>Sales</span>
              </div>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.searchWrap}>
                <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16} aria-hidden>
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="search"
                  className={styles.searchInput}
                  placeholder="Search by name, role, or ID…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search staff"
                />
                {searchQuery && (
                  <button type="button" className={styles.searchClear} onClick={() => setSearchQuery('')} aria-label="Clear search">
                    ×
                  </button>
                )}
              </div>
              <span className={styles.resultCount}>
                {filteredStaff.length === staffMembers.length
                  ? `${staffMembers.length} member${staffMembers.length === 1 ? '' : 's'}`
                  : `${filteredStaff.length} of ${staffMembers.length}`}
              </span>
            </div>

            {filteredStaff.length === 0 ? (
              <div className={styles.emptyStateCompact}>
                <p>No staff match “{searchQuery}”.</p>
                <button type="button" className={styles.linkBtn} onClick={() => setSearchQuery('')}>Clear search</button>
              </div>
            ) : (
          <div className={styles.staffGrid}>
            {filteredStaff.map((member) => (
              <div key={member.id} className={styles.staffCard}>
                <div className={styles.avatarWrap}>
                  <div
                    className={styles.staffAvatar}
                    style={{ background: member.avatarBg, color: member.avatarColor }}
                  >
                    {member.initials}
                  </div>
                  <span
                    className={`${styles.statusDot} ${member.online ? styles.statusOnline : styles.statusOffline}`}
                    title={member.online ? 'Online' : 'Offline'}
                  />
                </div>
                <div className={styles.staffName}>{member.name}</div>
                <div className={styles.staffRole}>
                  <Pill color="purple">{member.role || 'Staff'}</Pill>
                </div>
                <div className={styles.staffId}>
                  ID: {member.staffId || '—'}
                </div>
                <div className={styles.staffStats}>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>₦{(Number(member.revenue) || 0).toLocaleString()}</div>
                    <div className={styles.statLabel}>Revenue</div>
                  </div>
                  <div className={styles.statDivider} />
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>{Number(member.transactions) || 0}</div>
                    <div className={styles.statLabel}>Sales</div>
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
              type="button"
              className={styles.addCard}
              onClick={() => setShowAddModal(true)}
            >
              <div className={styles.addIcon}>+</div>
              <div className={styles.addLabel}>Add Team Member</div>
            </button>
          </div>
            )}
          </>
        )
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <AttendanceTab staffMembers={staffMembers} showToast={showToast} />
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


      
      {/* Payroll Tab — wallet funding + bulk pay */}
      {activeTab === 'payroll' && (
        <Card>
          <CardHeader>
            <CardIcon bg="var(--green-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2}>
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
              </svg>
            </CardIcon>
            Payroll & Salary Management
          </CardHeader>
          <StaffPayrollSection
            staffMembers={staffMembers}
            businessId={user?.businessId}
            userId={user?.id}
            showToast={showToast}
            onSalaryConfigured={(staffId, salary, frequency, nextDate) => {
              setStaffMembers((prev) =>
                prev.map((s) =>
                  s.id === staffId
                    ? { ...s, salary, paymentFrequency: frequency, nextPaymentDate: nextDate }
                    : s
                )
              );
            }}
          />
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

