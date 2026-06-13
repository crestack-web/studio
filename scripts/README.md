# Scripts

## add-businessid-to-staff.js

This script adds a `businessId` field to a staff user's Firestore document, allowing them to access the owner's business data (products, sales, etc.).

### Usage

```bash
node scripts/add-businessid-to-staff.js <staffUid> <businessId> <ownerEmail> <ownerPassword>
```

### Example

```bash
node scripts/add-businessid-to-staff.js abc123xyz business456 owner@example.com password123
```

### Required Information

1. **staffUid**: The Firebase Auth UID of the staff user (can be found in Firebase Console → Authentication)
2. **businessId**: The ID of the business document in Firestore (can be found in Firebase Console → Firestore Database → businesses)
3. **ownerEmail**: Email of the business owner account
4. **ownerPassword**: Password of the business owner account

### Alternative: Manual Update in Firebase Console

If you prefer not to use the script, you can update the staff user document manually:

1. Go to Firebase Console → Firestore Database
2. Navigate to `users` collection
3. Find the staff user document
4. Click "Add field"
5. Add field name: `businessId`
6. Add field value: `{yourBusinessId}`
7. Click "Save"
