# ElevenLabs React SDK — Verified Surface

Verified against `@elevenlabs/react@1.13.0` (depends on `@elevenlabs/client@1.21.0`)
by reading the installed type declarations in `node_modules`. Do not copy from the
dashboard; this is the actual runtime API shape.

## Package layout

- `@elevenlabs/react` re-exports everything from `@elevenlabs/client`
  (`export * from "@elevenlabs/client"`) plus the conversation hooks below.
- Peer dependency: `react >= 16.8.0`.

## Top-level exports (`@elevenlabs/react`)

- Component: `ConversationProvider`
- Hooks: `useConversation`, `useConversationControls`, `useConversationStatus`,
  `useConversationInput`, `useConversationMode`, `useConversationFeedback`,
  `useRawConversation`, `useConversationClientTool`, `useScribe`
- Types: `UseConversationOptions`, `ConversationControlsValue`,
  `ConversationStatus`, `ConversationStatusValue`, `ConversationModeValue`,
  `ConversationFeedbackValue`, `ConversationProviderProps`, `HookOptions`,
  `HookCallbacks`, `ClientTool`, `ClientTools`, `ClientToolResult`

## Client tool registration (two equivalent paths)

1. Hook (registers/unregisters with the nearest provider; latest-closure safe):

   ```ts
   useConversationClientTool<Record<string, ClientTool>>(
     "update_readiness_item",
     (params) => { /* return string | number | void */ },
   );
   ```

2. Option object (passed to `useConversation` or `startSession`):

   ```ts
   { clientTools: { name: (params) => result } }
   ```

Underlying type:

```ts
type ClientToolResult = string | number | void;
type ClientTool<P = Record<string, unknown>, R = ClientToolResult> =
  (parameters: P) => Promise<R> | R;
type ClientTools = Record<string, ClientTool>;
```

The tool name MUST match the name configured on the ElevenLabs agent.

## `useConversation(props?)` return value

- `startSession(options?)` / `endSession()`
- `status: "disconnected" | "connecting" | "connected" | "error"`
- `mode: "speaking" | "listening"` (plus booleans `isSpeaking`, `isListening`)
- `message`, `isMuted`, `setMuted(isMuted)`
- `sendFeedback(like, eventId?)`, `sendUserMessage(text)`,
  `sendContextualUpdate(text, options?)`, `sendUserActivity()`,
  `setVolume({ volume })`, `changeInputDevice(...)`, `changeOutputDevice(...)`

`useConversationStatus()` returns `{ status, message }` and re-renders on change.

## Session config (what `useConversation` / `startSession` accept)

`SessionConfig` is a union; the public form requires `agentId: string`. Optional
fields: `connectionType: "websocket" | "webrtc"`, `overrides` (agent
prompt/firstMessage/language, tts voiceId/speed/stability/similarityBoost, asr
keywords, conversation textOnly), `dynamicVariables`, `textOnly`, `userId`,
`environment`.

## Callbacks (`HookCallbacks`)

Key callbacks for the trace/metrics wiring:

- `onConnect({ conversationId })`
- `onDisconnect(details)` — `details.reason: "error" | "agent" | "user"`
- `onError(message, context?)`
- `onMessage({ message, event_id, role, source })` — `role: "user" | "agent"`
  (this is the transcript surface; there is no `onUserTranscript` in v1.13)
- `onAudio(base64Audio)` — raw audio bytes, used to detect first-audio playback
- `onModeChange({ mode })` — `mode: "speaking" | "listening"`
- `onStatusChange({ status })` — `status: "disconnected" | "connecting" | "connected" | "disconnecting"`
- `onInterruption(props)`, `onVadScore({ vadScore })`
- `onAgentToolRequest(props)`, `onAgentToolResponse(props)`,
  `onUnhandledClientToolCall(props)`
- `onConversationMetadata(props)`, `onAsrInitiationMetadata(props)`
- `onAgentChatResponsePart(props)`, `onAgentReasoningResponsePart(props)`

## UI components are NOT part of this package

The ElevenLabs UI components (`orb`, `conversation`, `message`, `response`,
`conversation-bar`, `transcript-viewer`, `speech-input`, `shimmering-text`) are
installed via the CLI (`elevenlabs components add <name>`) into `components/ui/`,
not exported from `@elevenlabs/react`.
