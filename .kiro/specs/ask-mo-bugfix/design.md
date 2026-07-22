# Ask MO Chat Feature Bugfix Design

## Overview

The Ask MO chat feature contains 12 bugs across voice note recording/transcription, input container
layout, and page-level behaviour on both the mobile (`MobileAskMOPage.tsx`) and desktop
(`InlineAIChat.tsx`) surfaces.

The most critical are:
- **Bug #1** — `speech-to-text-service.ts` uses `Buffer.from()` (Node.js) and reads
  `process.env.GOOGLE_GENAI_API_KEY` directly in the browser, causing all transcription to fail
  silently.
- **Bug #9** — `useState(() => window.innerWidth <= 768)` crashes SSR with
  `ReferenceError: window is not defined`.

All remaining bugs are missing UI elements, a wrong CSS variable, an incorrect empty-state guard,
and a resize-redirect loop.

The fix strategy is **targeted and minimal**: each bug is addressed with the smallest possible
change that satisfies the requirement, and every change is validated to preserve existing behaviour
for all non-buggy inputs.

---

## Glossary

- **Bug_Condition (C)**: The input condition that causes defective behaviour for a given bug number.
- **Property (P)**: The desired outcome when C is satisfied.
- **Preservation**: All inputs where C is NOT satisfied must produce identical behaviour before and
  after the fix.
- **transcribeAudio (client)**: The browser-side call inside `InlineAIChat.tsx` /
  `MobileAskMOPage.tsx` that imports from `speech-to-text-service.ts`.
- **transcribeAudio (server)**: The Gemini API call that must only run server-side, reached via
  `POST /api/transcribe`.
- **isMobile**: The React state that tracks whether the viewport is mobile-sized, initialized in
  `MobileAskMOPage.tsx`.
- **startRecording**: The function that creates a `MediaRecorder`; the desktop version is missing
  MIME detection.
- **recordingTime**: The counter incremented every second during recording; displayed in the mobile
  input row but absent from the desktop input row.
- **cancelRecordingBtn / newChatBtn / historyBtn**: CSS classes defined in both module files but
  whose corresponding buttons are absent from the desktop JSX.
- **--bottom-nav-height**: A CSS custom property consumed in `MobileAskMOPage.module.css` but never
  defined, causing `calc()` to evaluate as if the variable were `0`.
- **formatAudioDuration**: A utility function in `ChatPanel.tsx` that reads real audio metadata;
  never called in the preview areas of either chat component.

---

## Bug Details

### Bug Condition Overview

Twelve independent bug conditions are identified. Each uses the pseudocode form
`isBugN(context) → boolean`.

```
FUNCTION isBug1(context)
  // Transcription uses Node.js APIs in the browser
  RETURN context.callSite = 'browser'
     AND context.usesBufferFrom = true
     AND context.serverRouteExists = false
END FUNCTION

FUNCTION isBug2(context)
  // Desktop MediaRecorder always uses audio/webm without feature detection
  RETURN context.component = 'InlineAIChat'
     AND context.startRecordingHasMimeDetection = false
END FUNCTION

FUNCTION isBug3(context)
  // recordingTime is never rendered in desktop input row
  RETURN context.component = 'InlineAIChat'
     AND context.isRecording = true
     AND context.recordingTimeRenderedInJSX = false
END FUNCTION

FUNCTION isBug4(context)
  // cancel recording button absent from desktop input row
  RETURN context.component = 'InlineAIChat'
     AND context.isRecording = true
     AND context.cancelRecordingBtnRenderedInJSX = false
END FUNCTION

FUNCTION isBug5(context)
  // mic button has no recording-state class on desktop
  RETURN context.component = 'InlineAIChat'
     AND context.isRecording = true
     AND context.micBtnHasRecordingClass = false
END FUNCTION

FUNCTION isBug6(context)
  // --bottom-nav-height undefined, input bar hidden under nav
  RETURN context.cssVarBottomNavHeightDefined = false
     AND context.component = 'MobileAskMOPage'
END FUNCTION

FUNCTION isBug7(context)
  // audio preview shows unstyled native <audio> element
  RETURN context.component = 'MobileAskMOPage'
     AND context.audioUrlExists = true
     AND context.audioPreviewUsesStyledContainer = false
END FUNCTION

FUNCTION isBug8(context)
  // audio duration preview shows recordingTime counter, not file duration
  RETURN (context.component = 'InlineAIChat' OR context.component = 'MobileAskMOPage')
     AND context.audioUrlExists = true
     AND context.durationSourceIsFileDuration = false
END FUNCTION

FUNCTION isBug9(context)
  // SSR crash: window accessed in useState initializer
  RETURN context.renderEnvironment = 'server'
     AND context.isMobileInitializerAccessesWindow = true
END FUNCTION

FUNCTION isBug10(context)
  // resize redirects on every event, interrupting conversation
  RETURN context.component = 'MobileAskMOPage'
     AND context.isMobile = false
     AND context.redirectGuardUsed = false
END FUNCTION

FUNCTION isBug11(context)
  // new chat and history buttons missing from desktop header
  RETURN context.component = 'InlineAIChat'
     AND context.newChatBtnRenderedInHeader = false
END FUNCTION

FUNCTION isBug12(context)
  // welcome screen hidden when conversations.length > 0
  RETURN context.component = 'MobileAskMOPage'
     AND context.messages.length = 0
     AND context.currentConversationId = null
     AND context.conversations.length > 0
     AND context.emptyStateConditionUsesConversationsLength = true
END FUNCTION
```

### Concrete Examples

- **Bug #1**: User records 5-second voice note on any browser, taps send. Console shows no error;
  chat bubble shows `"🎤 Voice message (transcription failed)"`. Root cause: `Buffer.from()` throws
  `ReferenceError` at runtime in the browser.
- **Bug #2**: User records on Safari iOS (desktop panel embedded via web view). `new
  MediaRecorder(stream)` throws `NotSupportedError` because `audio/webm` is not supported on
  Safari; recording never starts.
- **Bug #9**: Owner opens dashboard on a server that SSR-renders the page. Build log shows
  `ReferenceError: window is not defined` thrown from line
  `useState(() => window.innerWidth <= 768)`.
- **Bug #12**: Owner starts a brand-new chat after having 3 previous conversations. Empty state
  welcome screen is hidden because `conversations.length === 3 !== 0`; user sees a blank message
  area instead of the suggestion chips.
