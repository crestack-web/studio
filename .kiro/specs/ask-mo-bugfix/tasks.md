# Ask MO Bugfix Tasks

## Task 1: Create server-side transcription API route
- [x] 1.1 Create `src/app/api/transcribe/route.ts` — POST handler that accepts `{ audio: string (base64), mimeType: string, language: string }`, calls Gemini via `speech-to-text-service.ts` on the server, returns `{ transcription: string }`
- [x] 1.2 Add input validation: reject requests with missing audio or unsupported mimeType; return 400 with error message
- [x] 1.3 Add error handling: catch Gemini API errors and return 500 with safe error message (no API key leakage)

## Task 2: Update client-side transcription calls to use the new API route
- [x] 2.1 In `MobileAskMOPage.tsx`, replace the dynamic import of `speech-to-text-service` in `transcribeAudio()` with a `fetch('POST /api/transcribe', { audio: audioBase64, mimeType, language })` call
- [x] 2.2 In `InlineAIChat.tsx`, replace the dynamic import of `speech-to-text-service` in `transcribeAudio()` with the same `fetch('POST /api/transcribe', ...)` call
- [x] 2.3 Ensure `audioBase64` state (already present in `MobileAskMOPage.tsx`) is passed as the audio payload; add equivalent base64 conversion to `InlineAIChat.tsx` in the `onstop` handler

## Task 3: Fix Safari/iOS MIME type detection in desktop InlineAIChat
- [x] 3.1 In `InlineAIChat.tsx` `startRecording()`, add MIME type detection loop iterating `['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/wav']` using `MediaRecorder.isTypeSupported()`, matching the existing logic in `MobileAskMOPage.tsx`
- [x] 3.2 Pass the detected `mimeType` to `new MediaRecorder(stream, { mimeType })` and store it for use in the transcription fetch call

## Task 4: Add missing recording UI elements to desktop InlineAIChat
- [x] 4.1 In `InlineAIChat.tsx` input row JSX, render `{isRecording && <span className={styles.recordingTime}>{formatRecordingTime(recordingTime)}</span>}` between the mic button and textarea
- [x] 4.2 In `InlineAIChat.tsx` input row JSX, render `{isRecording && <button className={styles.cancelRecordingBtn} onClick={cancelRecording}>✕</button>}` after the recording time span
- [x] 4.3 In `InlineAIChat.tsx`, apply `isRecording ? styles.micBtn + ' ' + styles.recording : styles.micBtn` (or template literal / `clsx`) to the mic button className so the red pulse animation triggers during recording

## Task 5: Fix `--bottom-nav-height` CSS variable on mobile
- [x] 5.1 Define `--bottom-nav-height: 60px` in `MobileAskMOPage.module.css` on the `.container` selector (or globally in `globals.css` / `tokens.css`) so the `inputArea` padding-bottom calc resolves correctly
- [-] 5.2 Verify the value matches the actual rendered height of `MobileBottomNav` — check `MobileBottomNav.module.css` for the nav height and use the same value

## Task 6: Fix unstyled audio preview on mobile
- [~] 6.1 In `MobileAskMOPage.tsx`, the `audioUrl` preview block already uses `styles.audioPreview` with `<audio src={audioUrl} controls />` and a remove button — verify it is correct and matches the styled container defined in the module CSS. If the native controls are visually inconsistent, wrap in the existing styled div structure.
- [~] 6.2 Ensure the remove button uses `styles.removeAudio` class and calls the correct state resets (`setAudioBlob(null)`, `setAudioUrl(null)`, `setRecordingTime(0)`)

## Task 7: Fix audio duration display to use actual file duration
- [~] 7.1 Add an `audioDuration` state (`useState<number>(0)`) to both `MobileAskMOPage.tsx` and `InlineAIChat.tsx`
- [~] 7.2 When `audioUrl` is set (in the `onstop` handler), create a temporary `Audio` object, attach a `loadedmetadata` listener that sets `audioDuration` to `audio.duration`, then set `audio.src = url`
- [~] 7.3 In the audio preview JSX, replace `{formatRecordingTime(recordingTime)}` with `{formatRecordingTime(Math.round(audioDuration || recordingTime))}` as a fallback if metadata hasn't loaded
- [~] 7.4 Reset `audioDuration` to 0 when audio is cleared (alongside `setAudioBlob(null)`, `setAudioUrl(null)`)

## Task 8: Fix SSR crash in MobileAskMOPage
- [~] 8.1 In `MobileAskMOPage.tsx`, change `const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)` to `const [isMobile, setIsMobile] = useState(false)`
- [~] 8.2 Add a `useEffect(() => { setIsMobile(window.innerWidth <= 768) }, [])` immediately after the state declaration to set the correct value on the client after hydration

## Task 9: Fix resize redirect interrupting active conversations
- [~] 9.1 In `MobileAskMOPage.tsx`, add `const hasRedirectedRef = useRef(false)` near the other refs
- [~] 9.2 In the `useEffect` that calls `navigateTo('home')` when `!isMobile`, add a guard: `if (!isMobile && !hasRedirectedRef.current) { hasRedirectedRef.current = true; navigateTo('home'); }`
- [~] 9.3 Reset `hasRedirectedRef.current = false` when `isMobile` becomes `true` again so the redirect can fire again if the user returns to mobile width

## Task 10: Add New Chat and History buttons to desktop InlineAIChat header
- [~] 10.1 In `InlineAIChat.tsx`, add a "New Chat" button to the header using `styles.newChatBtn` that calls `handleNewChat()`; place it in the `headerLeft` div or as a sibling to `closeBtn`
- [~] 10.2 Add a `showHistory` state (`useState(false)`) to `InlineAIChat.tsx` if not already present, and a "History" button using `styles.historyBtn` that toggles `showHistory`
- [~] 10.3 Render the history panel conditionally on `showHistory`, reusing the existing `historyPanel`, `historyList`, `historyItem` CSS classes already defined in `InlineAIChat.module.css`

## Task 11: Fix mobile empty state condition
- [~] 11.1 In `MobileAskMOPage.tsx`, change the empty state condition from `messages.length === 0 && conversations.length === 0` to `messages.length === 0 && !currentConversationId` so the welcome screen and suggestion chips show whenever the user is in a fresh (unsaved) conversation regardless of prior history
