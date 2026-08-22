# Voice Agent Readiness Review

A voice agent that conducts a production-readiness review of a voice-agent deployment — conversationally, not as a checklist read aloud.

The agent asks one question at a time, listens to your answers, records evidence, and grades each criterion against three states. When the conversation ends, it generates a Markdown report grouped by state with actionable next steps.

No backend. No checklists. The agent holds itself to the same standard it measures.

---

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Create `.env.local`:

```
ELEVENLABS_API_KEY=your_api_key
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id
```

The agent must be configured on the [ElevenLabs dashboard](https://elevenlabs.io) with the four client tools listed below.

### Other Commands

```bash
pnpm test      # Run vitest (47 tests)
pnpm build     # Production build
pnpm lint      # Biome check
```

---

## How It Works

A single-screen Next.js app with four panels, all visible simultaneously:

```
┌─────────────────────────────────────────────────────────┐
│  Header: Avatar · Title · "An ishlabs Production"       │
├──────────────────────┬──────────────────────────────────┤
│                      │  Session Metrics (p50/p95)       │
│  Conversation Panel  ├───────────────┬──────────────────┤
│  (Orb + Transcript)  │  Readiness    │  Trace           │
│                      │  Panel        │  Panel            │
│                      ├───────────────┴──────────────────┤
│                      │  Readiness Report (+ export)      │
└──────────────────────┴──────────────────────────────────┘
```

- **Conversation** — ElevenLabs Orb (animated, colored) + live transcript. Start/End buttons.
- **Production Readiness** — Three pillars, nine criteria, each with a status badge (Ready / Needs Validation / Needs Attention). Updates live as the agent calls tools.
- **Session Metrics** — p50/p95 end-of-speech-to-first-audio latency, tool duration p50, tool failure count. Updates live during conversation.
- **Trace** — Timestamped event stream: conversation start/end, speech detected, agent response, tool calls, failures, state changes, latency measurements.
- **Readiness Report** — Markdown report grouped by state with evidence and next steps. Export button appears when the assessment is complete.

---

## Architecture

### Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind CSS v4** + **shadcn/ui**
- **Zustand** (state management — four stores)
- **@elevenlabs/react** (voice agent SDK + UI components)
- **Three.js / React Three Fiber** (orb animation)
- **Vitest** (testing) + **Biome** (lint/format)

### State Layer

Four Zustand stores, each with a single responsibility:

| Store | File | Responsibility |
|-------|------|-----------------|
| Assessment | `stores/assessment.ts` | Criteria map, status updates, completion flag |
| Trace | `stores/trace.ts` | Timestamped event list via single `emit()` interface |
| Metrics | `stores/metrics.ts` | Latency samples, tool durations, failure count |
| Session | `stores/session.ts` | Conversation lifecycle (idle → active → ended), transcript |

**Tool handlers are the only writers.** UI components read from stores and re-render on mutation. This boundary is deliberate — it means all state changes are traceable to a tool call.

### ElevenLabs Integration

The `useReadinessConversation()` hook in `lib/useConversation.ts` wraps the ElevenLabs `useConversation` SDK with:

- **Four client tools** registered (no server, no webhooks)
- **Conversation events** wired to the trace store via `emit()`
- **Transcript** pushed to the session store
- **First-audio latency** measured from user speech end to agent speaking mode
- **Session lifecycle** managed through SDK callbacks (onConnect/onDisconnect)

The ConversationProvider wraps the app in `components/providers.tsx`.

### Tool Design

All four tools execute in the browser and mutate Zustand stores directly:

| Tool | Purpose | Mutates |
|------|---------|---------|
| `update_readiness_item` | Record evidence for a criterion, set status | Assessment store + trace |
| `get_assessment_state` | Query current progress (evaluated, remaining, counts) | None (read-only) |
| `complete_assessment` | End the review, trigger report | Assessment store + trace |
| `check_crm_health` | Simulated dependency check — always times out after 5s | Metrics store + trace |

The `check_crm_health` tool is intentionally broken. It demonstrates the failure path: the tool times out, the metrics store records the failure, the trace panel shows the timeout event, and the agent marks the criterion as **Needs Validation** (unverified), not **Needs Attention** (broken).

### Assessment Model

Three pillars, nine criteria:

**Latency & Turn-Taking**
- End-of-speech to first-audio latency
- Interruption handling
- Turn-taking timeout

**Tool Calling & Grounding**
- Client tool registration
- Tool grounding & evidence capture
- Failure path handling

**Observability & Monitoring**
- Trace event stream
- Live session metrics
- Report generation & export

Each criterion has one of three states: **Ready** ✓, **Needs Validation** ?, **Needs Attention** !. There is no composite score, percentage, or grade. The report groups findings by state with evidence and next steps.

### Report Generation

`lib/report.ts` is a pure function: assessment state in, Markdown string out. Grouped by state (Ready → Needs Validation → Needs Attention), each finding includes the criterion name, evidence recorded during conversation, and a recommended next step.

The report renders in-app when `complete_assessment` is called. An export button downloads the Markdown file.

### Observability

The in-app trace is the observability deliverable. All events flow through a single `emit(event)` interface in `stores/trace.ts`:

- Conversation start/end
- Speech detected (user)
- Agent response
- Tool call / tool failure (with duration)
- Assessment change (criterion status updated)
- Latency measurement (end-of-speech to first-audio)

The single `emit()` interface is a deliberate seam — an external sink (OpenTelemetry, log aggregator) can attach later by subscribing to the same function without modifying call sites.

---

## Design Decisions and Trade-offs

### Three states instead of a score

A composite score implies false precision. "82% ready" doesn't tell you what to fix. Three states — Ready, Needs Validation, Needs Attention — map directly to action: ship it, verify it, fix it. The report groups by state so the reader sees what's blocking, not a number.

### Client-side tools instead of webhooks

Tool handlers run in the browser and mutate Zustand stores directly. This eliminates the need for a server, removes tunneling during local development, and makes tool-call latency real and observable in the trace panel. The trade-off: no persistence, no multi-session state, and tools can't access server-only resources. For a demo and v1, this is the right trade — the argument is about the conversation, not the infrastructure.

### No composite percentage anywhere

The app never computes or displays a score, percentage, rating, or grade. The assessment state is a set of criterion statuses, not an aggregation. This is enforced in tests (`__tests__/e2e-flow.test.ts` checks that no score/percentage/composite/rating/grade appears in the report or assessment state).

### Simulated failure path

`check_crm_health` always times out after 5 seconds. This is intentional — the demo needs a controlled failure to show how the agent handles it. The agent should mark the criterion as Needs Validation (the integration couldn't be verified), not Needs Attention (it's broken). This distinction is the entire point: the agent distinguishes "I couldn't verify this" from "this is broken."

### What was cut

- **No backend/API routes** — client-side only, by design
- **No persistence** — session state is lost on refresh (acceptable for v1)
- **No external tracing** — the in-app trace is the v1 deliverable; external sinks are a future addition via the `emit()` seam
- **No PDF export** — Markdown only
- **No router** — single screen, no navigation
- **No real CRM integration** — simulated timeout only

### What changes at production scale

- **Persistence** — store sessions in a database for audit trails
- **External tracing** — attach an OpenTelemetry exporter to `emit()`
- **Server-side tools** — move tool handlers to API routes for auth, rate limiting, and access to server-only resources
- **Multi-session** — support concurrent reviews, each with its own agent instance
- **Real CRM integration** — replace the simulated timeout with actual health checks

---

## Demo Script (5-Minute Walkthrough)

### 1. Context (30 seconds)

> "This is a voice agent that conducts a production-readiness review. Instead of a checklist, it has a conversation — asks one question at a time, records evidence, and grades each criterion. Let me show you."

Click **Start Conversation**. The orb animates as the agent speaks.

### 2. Discovery (2 minutes)

The agent introduces itself and begins asking about the first pillar (Latency & Turn-Taking). Answer naturally:

- **"What's your end-of-speech to first-audio latency?"** → "Around 250ms."
- The agent calls `update_readiness_item` → the Readiness Panel shows the criterion flip to **Ready** ✓
- **"How does it handle interruptions?"** → "We support barge-in with 200ms cutoff."
- Criterion flips to **Ready** ✓

Watch the **Session Metrics** panel — p50/p95 latency updates as you converse. The **Trace** panel shows speech detected, agent responses, and tool calls with timestamps.

### 3. Self-Measurement (1 minute)

The agent asks about tool calling and observability. Point out:

- **Session Metrics** — "The app is measuring itself while conducting the review. That p50 latency? That's the app's own performance being evaluated against the criteria it's assessing."
- **Trace** — "Every event — speech, tool call, state change — is timestamped and visible. This is the observability pillar being demonstrated in real time."

### 4. Failure Path (1 minute)

The agent calls `check_crm_health` to verify a dependency. It times out after 5 seconds.

- **Trace** — A `tool_failure` event appears with duration ≥4000ms
- **Session Metrics** — Tool failure count increments to 1, AlertOctagon icon turns red
- The agent marks the criterion as **Needs Validation** ? (not Needs Attention !)

> "Notice: the agent didn't mark it as broken. It said 'I couldn't verify this' — that's the distinction between Needs Validation and Needs Attention."

### 5. Report (30 seconds)

The agent calls `complete_assessment`. The **Readiness Report** panel renders a Markdown report grouped by state:

- **READY** — criteria with evidence
- **NEEDS VALIDATION** — criteria that couldn't be verified
- **NEEDS ATTENTION** — criteria with issues

Click **Export Markdown** to download the report.

> "No composite score. No percentage. Just: what's ready, what needs verification, what needs fixing — with evidence and next steps."

### 6. Code Review (optional)

- `lib/tools.ts` — the four tool handlers, all client-side
- `lib/useConversation.ts` — the ElevenLabs hook with tools, trace, and metrics wired
- `stores/` — four Zustand stores, tool handlers as the only writers
- `lib/report.ts` — pure function: state in, Markdown out
- `agent/prompt.md` — the agent's system prompt, version-controlled

---

## Project Structure

```
├── agent/
│   └── prompt.md              # Agent system prompt + tool schemas
├── app/
│   ├── globals.css            # Tailwind v4 theme tokens
│   ├── layout.tsx             # Fonts, favicon, metadata
│   └── page.tsx               # Single-screen layout
├── components/
│   ├── conversation-panel.tsx # Orb + transcript + start/end
│   ├── readiness-panel.tsx    # Pillars + criteria + status badges
│   ├── session-metrics.tsx     # p50/p95 latency, tool metrics
│   ├── trace-panel.tsx        # Timestamped event stream
│   ├── readiness-report.tsx  # Markdown report + export
│   ├── providers.tsx          # ConversationProvider wrapper
│   └── ui/                    # shadcn/ui + ElevenLabs UI (orb, conversation, message)
├── lib/
│   ├── criteria.ts            # Three pillars, nine criteria
│   ├── metrics.ts            # p50/p95 percentile computation
│   ├── report.ts             # Markdown report generation
│   ├── tools.ts              # Four client-side tool handlers
│   ├── types.ts              # Assessment, trace, metric types
│   └── useConversation.ts    # ElevenLabs hook wrapper
├── stores/
│   ├── assessment.ts          # Criteria map + status mutations
│   ├── metrics.ts             # Latency samples + tool durations
│   ├── session.ts             # Lifecycle + transcript
│   └── trace.ts               # Event list + emit() interface
├── __tests__/
│   ├── assessment.test.ts     # State transitions, no composite score
│   ├── metrics.test.ts        # p50/p95 edge cases
│   ├── report.test.ts         # State groupings, evidence, no score
│   └── e2e-flow.test.ts       # Full session simulation (8 tests)
└── docs/
    └── DESIGN.md              # Design system spec
```

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | Single-screen app, static output, Turbopack |
| Voice | @elevenlabs/react | Client-side tools, orb, conversation UI |
| State | Zustand | Writable from outside React, tool handlers as writers |
| Styling | Tailwind CSS v4 + shadcn/ui | Design system, semantic tokens |
| Animation | Three.js / React Three Fiber | Orb visualization |
| Tests | Vitest | Pure function testing (metrics, report, assessment) |
| Lint | Biome | Single tool, fast, zero config |

---

## Deploy

The app is a static Next.js build — no API routes, no server. Deploy to Vercel:

1. Connect the repository in Vercel
2. Add environment variables:
   - `ELEVENLABS_API_KEY`
   - `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`
3. Deploy

The production build (`pnpm build`) produces a static site with no server-side requirements.

---

## License

MIT

---

*An ishlabs Production*
