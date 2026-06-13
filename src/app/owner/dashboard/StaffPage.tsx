'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { Pill } from './Badge';
import styles from './StaffPage.module.css';
import { ChatPanel } from './ChatPanel';
import { initializeFirebase } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { BrevoService } from '@/services/email/brevo-service';
import { isRestaurantBusiness } from './utils/restaurantHelpers';

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
  permissions: {
    sale: boolean;
    inv: boolean;
    hist: boolean;
    atd: boolean;
    msg: boolean;
    earn: boolean;
  };
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

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'owner' | 'staff';
  text: string;
  timestamp: number;
}

const generateStaffId = () => {
  return 'STF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

const generateStaffPassword = () => {
  // Generate a strong permanent password
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

export function StaffPage() {
  const { navigateTo, showToast, user } = useApp();
  const { t } = useTranslation();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewCredentialsModal, setShowViewCredentialsModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);
  const [newStaffCredentials, setNewStaffCredentials] = useState<{ staffId: string; password: string; name: string; email: string } | null>(null);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPermissions, setNewStaffPermissions] = useState({
    sale: true,
    inv: false,
    hist: false,
    atd: false,
    msg: false,
    earn: false,
  });
  const [isRestaurant, setIsRestaurant] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  
  // Chat state
  const [activeTab, setActiveTab] = useState<'staff' | 'chat' | 'attendance' | 'payroll'>('staff');
  const [selectedChat, setSelectedChat] = useState<string>('team');
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
            permissions: data.permissions || {
              sale: true,
              inv: false,
              hist: false,
              atd: false,
              msg: false,
              earn: false,
            },
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
              permissions: staff.permissions || {
                sale: true,
                inv: false,
                hist: false,
                atd: false,
                msg: false,
                earn: false,
              },
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
        // Try to create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          newStaffEmail.trim(),
          password
        );
        firebaseUser = userCredential.user;
      } catch (authError: any) {
        isNewUser = false;
        // If auth/email-already-in-use, check if this user is already linked to this business
        if (authError.code === 'auth/email-already-in-use') {
          // Check if user exists in users collection
          const usersQuery = query(
            collection(firestore, 'users'),
            where('email', '==', newStaffEmail.trim())
          );
          const userSnapshot = await getDocs(usersQuery);
          
          if (!userSnapshot.empty) {
            const existingUserDoc = userSnapshot.docs[0];
            const existingUserData = existingUserDoc.data();
            
            // Check if this user is already a staff member for this business
            const existingStaffDoc = await getDoc(doc(firestore, 'businesses', businessId, 'staff', existingUserDoc.id));
            
            if (existingStaffDoc.exists()) {
              showToast('This email is already registered as a staff member for this business.');
              return;
            }
            
            // User exists but not as staff for this business - link them
            firebaseUser = { uid: existingUserDoc.id };
            
            // Update user profile to add staff role and business ID
            await setDoc(doc(firestore, 'users', existingUserDoc.id), {
              role: existingUserData.role === 'Owner' ? 'Owner' : 'Staff',
              staffId: existingUserData.staffId || staffId,
              businessId: existingUserData.businessId || businessId,
              permissions: newStaffPermissions,
              initials: getInitials(newStaffName.trim()),
            }, { merge: true });
          } else {
            // Email exists in Auth but not in users collection - create user profile
            // This is a rare case, but we need to handle it
            showToast('This email is already registered. Please use a different email or contact support.');
            return;
          }
        } else if (authError.code === 'auth/invalid-email') {
          showToast('Invalid email address. Please check and try again.');
          return;
        } else if (authError.code === 'auth/weak-password') {
          showToast('Password is too weak. Please use a stronger password.');
          return;
        } else {
          throw authError;
        }
      }

      // Create user profile in Firestore if we created a new auth user
      if (firebaseUser.uid && isNewUser) {
        await setDoc(doc(firestore, 'users', firebaseUser.uid), {
          displayName: newStaffName.trim(),
          email: newStaffEmail.trim(),
          role: 'Staff',
          staffId: staffId,
          businessId: businessId,
          permissions: newStaffPermissions,
          initials: getInitials(newStaffName.trim()),
          createdAt: new Date(),
        });
      }

      // Create staff member in businesses collection
      await setDoc(doc(firestore, 'businesses', businessId, 'staff', firebaseUser.uid), {
        name: newStaffName.trim(),
        email: newStaffEmail.trim(),
        role: newStaffRole.trim(),
        staffId: staffId,
        permissions: newStaffPermissions,
        status: 'active',
        createdAt: new Date(),
        revenue: 0,
        transactions: 0,
        online: false,
      });

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
      setNewStaffPermissions({
        sale: true,
        inv: false,
        hist: false,
        atd: false,
        msg: false,
        earn: false,
      });
      setShowAddModal(false);
      setNewStaffCredentials({ staffId, password, name: newStaff.name, email: newStaffEmail.trim() });
      setShowCredentialsModal(true);
      showToast('Staff member added successfully!');
      
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
    }
  };

  const handleRemoveStaff = async (staffId: string, staffName: string) => {
    if (confirm(`Are you sure you want to remove ${staffName}? This will permanently delete their account.`)) {
      try {
        const { auth, firestore } = initializeFirebase();
        const currentUserId = auth.currentUser?.uid || '';
        const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
        const businessId = ownerDoc.data()?.businessId || 'default';

        // Remove from businesses/staff collection
        await setDoc(doc(firestore, 'businesses', businessId, 'staff', staffId), {
          status: 'removed',
          removedAt: new Date(),
        }, { merge: true });

        // Update user role in users collection
        await setDoc(doc(firestore, 'users', staffId), {
          role: 'Removed',
          businessId: null,
        }, { merge: true });

        setStaffMembers((prev) => prev.filter((s) => s.id !== staffId));
        setConversations((prev) => {
          const newConvos = { ...prev };
          delete newConvos[staffId];
          return newConvos;
        });
        showToast(`${staffName} has been removed`);
      } catch (error) {
        console.error('Error removing staff:', error);
        showToast('Failed to remove staff member');
      }
    }
  };

  const handleBanStaff = async (staffId: string, staffName: string) => {
    if (confirm(`Are you sure you want to ban ${staffName}? They will not be able to access the dashboard.`)) {
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
      } catch (error) {
        console.error('Error banning staff:', error);
        showToast('Failed to ban staff member');
      }
    }
  };

  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setNewStaffPermissions({ ...staff.permissions });
    setShowEditModal(true);
  };

  const handleViewCredentials = (staff: StaffMember) => {
    setViewingStaff(staff);
    setShowViewCredentialsModal(true);
  };

  const handleSavePermissions = async () => {
    if (!editingStaff) return;

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
    } catch (error) {
      console.error('Error updating permissions:', error);
      showToast('Failed to update permissions');
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
          <Button variant="subtle" onClick={() => navigateTo('home')}>← {t('common.back')}</Button>
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>+ {t('staff.addMember')}</Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'staff' ? styles.active : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          👥 {t('nav.staff')}
        </button>
        {isRestaurant && (
          <>
            <button
              className={`${styles.tabBtn} ${activeTab === 'attendance' ? styles.active : ''}`}
              onClick={() => setActiveTab('attendance')}
            >
              📅 Attendance
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'payroll' ? styles.active : ''}`}
              onClick={() => setActiveTab('payroll')}
            >
              💰 Payroll
            </button>
          </>
        )}
        <button
          className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.active : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 {t('nav.chat')}
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
                  <Button variant="subtle" size="xs" onClick={() => handleEditStaff(member)}>✏️ Edit</Button>
                  <Button variant="subtle" size="xs" onClick={() => handleViewCredentials(member)}>🔑 Credentials</Button>
                  <Button variant="subtle" size="xs" onClick={() => handleStartChat(member.id)}>💬 Message</Button>
                  <Button variant="subtle" size="xs" onClick={() => handleBanStaff(member.id, member.name)}>🚫 Ban</Button>
                  <Button variant="danger" size="xs" onClick={() => handleRemoveStaff(member.id, member.name)}>Remove</Button>
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
                  {[
                    { key: 'sale', label: '💰 Make Sales' },
                    { key: 'inv', label: '📦 Inventory' },
                    { key: 'hist', label: '📊 History' },
                    { key: 'atd', label: '📅 Attendance' },
                    { key: 'msg', label: '💬 Messages' },
                    { key: 'earn', label: '💵 Earnings' },
                  ].map((perm) => (
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
                  borderRadius: 'var(--rsm)',
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
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 'var(--rsm)',
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
                Add Staff Member
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
                  {[
                    { key: 'sale', label: '💰 Make Sales' },
                    { key: 'inv', label: '📦 Inventory' },
                    { key: 'hist', label: '📊 History' },
                    { key: 'atd', label: '📅 Attendance' },
                    { key: 'msg', label: '💬 Messages' },
                    { key: 'earn', label: '💵 Earnings' },
                  ].map((perm) => (
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
                  borderRadius: 'var(--rsm)',
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
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 'var(--rsm)',
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
                Save Changes
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
              <button
                onClick={() => { setShowCredentialsModal(false); setNewStaffCredentials(null); }}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 'var(--rsm)',
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

              {viewingStaff.password && (
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
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Temporary password</span>
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: 'var(--text-1)',
                    letterSpacing: '0.05em',
                  }}>
                    {viewingStaff.password}
                  </div>
                </div>
              )}

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
                  borderRadius: 'var(--rsm)',
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
    </div>
  );
}
