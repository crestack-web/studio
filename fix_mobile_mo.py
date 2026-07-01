import re

p = r'c:\busmo v1.1\studio\src\app\owner\dashboard\MobileAskMOPage.tsx'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

old = '// Always start with empty state on mount/refresh - like Meta AI / WhatsApp AI\n  useEffect(() => {\n    resetToNewChat();\n  }, [resetToNewChat]);'
new = '// Auto-load first conversation on mount for continuity after refresh\n  useEffect(() => {\n    if (conversations.length > 0 && !currentConversationId && messages.length === 0) {\n      loadConversation(conversations[0].id).catch(console.error);\n    }\n  }, [conversations, currentConversationId, messages.length, loadConversation]);'

if old in c:
    c = c.replace(old, new)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)
    print('Replacement done')
else:
    print('Old text not found')
    # Debug: show what we have around line 108
    lines = c.splitlines()
    for i in range(105, 115):
        print(i, repr(lines[i]))
