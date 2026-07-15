// src/app/api/admin/support/customers/route.ts
// Fixing the string with apostrophe
const initialCustomers: Customer[] = [
  {
    id: 'cust_1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    status: 'Online',
    priority: 'high',
    lastMessage: 'Where is my order?',
    lastMessageTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: 'cust_2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    status: 'Offline',
    priority: 'low',
    // Fixed the string with apostrophe by using double quotes inside single quotes
    lastMessage: "I'm having trouble with the inventory tracking.",
    lastMessageTime: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
  }
];