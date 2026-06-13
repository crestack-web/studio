const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendTransactionalEmail } = require('../email/service');

const db = admin.firestore();

const publicAppUrl = process.env.PUBLIC_APP_URL || process.env.PUBLIC_BRAND_HOST || 'https://busmo.web.app';

exports.onStaffInvitationCreate = functions.firestore
  .document('invitations/{email}')
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data) return null;

    const to = data.email;
    const businessName = data.businessName || 'a business';
    const status = data.status;

    if (!to || status !== 'pending') return null;

    try {
      await sendTransactionalEmail({
        to,
        templateId: 'staff_invite',
        data: {
          businessName,
          joinUrl: `${publicAppUrl}/login/staff`,
        },
      });
      console.log(`Staff invite email sent to ${to} for ${businessName}`);
    } catch (error) {
      console.error('Failed to send staff invite email', { to, businessName, error });
    }
    return null;
  });

exports.onStaffPermissionsAssigned = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};

    if (after.role !== 'Staff') return null;
    if (!after.email) return null;

    const permissionsBefore = before.staffPermissions;
    const permissionsAfter = after.staffPermissions;

    const assignedBefore = Boolean(before.staffPermissionsAssignedAt) || Boolean(permissionsBefore);
    const assignedAfter = Boolean(after.staffPermissionsAssignedAt) || Boolean(permissionsAfter);

    if (assignedBefore || !assignedAfter) return null;

    let businessName = 'your business';
    try {
      if (after.businessId) {
        const businessSnap = await db.collection('businesses').doc(after.businessId).get();
        if (businessSnap.exists) {
          businessName = businessSnap.data().businessName || businessName;
        }
      }
    } catch (e) {
      console.warn('Could not fetch business name for staff access email', e);
    }

    const permissionsSummary = permissionsAfter
      ? Object.entries(permissionsAfter)
          .filter(([, v]) => Boolean(v))
          .map(([k]) => {
            switch (k) {
              case 'canRecordSale':
                return 'Record sales';
              case 'canAddInventory':
                return 'Add inventory';
              case 'canRecordExpense':
                return 'Record expenses';
              default:
                return k;
            }
          })
          .join(', ')
      : '';

    try {
      await sendTransactionalEmail({
        to: after.email,
        templateId: 'staff_access_granted',
        data: {
          businessName,
          permissionsSummary,
          dashboardUrl: `${publicAppUrl}/staff/home`,
        },
      });
      console.log(`Staff access email sent to ${after.email} for ${businessName}`);
    } catch (error) {
      console.error('Failed to send staff access email', { to: after.email, businessName, error });
    }

    return null;
  });
