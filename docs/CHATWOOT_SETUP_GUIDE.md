# Chatwoot Self-Hosted Setup Guide

## Overview
Busmo uses Chatwoot for human agent support escalation. When users request human support in the FloatingChatWidget, they are connected to your self-hosted Chatwoot instance at `https://support.busmo.io`.

## Architecture

```
User → FloatingChatWidget → MO AI (first line support)
                ↓ (requests human)
         Chatwoot Widget (opens)
                ↓
     Chatwoot Dashboard (agent responds)
```

## Step 1: Chatwoot Server Setup

### If you haven't set up Chatwoot yet:

1. **Deploy Chatwoot** on your server (`support.busmo.io`):
   ```bash
   # Example using Docker Compose
   git clone https://github.com/chatwoot/chatwoot.git
   cd chatwoot
   # Follow official Chatwoot deployment guide
   ```

2. **Access Chatwoot Dashboard:**
   - URL: `https://support.busmo.io`
   - Create your admin account
   - Note your **Account ID** (found in Settings → Account → API Keys)

## Step 2: Get Your Credentials

From your Chatwoot dashboard (`https://support.busmo.io`):

### A. Website Token (for widget)
1. Go to **Settings** → **Inboxes** → **Website**
2. Find your website inbox
3. Copy the **Website Token**

### B. API Access Token (for backend)
1. Go to **Settings** → **API Keys**
2. Create a new API key
3. Copy the **Access Token**

### C. Account ID
1. Go to **Settings** → **Account**
2. Copy the **Account ID** (usually a number like `1`)

### D. Inbox ID
1. Go to **Settings** → **Inboxes**
2. Copy the **Inbox ID** for your website inbox

### E. HMAC Secret (optional but recommended)
1. Go to **Settings** → **Security**
2. Copy the **HMAC Secret**

## Step 3: Configure Environment Variables

Create a `.env.local` file in your project root (or update existing):

```env
# Chatwoot Configuration
NEXT_PUBLIC_CHATWOOT_ENABLED=true
NEXT_PUBLIC_CHATWOOT_URL=https://support.busmo.io
NEXT_PUBLIC_CHATWOOT_ACCOUNT_ID=1
NEXT_PUBLIC_CHATWOOT_INBOX_ID=1
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your_website_token_here
CHATWOOT_API_ACCESS_TOKEN=your_api_access_token_here
CHATWOOT_HMAC_SECRET=your_hmac_secret_here
```

### Restart your development server:
```bash
npm run dev
```

## Step 4: How to Use Chatwoot

### For Support Agents:

1. **Log in to Chatwoot Dashboard:**
   ```
   https://support.busmo.io/dashboard
   ```

2. **View Conversations:**
   - Go to **Conversations** → **Open**
   - You'll see all user conversations that requested human support
   - Conversations are tagged with topics (billing, technical, etc.)

3. **Respond to Users:**
   - Click on a conversation
   - Type your message in the chat box
   - Press Enter or click Send
   - The user will see your response in real-time in the Chatwoot widget

4. **Assign Conversations:**
   - Assign to yourself or other team members
   - Change status (Open → Resolved)

### For Users (Customer Experience):

1. User opens **FloatingChatWidget** (bottom right corner)
2. Chats with **MO AI** (automated responses)
3. When they need human help, they can:
   - Type "human" or "agent"
   - Click the **👤 Human** button
4. **Chatwoot widget automatically opens**
5. User types their message
6. Agent sees it in Chatwoot dashboard and responds
7. Conversation continues in Chatwoot widget

## Step 5: Manage Your Team

### Add Team Members:

1. In Chatwoot dashboard, go to **Settings** → **Team**
2. Click **Add Agent**
3. Fill in:
   - Name
   - Email
   - Role (Agent, Admin, etc.)
4. Agent receives invitation email

### Set Up Notifications:

Agents can configure email notifications for:
- New conversations
- New messages
- Conversation assignments

## Step 6: Inbox Configuration (Optional)

You can set up multiple inboxes for different support types:

### In `src/lib/chatwoot-config.ts`:
```typescript
export const CHATWOOT_INBOXES = {
  WEBSITE_SUPPORT: 1,  // Technical support
  SALES: 2,            // Sales inquiries
  GENERAL_CONTACT: 3,  // General questions
};
```

### Create inboxes in Chatwoot:
1. Go to **Settings** → **Inboxes**
2. Create inboxes: "Website Support", "Sales", "General Contact"
3. Get the inbox IDs
4. The system will automatically route conversations based on topic detection

## Step 7: Monitor Support Metrics

Chatwoot provides built-in analytics:

1. **Dashboard Overview:**
   - Total conversations
   - Average response time
   - Agent performance

2. **Reports:**
   - Conversation trends
   - Agent productivity
   - Customer satisfaction (if CSAT enabled)

## Troubleshooting

### Chatwoot widget not loading:
- Check browser console for errors
- Verify `NEXT_PUBLIC_CHATWOOT_ENABLED=true`
- Verify `NEXT_PUBLIC_CHATWOOT_URL` is correct
- Check that website token is valid

### Messages not appearing in Chatwoot:
- Verify `CHATWOOT_API_ACCESS_TOKEN` is set correctly
- Check API token permissions in Chatwoot
- Ensure Account ID and Inbox ID are correct

### User not being identified:
- Check that user details are being passed correctly
- Verify user has valid email
- Check browser console for errors

## Testing

1. **Test widget appears:**
   ```bash
   npm run dev
   # Open http://localhost:3000
   # Look for Chatwoot widget in bottom-right
   ```

2. **Test conversation:**
   - Open browser DevTools Console
   - Type: `window.$chatwoot.toggle()`
   - Widget should open
   - Send a test message

3. **Test from FloatingChatWidget:**
   - Open FloatingChatWidget
   - Request human agent
   - Chatwoot widget should open automatically
   - Send message
   - Check Chatwoot dashboard for message

## Production Deployment

For production, ensure:

1. **Environment variables** are set in your hosting platform (Vercel, Firebase, etc.)
2. **HTTPS is enabled** for both your app and Chatwoot
3. **Chatwoot is accessible** at `https://support.busmo.io`
4. **API tokens** are stored securely (never commit to git)
5. **Team members** are trained on Chatwoot interface

## Support

- **Chatwoot Docs:** https://www.chatwoot.com/docs
- **Self-Hosted Guide:** https://www.chatwoot.com/docs/self-hosted
- **Your Instance:** https://support.busmo.io

## Quick Reference

| What | Where |
|------|-------|
| Chatwoot Dashboard | `https://support.busmo.io/dashboard` |
| Conversations | Dashboard → Conversations |
| Settings | Dashboard → Settings |
| API Keys | Settings → API Keys |
| Team Management | Settings → Team |
| Inboxes | Settings → Inboxes |