// src/app/api/admin/support/messages/route.ts
import { NextRequest } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, query, where, orderBy, getDoc, doc, updateDoc, arrayUnion, getDocs } from 'firebase/firestore';

// POST endpoint for admin to send a message to a customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, customerId, parentMessageId } = body;
    
    // Validate required fields
    if (!message || !customerId) {
      return Response.json(
        { error: 'Message and customerId are required' }, 
        { status: 400 }
      );
    }
    
    const { firestore } = initializeFirebase();
    if (!firestore) {
      return Response.json({ error: 'Firebase not initialized' }, { status: 500 });
    }
    
    // If replying to an existing message, add to replies array
    if (parentMessageId) {
      const docRef = doc(firestore, 'supportMessages', parentMessageId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          replies: arrayUnion({
            sender: 'admin',
            message: message,
            createdAt: new Date().toISOString(),
          }),
          status: 'replied',
        });
        
        return Response.json({ success: true, message: 'Reply sent successfully' });
      }
    } else {
      // Create a new message from admin to customer
      const docRef = await addDoc(collection(firestore, 'supportMessages'), {
        userId: customerId,
        userEmail: body.userEmail || 'unknown',
        businessId: body.businessId || null,
        businessName: body.businessName || null,
        message: message,
        sender: 'admin',
        status: 'unread',
        category: body.category || 'general',
        createdAt: new Date(),
        replies: [],
      });
      
      return Response.json({ success: true, messageId: docRef.id });
    }
    
    return Response.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    return Response.json({ 
      error: 'Failed to send message'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve all messages for a specific customer
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    
    const { firestore } = initializeFirebase();
    if (!firestore) {
      return Response.json({ error: 'Firebase not initialized' }, { status: 500 });
    }
    
    if (customerId) {
      // Fetch messages for specific customer
      const q = query(
        collection(firestore, 'supportMessages'),
        where('userId', '==', customerId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      return Response.json(messages);
    } else {
      // Fetch all messages for admin dashboard
      const q = query(
        collection(firestore, 'supportMessages'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      return Response.json(messages);
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return Response.json({ 
      error: 'Failed to fetch messages'
    }, { status: 500 });
  }
}