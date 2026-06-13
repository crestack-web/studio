require('dotenv').config();
const ngrok = require('ngrok');

async function startWithNgrok() {
  try {
    // Kill any existing ngrok tunnels first
    console.log('🔄 Disconnecting any existing ngrok tunnels...');
    await ngrok.kill();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Start the express server
    require('./index.js');

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Start fresh ngrok tunnel
    const url = await ngrok.connect({
      addr: process.env.PORT || 3000
    });

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║     ✅ BUSMO WHATSAPP BOT IS LIVE!     ║');
    console.log('╚════════════════════════════════════════╝\n');
    console.log('📋 Go to: Meta Developer Dashboard');
    console.log('   → WhatsApp → Configuration → Webhook\n');
    console.log('👉 Callback URL:');
    console.log(`   ${url}/webhook\n`);
    console.log('🔑 Verify Token:');
    console.log('   busmo_secret_2026\n');
    console.log('════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    console.log('\n💡 Try these fixes:');
    console.log('   1. Run: taskkill /F /IM ngrok.exe');
    console.log('   2. Run: taskkill /F /IM node.exe');
    console.log('   3. Then run: node ngrok-start.js again\n');
    process.exit(1);
  }
}

startWithNgrok();