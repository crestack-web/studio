# Bugfix Requirements Document

## Introduction

The Ask MO chat feature (AI business assistant) for the owner dashboard has 12 bugs spanning voice note recording/transcription, input container layout, and page-level behavior on both mobile (`MobileAskMOPage.tsx`) and desktop (`InlineAIChat.tsx`). The issues range from a critical SSR crash on mobile to silent transcription failures caused by Node.js APIs being used in the browser. Together they break voice input on all platforms, cause the mobile page to crash on the server during render, interrupt active conversations on window resize, and hide UI controls that are styled but never rendered.

---

## Bug Analysis

### Current Behavior (Defect)

**Voice Note — Transcription (Bug #1)**

1.1 WHEN a user records and sends a voice note THEN the system silently fails transcription because `speech-to-text-service.ts` calls `Buffer.from()` (a Node.js-only API) and reads `process.env.GOOGLE_GENAI_API_KEY` directly in the browser, neither of which is available client-side

1.2 WHEN transcription is attempted client-side THEN the system returns a fallback string `"🎤 Voice message (transcription failed)"` without exposing a server-side route for the actual Gemini API call

**Voice Note — Safari/iOS MIME type (Bug #2)**

1.3 WHEN a user starts recording on Safari or iOS in `InlineAIChat.tsx` (desktop) THEN the system always creates a `MediaRecorder` with `{ type: 'audio/webm' }` because `startRecording` has no MIME type detection loop, causing `MediaRecorder` construction to throw or produce unreadable audio

**Voice Note — Missing recording timer on desktop (Bug #3)**

1.4 WHEN a user is recording a voice note in `InlineAIChat.tsx` THEN the system shows no elapsed recording time because `recordingTime` state and `formatRecordingTime` function exist in the component but neither is rendered in the JSX

**Voice Note — Missing cancel button on desktop (Bug #4)**

1.5 WHEN a user is recording a voice note in `InlineAIChat.tsx` THEN the system provides no way to cancel the recording because the cancel button (`.cancelRecordingBtn` CSS class exists) is never rendered in the JSX input row

**Voice Note — Missing recording indicator on desktop mic button (Bug #5)**

1.6 WHEN recording is active in `InlineAIChat.tsx` THEN the mic button shows no visual feedback (no red background, no pulse animation) because the `styles.recording` conditional class is never applied to the mic button, unlike the mobile version which correctly toggles `styles.recording`

**Input Container — Bottom nav overlap on mobile (Bug #6)**

1.7 WHEN the mobile input area is rendered THEN the bottom padding calc `calc(12px + var(--bottom-nav-height))` in `MobileAskMOPage.module.css` evaluates to `calc(12px + 0)` because `--bottom-nav-height` CSS variable is never defined anywhere in the codebase, causing the input bar to be hidden under the bottom navigation

**Input Container — Unstyled native audio preview on mobile (Bug #7)**

1.8 WHEN a user records a voice note and stops recording on mobile THEN the system renders a raw `<audio controls>` element inside the input area with no custom styling, presenting an inconsistent unstyled native browser control instead of a styled preview matching the design system

**Input Container — Audio duration shows counter value not file duration (Bug #8)**

1.9 WHEN an audio preview is shown before sending on both desktop and mobile THEN the system displays `recordingTime` (the counter value at the moment recording stopped) as the duration rather than the actual decoded audio file duration, even though `formatAudioDuration` exists in `ChatPanel.tsx` but is never called

**Page-level — Mobile SSR crash (Bug #9)**

1.10 WHEN the mobile page is server-side rendered THEN the system throws `ReferenceError: window is not defined` because `useState(() => window.innerWidth <= 768)` accesses `window` during SSR where it does not exist

**Page-level — Resize redirect interrupts conversation (Bug #10)**

1.11 WHEN a user resizes the browser window on mobile THEN the system calls `navigateTo('home')` on every resize event that satisfies `!isMobile`, interrupting an active mid-conversation state because the `useEffect` depends on `isMobile` which changes on every resize

**Page-level — Missing new chat and history buttons on desktop (Bug #11)**

1.12 WHEN a user views the desktop Ask MO panel (`InlineAIChat.tsx`) THEN the system shows no "New Chat" or "History" buttons in the header because `.newChatBtn` and `.historyBtn` CSS classes are defined in `InlineAIChat.module.css` but neither button is rendered in the header JSX

**Page-level — Empty state hidden when prior conversations exist (Bug #12)**

1.13 WHEN a user starts a fresh new conversation but has old prior conversations THEN the system hides the welcome screen and suggestion chips because the empty state condition `messages.length === 0 && conversations.length === 0` requires both arrays to be empty, but `conversations` is never empty after the first use

---

### Expected Behavior (Correct)

**Voice Note — Transcription (Bug #1)**

2.1 WHEN a user records and sends a voice note THEN the system SHALL call a server-side API route (e.g. `POST /api/transcribe`) that uses `Buffer.from()` and `process.env.GOOGLE_GENAI_API_KEY` on the server, returns the transcription text, and the client uses the result without accessing Node.js APIs directly

2.2 WHEN the server-side transcription route is called THEN the system SHALL accept a base64-encoded audio payload and MIME type, call the Gemini API, and return `{ transcription: string }` to the client

**Voice Note — Safari/iOS MIME type (Bug #2)**

2.3 WHEN `startRecording` is called in `InlineAIChat.tsx` THEN the system SHALL iterate through `['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/wav']` and pick the first `MediaRecorder.isTypeSupported()` match before constructing the `MediaRecorder`, matching the existing logic in `MobileAskMOPage.tsx`

**Voice Note — Missing recording timer on desktop (Bug #3)**

2.4 WHEN recording is active in `InlineAIChat.tsx` THEN the system SHALL render a `<span>` inside the input row showing `formatRecordingTime(recordingTime)` so the user can see elapsed time in real time

**Voice Note — Missing cancel button on desktop (Bug #4)**

2.5 WHEN recording is active in `InlineAIChat.tsx` THEN the system SHALL render a cancel button (`styles.cancelRecordingBtn`) inside the input row that calls `cancelRecording()` when clicked, matching the mobile implementation

**Voice Note — Missing recording indicator on desktop mic button (Bug #5)**

2.6 WHEN recording is active in `InlineAIChat.tsx` THEN the mic button SHALL have `styles.recording` applied as a conditional class so the button shows a red background and pulse animation identical to the mobile implementation

**Input Container — Bottom nav overlap on mobile (Bug #6)**

2.7 WHEN the mobile page is rendered THEN the system SHALL define `--bottom-nav-height` as a CSS custom property (e.g. `60px`) at the `:root` level or on the container so the `inputArea` padding-bottom calculation resolves to a non-zero value and the input bar clears the bottom navigation

**Input Container — Unstyled native audio preview on mobile (Bug #7)**

2.8 WHEN a voice note is recorded and ready to send on mobile THEN the system SHALL render the audio preview using the styled `.audioPreview` container (already defined in `MobileAskMOPage.module.css`) with an `<audio>` element inside and a styled remove button, consistent with the design system

**Input Container — Audio duration shows counter value not file duration (Bug #8)**

2.9 WHEN an audio preview is displayed before sending THEN the system SHALL read and display the actual decoded audio file duration using a `loadedmetadata` listener on an `<audio>` element rather than `recordingTime`, so the shown duration matches the actual file length

**Page-level — Mobile SSR crash (Bug #9)**

2.10 WHEN the mobile page is server-side rendered THEN the system SHALL initialize `isMobile` state with a safe SSR default of `false` (e.g. `useState(false)`) and defer the `window.innerWidth` check to a client-side `useEffect`, preventing any `ReferenceError` during SSR

**Page-level — Resize redirect interrupts conversation (Bug #10)**

2.11 WHEN the browser window is resized to desktop width mid-conversation THEN the system SHALL only call `navigateTo('home')` once (e.g. using a `useRef` flag) and not on every subsequent resize event, so an active conversation is not repeatedly interrupted

**Page-level — Missing new chat and history buttons on desktop (Bug #11)**

2.12 WHEN a user views the desktop Ask MO panel THEN the system SHALL render a "New Chat" button (using `styles.newChatBtn`) that calls `handleNewChat()` and a "History" button (using `styles.historyBtn`) that opens the history panel, both in the header area, matching the CSS classes already defined

**Page-level — Empty state hidden when prior conversations exist (Bug #12)**

2.13 WHEN a user starts a fresh new conversation (i.e. `messages.length === 0` and `currentConversationId === null`) THEN the system SHALL show the welcome screen and suggestion chips regardless of whether `conversations` contains prior history, by replacing the `&& conversations.length === 0` guard with a check on `currentConversationId`

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user types and sends a text message THEN the system SHALL CONTINUE TO deliver the message to the `/api/ask-mo` endpoint and display the AI response correctly

3.2 WHEN a user attaches an image and sends it THEN the system SHALL CONTINUE TO pass the base64 image to the API and render it in the chat bubble

3.3 WHEN credits reach zero THEN the system SHALL CONTINUE TO show the credits-depleted toast and block further messages until credits are purchased

3.4 WHEN a user loads a prior conversation from history THEN the system SHALL CONTINUE TO render all historical messages in the correct order with no duplicate IDs

3.5 WHEN a user creates a new conversation by sending a first message THEN the system SHALL CONTINUE TO persist the conversation document to Firestore with the correct user and business IDs

3.6 WHEN a user is on a desktop viewport THEN the system SHALL CONTINUE TO show `InlineAIChat` embedded in the dashboard and NOT redirect to a separate page

3.7 WHEN a user is on a mobile viewport THEN the system SHALL CONTINUE TO show `MobileAskMOPage` as a full-screen overlay and the back button SHALL navigate to home

3.8 WHEN the audio transcription API route is called THEN the system SHALL CONTINUE TO support the same languages already handled in `speech-to-text-service.ts` (English, French, Spanish, German, Portuguese, Yoruba, Hausa, Igbo, Swahili)

3.9 WHEN the follow-up suggestion chips are tapped THEN the system SHALL CONTINUE TO pre-fill and send the suggested query to the AI

3.10 WHEN sale confirmation cards are shown THEN the system SHALL CONTINUE TO allow the user to confirm or cancel the pending sale action

---

## Bug Condition Pseudocode

**Bug Condition Functions:**

```pascal
FUNCTION isBug1(context)
  // Transcription called client-side
  RETURN context.transcribeAudio.callSite = 'browser'
    AND context.bufferUsed = true
    AND context.serverRouteExists = false
END FUNCTION

FUNCTION isBug9(context)
  // SSR with window access
  RETURN context.renderEnvironment = 'server'
    AND context.isMobileInitializer CONTAINS 'window.innerWidth'
END FUNCTION
```

**Fix Checking Property:**

```pascal
FOR ALL X WHERE isBug1(X) DO
  result ← transcribeAudio'(X)
  ASSERT result.callSite = 'server'
    AND result.bufferUsed = false  // client side
    AND result.serverRouteExists = true
    AND result.transcription IS NOT empty
END FOR

FOR ALL X WHERE isBug9(X) DO
  result ← renderPage'(X)
  ASSERT no ReferenceError thrown
    AND result.isMobileDefault = false
END FOR
```

**Preservation Checking:**

```pascal
FOR ALL X WHERE NOT isBug1(X) AND NOT isBug9(X) DO
  ASSERT F(X) = F'(X)  // All other behaviors remain identical
END FOR
```
