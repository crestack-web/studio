@echo off
setlocal enabledelayedexpansion

set "FILE=src\app\owner\dashboard\MobileAskMOPage.tsx"

REM Create temporary file
set "TEMP=%FILE%.tmp"

REM Read original file and apply fix
python -c "
import sys
p = r'src/app/owner/dashboard/MobileAskMOPage.tsx'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

old = '''  // Always start with empty state on mount/refresh - like Meta AI / WhatsApp AI
  useEffect(() => {
    resetToNewChat();
  }, [resetToNewChat]);'''

new = '''  // Auto-load first conversation on mount for continuity after refresh
  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId && messages.length === 0) {
      loadConversation(conversations[0].id).catch(console.error);
    }
  }, [conversations, currentConversationId, messages.length, loadConversation]);'''

if old in c:
    c = c.replace(old, new)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)
    print('SUCCESS: Fix applied')
else:
    print('ERROR: Target text not found')
    sys.exit(1)
"

if errorlevel 1 (
    echo Failed to apply fix
    exit /b 1
)

echo Fix applied successfully
pause
