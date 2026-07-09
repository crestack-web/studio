# How to Use Chatwoot - Complete Guide

## Overview
You can now respond to users via the Chatwoot dashboard at `https://support.busmo.io/dashboard`.

## Accessing Chatwoot

### 1. **Open Chatwoot Dashboard**
```
URL: https://support.busmo.io/dashboard
```

### 2. **Log In**
- Use the credentials you created when setting up Chatwoot
- If you don't remember your password, use the "Forgot Password" link on the login page

## Understanding the Chatwoot Interface

### Dashboard Home
When you first log in, you'll see the **Dashboard** with:
- **Conversations**: Total number of conversations
- **Response Time**: Average response time
- **Open Conversations**: Currently active conversations needing attention

### Main Navigation (Left Sidebar)
- **Conversations**: View and reply to user messages
- **Inbox**: See all conversations organized by status
- **Contacts**: Manage your users
- **Reports**: Analytics and insights
- **Settings**: Configure Chatwoot settings

## Responding to Users

### Viewing Conversations

1. **Go to Conversations**:
   - Click **Conversations** in the left sidebar
   - You'll see a list of all conversations

2. **Conversation Status**:
   - **Open**: New/unread messages from users
   - **Pending**: Waiting for user response
   - **Resolved**: Conversation completed
   - **Snoozed**: Temporarily paused

3. **Open a Conversation**:
   - Click on any conversation to open it
   - You'll see the full message history
   - Messages from MO AI (bot) are clearly marked

### Replying to a Conversation

1. **Read the Conversation**:
   - Check what the user asked
   - Review MO AI's automated response (if any)
   - Understand the context

2. **Type Your Reply**:
   - Scroll to the bottom of the conversation
   - Type your message in the text box
   - Use formatting tools if needed (bold, links, etc.)

3. **Send the Message**:
   - Click **Send** or press Enter
   - The user will receive your message in real-time
   - The conversation status will change to "Pending"

4. **Change Status** (Optional):
   - Mark as **Resolved** if the issue is solved
   - **Snooze** if you need more time
   - Keep **Open** if still waiting for user

### Quick Actions

**Assign to Yourself:**
- Click the "Assign" button in the conversation
- Select your name from the list
- The conversation will be tagged with your name

**Add Labels:**
- Click "Add Label" to categorize the conversation
- Use labels like: `billing`, `technical`, `urgent`, etc.
- This helps with reporting and filtering

**Change Inbox:**
- You can move conversations between inboxes if needed
- Click "Move to Inbox" and select the destination

## Mobile Access

### Using Chatwoot Mobile App

1. **Download Chatwoot App** (if available for your platform):
   - Search "Chatwoot" in your app store
   - Download the official Chatwoot mobile app

2. **Log In**:
   - Use your Chatwoot credentials
   - Access: `https://support.busmo.io`

3. **Features Available on Mobile**:
   - View conversations
   - Reply to messages
   - Assign conversations
   - Change conversation status
   - Push notifications for new messages

## Best Practices

### Responding to Users

1. **Be Prompt**:
   - Users expect responses within minutes
   - Check Chatwoot regularly
   - Enable push notifications

2. **Be Clear and Friendly**:
   - Use simple language
   - Avoid technical jargon
   - Be polite and professional

3. **Escalate When Needed**:
   - If a question is too complex, don't hesitate to ask a colleague
   - Use the "Assign" feature

4. **Use Templates** (if set up):
   - Chatwoot supports canned responses
   - Save time with predefined answers to common questions

5. **Follow Up**:
   - If you resolve an issue, mark as "Resolved"
   - The user will see the resolution

### Managing Your Time

1. **Check for Open Conversations**:
   - Log in at the start of your day
   - Review all open conversations
   - Prioritize urgent issues (tagged with `urgent`)

2. **Set Your Status**:
   - Set yourself as "Online" when available
   - Set "Offline" when not working
   - Users will see your availability status

3. **Use Labels Effectively**:
   - `billing` - Payment/subscription issues
   - `technical` - Bugs, errors, technical questions
   - `feature-request` - New feature suggestions
   - `feedback` - General feedback
   - `urgent` - Requires immediate attention

## Testing the Integration

### Test 1: Send a Test Message
1. Open your Busmo app in a browser
2. Open the FloatingChatWidget
3. Click "👤 Human" button
4. Type: "Hello, this is a test message"
5. Send it
6. Go to `https://support.busmo.io/dashboard`
7. You should see the conversation in "Conversations"
8. Reply to it - the user should see your response in real-time

### Test 2: Verify User Identification
1. Send a message as a logged-in user
2. Check the conversation in Chatwoot
3. You should see user details:
   - Name
   - Email
   - Business Name
   - User ID

## Troubleshooting

### Chatwoot Widget Not Opening
- Check browser console for errors
- Verify `.env.local` has correct values
- Restart the development server

### Messages Not Appearing in Chatwoot
- Verify `CHATWOOT_API_ACCESS_TOKEN` is correct
- Check `NEXT_PUBLIC_CHATWOOT_ACCOUNT_ID` matches (174477)
- Ensure Chatwoot instance is running at `https://support.busmo.io`

### Can't Log In to Chatwoot Dashboard
- Verify credentials at `https://support.busmo.io`
- Check if the instance is running
- Try password reset if needed

## Quick Reference

| Task | How To |
|------|-------|
| View conversations | Conversations → Open |
| Reply to user | Click conversation → Type → Send |
| Assign to yourself | Click "Assign" → Select your name |
| Resolve conversation | Click "Resolve" button |
| Add label | Click "Add Label" → Select tag |
| Change status | Use status dropdown |
| Respond via mobile | Download Chatwoot app → Log in |
| Check analytics | Reports section |

## Support

- **Chatwoot Docs**: https://www.chatwoot.com/docs
- **Your Instance**: https://support.busmo.io
- **Dashboard**: https://support.busmo.io/dashboard

## Next Steps

1. ✅ Log in to Chatwoot dashboard
2. ✅ Explore the interface
3. ✅ Send a test message from your app
4. ✅ Reply to the test message
5. ✅ Download mobile app (optional)
6. ✅ Set up notifications
7. ✅ Invite team members (if needed)

You're all set! Start responding to users in the Chatwoot dashboard.