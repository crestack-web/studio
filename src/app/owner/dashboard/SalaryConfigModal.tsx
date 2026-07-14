'use client';

import React, { useState, useEffect } from 'react';

interface StaffMember {
  id: string;
  staffId: string;
  name: string;
  role: string;
  salary?: number;
  paymentFrequency?: string;
  nextPaymentDate?: string;
  paymentAccount?: string;
}

interface SalaryConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMember: StaffMember | null;
  onSave: (data: {
    salary: number;
    paymentFrequency: string;
    nextPaymentDate: string;
    paymentAccount: string;
  }) => Promise<void>;
  showToast: (message: string) => void;
}

const SalaryConfigModal: React.FC<SalaryConfigModalProps> = ({
  isOpen,
  onClose,
  staffMember,
  onSave,
  showToast,
}) => {
  const [salary, setSalary] = useState('0');
  const [paymentFrequency, setPaymentFrequency] = useState('Monthly');
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (staffMember) {
      setSalary(staffMember.salary?.toString() || '0');
      setPaymentFrequency(staffMember.paymentFrequency || 'Monthly');
      setNextPaymentDate(staffMember.nextPaymentDate || '');
      setPaymentAccount(staffMember.paymentAccount || '');
    }
  }, [staffMember]);

  const handleSave = async () => {
    if (!staffMember) return;

    const salaryNum = parseInt(salary) || 0;
    
    if (salaryNum <= 0) {
      showToast('Please enter a valid salary amount');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        salary: salaryNum,
        paymentFrequency,
        nextPaymentDate,
        paymentAccount,
      });
      showToast('Salary configuration saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving salary config:', error);
      showToast('Failed to save salary configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !staffMember) return null;

  return (
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
    }} onClick={onClose}>
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
            }}>Configure Salary</h3>
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-3)',
              margin: '4px 0 0 0',
            }}>Set up payroll for {staffMember.name}</p>
          </div>
          <button
            onClick={onClose}
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
          {/* Staff Info */}
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            background: 'var(--bg)',
            borderRadius: 'var(--rsm)',
            border: '1.5px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--purple-bg)',
              color: 'var(--purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}>
              {staffMember.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-1)' }}>{staffMember.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{staffMember.role}</div>
            </div>
          </div>

          {/* Base Salary */}
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
              Base Salary (₦) <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="Enter base salary"
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
                e.target.style.borderColor = 'var(--green)';
                e.target.style.boxShadow = '0 0 0 3px var(--green-lt)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Payment Frequency */}
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
              Payment Frequency
            </label>
            <select
              value={paymentFrequency}
              onChange={(e) => setPaymentFrequency(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--rsm)',
                border: '1.5px solid var(--border)',
                fontSize: '0.9rem',
                color: 'var(--text-1)',
                background: 'var(--surface)',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <option value="Weekly">Weekly</option>
              <option value="Bi-weekly">Bi-weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
            </select>
          </div>

          {/* Next Payment Date */}
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
              Next Payment Date
            </label>
            <input
              type="date"
              value={nextPaymentDate}
              onChange={(e) => setNextPaymentDate(e.target.value)}
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
                e.target.style.borderColor = 'var(--green)';
                e.target.style.boxShadow = '0 0 0 3px var(--green-lt)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Payment Account (for future wallet integration) */}
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
              Payment Account (Optional)
            </label>
            <input
              type="text"
              value={paymentAccount}
              onChange={(e) => setPaymentAccount(e.target.value)}
              placeholder="Bank account or payment method"
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
                e.target.style.borderColor = 'var(--green)';
                e.target.style.boxShadow = '0 0 0 3px var(--green-lt)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div style={{
              marginTop: '6px',
              fontSize: '0.7rem',
              color: 'var(--text-3)',
            }}>
              This will be used when owner wallet integration is available
            </div>
          </div>

          {/* Info Box */}
          <div style={{
            padding: '14px',
            background: 'var(--green-bg)',
            borderRadius: 'var(--rsm)',
            border: '1px solid var(--green)',
            marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>ℹ️</span>
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--green)',
                  marginBottom: '3px',
                }}>
                  Salary Configuration
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-3)',
                  lineHeight: 1.5,
                }}>
                  Configure salary details for payroll management. You can update these settings anytime.
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
            onClick={onClose}
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
            onClick={handleSave}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: isSaving ? 'var(--green-dark)' : 'var(--green)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
              opacity: isSaving ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.background = 'var(--green-dark)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.35)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving) {
                e.currentTarget.style.background = 'var(--green)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(22, 163, 74, 0.25)';
              }
            }}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalaryConfigModal;