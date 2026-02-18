# Busmo WhatsApp Integration

## How to Run Locally
```bash
# Install dependencies
npm install

# Start with ngrok (for testing)
node ngrok-start.js

# Copy the HTTPS URL and paste into Meta Dashboard → Configuration → Callback URL
# Verify Token: busmo_secret_2026
```

## How to Test on WhatsApp
Send these messages to your WhatsApp test number:
- 📦 **Add product:** Send any photo with caption like "Bag 5000"
- 💰 **Record sale:** "Sold 2 shoes for 10000"
- 📊 **Report:** "Show today's sales"
- 📋 **Menu:** "help" or "what can you do"

## Firebase Collections Created
- `products` — all products added via WhatsApp
- `sales` — all sales recorded via WhatsApp
