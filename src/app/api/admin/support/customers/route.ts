// src/app/api/admin/support/customers/route.ts
import { NextRequest } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, status, priority } = body;
    
    const { firestore } = initializeFirebase();
    if (!firestore) {
      return Response.json({ error: 'Firebase not initialized' }, { status: 500 });
    }
    
    // Update customer status or priority
    if (customerId) {
      const docRef = doc(firestore, 'supportMessages', customerId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const updateData: any = {};
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;
        
        await updateDoc(docRef, updateData);
        return Response.json({ success: true });
      }
    }
    
    return Response.json({ error: 'Customer not found' }, { status: 404 });
  } catch (error) {
    console.error('Error updating customer:', error);
    return Response.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export const GET = async () => {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) {
      return Response.json({ error: 'Firebase not initialized' }, { status: 500 });
    }
    
    // Fetch all unique customers from support messages
    const q = query(
      collection(firestore, 'supportMessages'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    // Group by userId to get unique customers
    const customerMap = new Map();
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.userId || data.userEmail;
      
      if (!customerMap.has(userId)) {
        customerMap.set(userId, {
          id: userId,
          name: data.businessName || data.userEmail?.split('@')[0] || 'Unknown',
          email: data.userEmail || 'unknown',
          status: data.status || 'unread',
          priority: data.priority || 'medium',
          lastMessage: data.message,
          lastMessageTime: data.createdAt?.toDate?.() || new Date(),
          businessId: data.businessId,
        });
      }
    });
    
    const customers = Array.from(customerMap.values());
    return Response.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return Response.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
};
