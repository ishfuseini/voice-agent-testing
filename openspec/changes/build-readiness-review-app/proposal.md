## Why

Enterprise teams build voice-agent prototypes quickly but struggle to assess production readiness — latency and turn-taking, tool reliability, observability. Today this is done through static documents and manually maintained checklists, which is mismatched with the conversational system being evaluated. A voice agent should conduct that assessment itself and hold itself to the same standard it measures.

## What Changes

- Build a Next.js application with an ElevenLabs voice agent that conducts a production-readiness review conversationally
- Implement three readiness pillars (Latency & Turn-Taking, Tool Calling & Grounding, Observability & Monitoring) with 9–12 criteria total
- Implement a three-state assessment model: Ready, Needs Validation, Needs Attention — with no composite score
- Create four client-side tools (`update_readiness_item`, `get_assessment_state`, `complete_assessment`, `check_crm_health`) that execute in the browser and mutate Zustand state directly
- Build a single-screen UI with four panels: Conversation, Production Readiness, Session Metrics, and Trace
- Instrument live session metrics (p50/p95 end-of-speech to first-audio, tool duration) so the app visibly measures itself against the criteria it evaluates
- Implement an in-app event trace with timestamps and durations
- Include a controlled failure path: `check_crm_health` always times out; the agent marks the criterion as Needs Validation, not broken
- Generate a Markdown report grouped by state with evidence and actionable next steps
- Version-control the agent prompt and tool schemas under `agent/`
- Deploy to a public URL (Vercel)

## Capabilities

### New Capabilities

- `conversation`: ElevenLabs voice agent integration — conversation start/end, live transcript, agent listening/speaking state, contextual follow-up questions
- `assessment`: Readiness pillars and criteria definitions, three-state model (Ready / Needs Validation / Needs Attention), client tool handlers for state mutation, failure path handling, assessment state queries
- `session-metrics`: Live percentile computation (p50/p95) for end-of-speech to first-audio latency and tool duration, updating in real time during the session
- `trace`: Timestamped event stream — conversation events, tool calls/results/failures, state changes, latency measurements — emitted through a single interface
- `report`: Markdown report generation grouped by assessment state with evidence and concrete next steps, exportable
- `ui`: Single-screen layout composing Conversation, Production Readiness, Session Metrics, and Trace panels with Zustand-driven reactivity

### Modified Capabilities

_(None — this is a greenfield build; no existing specs to modify.)_

## Impact

- **New dependencies**: `@elevenlabs/react` (voice + UI components), `zustand` (state management), `vitest` (testing). Biome is already a dev dependency.
- **New code**: `app/page.tsx` (single screen), `components/` (six panel components + ElevenLabs UI + shadcn primitives), `lib/` (criteria, tools, metrics, report, types), `stores/` (assessment, trace, metrics, session), `agent/prompt.md`, `__tests__/`
- **Environment**: Adds `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` (already in `.env.example`)
- **No backend**: All tool handlers run client-side; no API routes, no server, no ORM
- **Deploy**: Vercel — live URL required as a deliverable
