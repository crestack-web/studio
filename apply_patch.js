const fs = require('fs');
const p = 'src/app/owner/dashboard/MobileAskMOPage.tsx';
let c = fs.readFileSync(p, 'utf8');
const old = `// Auto-load first conversation on mount for continuity after refresh
  useEffect(() => {
    resetToNewChat();
  }, [resetToNewChat]);`;
const nw = `// Auto-load first conversation on mount for continuity after refresh
  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId && messages.length === 0) {
      loadConversation(conversations[0].id).catch(console.error);
    }
  }, [conversations, currentConversationId, messages.length, loadConversation]);`;
if (c.includes(old)) {
  c = c.replace(old, nw);
  fs.writeFileSync(p, c);
  console.log('PATCHED');
} else {
  console.log('OLD_TEXT_NOT_FOUND');
}
