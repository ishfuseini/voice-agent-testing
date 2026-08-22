# PRD — ElevenLabs Voice Agent Production Readiness Review

## 1. Summary

An ElevenLabs voice agent that conducts a production-readiness review of a voice-agent deployment — conversationally, not as a checklist read aloud.

The agent interviews the user across three readiness pillars, follows up when answers are incomplete, records structured evidence through tool calls, and produces an actionable readiness report. A live execution trace exposes the conversation, tool calls, state changes, and timing underneath.

The application **instruments itself against the same criteria it evaluates**. While the agent asks whether the user measures end-of-speech to first-audio latency, a panel beside the conversation displays that measurement for the session currently running.

**One-liner:** A voice agent that assesses voice-agent production readiness, records findings through ElevenLabs tool calls, and holds itself to the standard it is measuring.

---

## 2. Why This Exists

Enterprise teams build compelling voice-agent prototypes quickly. Moving them into production surfaces a different set of concerns — latency and turn-taking, reliable tool execution, observability and failure handling.

These are usually assessed through documents, architecture reviews, and manually maintained checklists. That makes readiness assessment static even though the system being evaluated is inherently conversational.

A voice agent should be able to conduct that assessment itself, and should be able to demonstrate its own readiness while doing so.

The intended reviewer experience:

- **30 seconds:** Understand what the demo is arguing.
- **5 minutes:** See conversation, tool calls, state updates, a failure path, and self-measurement working.
- **15+ minutes:** Open the code and discuss agent design, tool surface, state model, and trade-offs.

---

## 3. Target Users

**Primary:** Enterprise Solutions Engineers, Solutions Architects, Customer Success Engineers.

**Secondary:** Engineering leads, product managers, and technical stakeholders evaluating voice-agent deployments.

---

## 4. Core Experience

The user starts a voice conversation. The agent introduces the review and begins asking about the deployment.

> **Agent:** Let's review your voice deployment. What channel are you deploying to — web, mobile, or telephony?

> **User:** Telephony.

The agent uses that to shape follow-ups.

> **Agent:** Are you currently measuring the time between the caller finishing their sentence and hearing the first agent audio?

> **User:** We're usually around two seconds.

The agent records evidence via a tool call. The readiness panel updates immediately:

**Latency & Turn-Taking → Needs Attention**

Meanwhile the metrics panel shows the same measurement for the conversation currently happening:

```text
This session — end-of-speech → first audio
p50  412ms    p95  680ms    n=7
```

The experience should feel like an architecture review conducted through conversation, not a questionnaire being read aloud.

---

## 5. Readiness Pillars

Three pillars, three to four criteria each, for **9–12 total criteria** — sized so a full review completes in 5–10 minutes at roughly 40 seconds per criterion including follow-ups.

### Latency & Turn-Taking

- End-of-speech to first-audio latency
- Interruption and barge-in behavior
- Silence and turn-detection behavior

### Tool Calling & Grounding

- Tool success and failure behavior
- Timeouts and retries
- Grounding responses in tool results

### Observability & Monitoring

- Conversation and request tracing
- Tool-call visibility
- Error and latency monitoring

### Deferred Pillars

**Audio Quality & Consistency** and **Security & Governance** are out of scope for v1.

These three are the most voice-specific, they exercise the failure path in §8, and they map directly onto what the trace panel can show. Audio quality is hard to assess conversationally without the user having prior measurements. Security and governance apply to any enterprise system rather than demonstrating voice-agent thinking specifically.

Pillar definitions live in data, so adding a pillar later is a config change, not a rewrite.

---

## 6. Assessment Model

Each criterion holds one of three states.

**Ready** — the conversation produced sufficient evidence the criterion is addressed.

**Needs Validation** — the user cannot currently provide enough information to determine readiness. *"We haven't measured that yet."*

**Needs Attention** — the conversation identified a known gap, failure, or unresolved production risk.

Distinguishing **missing evidence** from an **identified problem** is the core of this model. They demand different actions and must not collapse into a single "failed" bucket.

### No Composite Score

The application does **not** produce a readiness percentage.

A percentage requires collapsing three states onto one axis, which destroys the distinction the model exists to make. There is no defensible weighting for "we haven't measured it" versus "we measured it and it's broken."

State is always reported as counts:

```text
6 Ready · 3 Needs Validation · 2 Needs Attention · 1 Unevaluated
```

---

## 7. Agent Behavior

The agent should behave like an experienced Solutions Engineer running technical discovery, not a form reader.

It should:

- Ask one clear question at a time.
- Use previous answers to shape follow-ups.
- Avoid re-asking what has already been answered.
- Ask for measurable evidence where appropriate.
- Explain why a question matters when that helps.
- Recognize when the user doesn't know an answer, and move on.
- Never invent deployment information.
- Summarize findings periodically.

The full review should be demonstrable in **5–10 minutes**.

---

## 8. Tools

The agent interacts with the application through client-side tools that execute in the browser and mutate application state directly.

### `update_readiness_item`

Records evidence discovered during conversation.

```json
{
  "pillar": "latency",
  "criterion": "response_latency",
  "status": "needs_attention",
  "evidence": "User reports approximately two seconds between speech completion and agent response.",
  "recommendation": "Instrument end-of-speech to first-audio latency and identify the largest contributor."
}
```

### `get_assessment_state`

Returns current state so the agent knows what has been covered.

```json
{
  "evaluated": 7,
  "remaining": 4,
  "ready": 4,
  "needs_validation": 2,
  "needs_attention": 1
}
```

### `complete_assessment`

Ends the review and triggers report generation.

### `check_crm_health`

Simulated dependency check. Always returns a timeout — see §9.

The tool surface stays deliberately small. The goal is to demonstrate effective ElevenLabs tool calling, not to build a backend.

---

## 9. Failure Path

The demo includes one controlled failure. The agent calls `check_crm_health()`, which times out.

The agent should:

1. Recognize the integration could not be verified.
2. Explain the result conversationally.
3. Update the appropriate criterion.
4. Continue without breaking the conversation.

> **Agent:** I couldn't verify the CRM integration — the request timed out. I'll mark integration reliability as needing validation rather than assuming it's broken.

The distinction the agent draws here — timeout means *unverified*, not *broken* — is the same distinction the assessment model makes in §6. The failure path should make that connection explicit.

---

## 10. Interface

Single screen. No navigation.

```text
┌────────────────────────────────┬──────────────────────────┐
│  Conversation                  │  Production Readiness    │
│                                │                          │
│  [ orb / agent state ]         │  Latency & Turn-Taking   │
│                                │    ✓ Barge-in handling   │
│  Live transcript               │    ! Response latency    │
│                                │    ○ Turn detection      │
│                                │                          │
│                                │  Tool Calling            │
│                                │    ? CRM reliability     │
│                                │    ○ Timeout behavior    │
│  [ Start review ]              │    ○ Result grounding    │
│                                │                          │
├────────────────────────────────┤  Observability           │
│  This session                  │    ○ Conversation trace  │
│   speech → audio  p50 412ms    │    ○ Tool-call visibility│
│                   p95 680ms    │    ○ Failure alerting    │
│   tool duration   p50  71ms    │                          │
│   tool failures        1       │  2 Ready · 1 Validation  │
├────────────────────────────────┤  1 Attention · 8 Pending │
│  Trace                         │                          │
│  12:03:02.104 speech detected  │                          │
│  12:03:02.981 transcript done  │                          │
│  12:03:03.198 update_readiness │  71ms                    │
│  12:03:03.412 first audio      │  →431ms                  │
└────────────────────────────────┴──────────────────────────┘
```

### Conversation

Start/end controls, agent listening/speaking state, live transcript.

### Production Readiness

Persistent panel, three pillars with per-criterion status. Updates as tool calls land.

### Session Metrics

Live percentiles for the criteria the agent is asking about. This is the demo's central argument made concrete — the system visibly meets, or fails to meet, the standard it evaluates. It must sit where a reviewer sees it *while* the agent asks the corresponding question.

### Trace

Developer-facing event stream with timestamps and durations. Tool-call events are visually distinct so they're scannable.

---

## 11. Observability

Traced events: conversation start/end, user speech, transcript completion, agent responses, tool calls, tool results, tool failures, assessment state changes, latency measurements.

**The in-app trace is the observability deliverable.** External tracing is deferred — it demonstrates the same capability somewhere a reviewer cannot see during a five-minute demo.

Events emit through a single interface so an external sink can attach later without touching call sites.

---

## 12. Report

On `complete_assessment`, the app renders a report grouped by state.

```text
Production Readiness Review
Financial services · telephony · customer support

READY (4)
  ✓ Barge-in handling
      Agent supports interruption; user confirmed tested under load.

NEEDS VALIDATION (3)
  ? P95 end-to-end latency
      User reports ~2s typical, no percentile instrumentation.
      → Instrument end-of-speech to first-audio; establish p95 baseline.
  ? CRM integration reliability
      Health check timed out during review; status unverified.
      → Re-run check; add synthetic monitoring for the dependency.

NEEDS ATTENTION (2)
  ! Alerting for failed tool calls
      No alerting configured; failures found via user reports.
      → Add alerting on tool error rate before production traffic.
```

Every finding carries the evidence gathered plus a concrete next step. The report prioritizes **actionable next steps**, not a score.

Markdown export. PDF is deferred.

---

## 13. Architecture

```text
┌──────────────────────────────────────────┐
│              Next.js (client)            │
│                                          │
│  ElevenLabs UI components                │
│  Conversation │ Readiness │ Trace │ Metrics
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│           Zustand stores                 │
│                                          │
│  assessment · trace · metrics · session  │
│  (tool handlers are the only writers)    │
└──────────────┬───────────────────────────┘
               │  client tools
               ▼
┌──────────────────────────────────────────┐
│              ElevenLabs                  │
│                                          │
│  Agents · voice · tool calling           │
└──────────────────────────────────────────┘
```

**Client-side tools, no backend.** Tool calls execute in the browser and mutate Zustand directly. This removes the need for a server, removes tunneling during local development, and makes tool-call latency real and observable rather than a network round trip to a demo server.

An API route can be added later if a server-side tool becomes worth demonstrating. It is not needed for v1.

Verify current `@elevenlabs/react` SDK surface and client-tool registration against ElevenLabs documentation before building.

---

## 14. Stack

| Layer | Choice | Purpose |
|---|---|---|
| Framework | Next.js (App Router) | Matches every ElevenLabs code sample and component; deploys in minutes |
| Language | TypeScript | Assessment state and tool payloads benefit from real types |
| Voice | ElevenLabs Agents | The conversational core |
| Components | ElevenLabs UI | Official library — orb, transcript, conversation primitives |
| Primitives | shadcn/ui | What ElevenLabs UI is built on |
| Styling | Tailwind CSS v4 | Design tokens in `globals.css` |
| State | Zustand | Small, writable from outside React tree, live devtools timeline |
| Tests | Vitest | Assessment reducer, percentile math, report generation |
| Lint/format | Biome | One tool, no ESLint/Prettier split |
| Deploy | Vercel | Live URL to share ahead of a walkthrough |

Install components via the ElevenLabs CLI rather than copying source, so the repo reflects the real customer path.

No router library (single screen), no backend service, no ORM, no external tracing in v1.

---

## 15. Repo Layout

```text
elevenlabs-readiness-review/
├── README.md
├── biome.json
├── vitest.config.ts
├── .env.example              # NEXT_PUBLIC_ELEVENLABS_AGENT_ID
│
├── app/
│   ├── globals.css           # design tokens
│   ├── layout.tsx
│   └── page.tsx              # the single screen
│
├── components/
│   ├── ui/                   # shadcn primitives
│   ├── elevenlabs/           # ElevenLabs UI components
│   ├── conversation-panel.tsx
│   ├── readiness-panel.tsx
│   ├── session-metrics.tsx
│   ├── trace-panel.tsx
│   └── readiness-report.tsx
│
├── lib/
│   ├── criteria.ts           # pillar + criterion definitions (data)
│   ├── tools.ts              # client tool handlers
│   ├── metrics.ts            # percentile computation
│   ├── report.ts             # state → markdown
│   └── types.ts
│
├── stores/
│   ├── assessment.ts
│   ├── trace.ts
│   ├── metrics.ts
│   └── session.ts
│
├── agent/
│   └── prompt.md             # agent system prompt + tool schemas, version controlled
│
└── __tests__/
    ├── assessment.test.ts
    ├── metrics.test.ts
    └── report.test.ts
```

The agent prompt lives in the repo, not only in the ElevenLabs dashboard. Prompt design is part of the work being demonstrated and should be reviewable.

---

## 16. Demo Scenario

One fixed scenario so the walkthrough is repeatable.

**Customer:** Financial services company deploying a customer-support voice agent over telephony.

- Production telephony deployment
- CRM integration that occasionally times out
- Authentication requirement
- Some latency measurements, no percentiles
- No tool-failure monitoring
- Data retention policy defined

This exercises normal conversation, follow-ups, tool calls, all three states, the failure path, and report generation.

---

## 17. Walkthrough

Target: five minutes.

**0:00–0:30 — Context.** What the demo argues: a readiness review should be conversational, and the system running it should meet its own bar.

**0:30–2:00 — Discovery.** Start the review. Show contextual follow-ups, tool calls landing, readiness panel updating, trace filling in.

**2:00–2:45 — Self-measurement.** Point at the metrics panel while the agent asks about latency. This is the moment the demo makes its argument.

**2:45–3:30 — Failure path.** `check_crm_health` times out. Agent marks it *unverified*, not *broken*, and continues.

**3:30–4:15 — Report.** Complete the assessment. Walk the three groupings and the recommendations.

**4:15–5:00 — Code.** Open `lib/tools.ts`, `stores/assessment.ts`, `agent/prompt.md`.

Desired impression: *this person understands what it takes to run a voice agent in production, and can build the thing that says so.*

---

## 18. Acceptance Criteria

- [ ] `pnpm dev` runs the app with only `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` set.
- [ ] A user can start a voice conversation and hear the agent respond.
- [ ] Live transcript renders as the conversation progresses.
- [ ] The agent asks contextual follow-ups, not a fixed question order.
- [ ] `update_readiness_item` mutates state and the readiness panel updates visibly.
- [ ] All three states are reachable in a single review.
- [ ] Ready, Needs Validation, and Needs Attention are visually distinct.
- [ ] No composite percentage appears anywhere in the UI or report.
- [ ] `check_crm_health` times out and the agent handles it without breaking.
- [ ] The timeout results in Needs Validation, not Needs Attention.
- [ ] Trace shows conversation events, tool calls, results, and state changes with timing.
- [ ] Session metrics show p50/p95 end-of-speech to first audio, updating live.
- [ ] `complete_assessment` renders a report grouped by state with evidence and next steps.
- [ ] Report exports as Markdown.
- [ ] Agent prompt and tool schemas are version controlled under `agent/`.
- [ ] `pnpm test` passes — assessment reducer, percentile math, report generation.
- [ ] `pnpm biome check .` passes.
- [ ] No secrets committed; `.env.example` documents all variables.
- [ ] Deployed to a public URL.
- [ ] README explains the argument in under five minutes of reading.

---

## 19. Risks

**Agent conversational quality.** The difference between "experienced SE" and "form reader" lives entirely in the prompt. Budget real iteration time here — it is the highest-leverage and least predictable part of the build.

**Review length drift.** Follow-ups eat time faster than expected. Validate the 5–10 minute target against a real conversation early; cut criteria if it runs long.

**Live dependency during a walkthrough.** The demo requires a working network and ElevenLabs availability. Have a recent Markdown report and a screenshot on hand as a fallback answer, not as a feature.

**Client tool latency.** Tool handlers run in the browser and block the agent's turn. Keep them synchronous and trivial; the simulated timeout should be the only slow one.

**Scope creep via components.** ElevenLabs UI ships many components. Use the few the screen needs.

---

## 20. Scope

### In Scope

Voice conversation · three pillars, 9–12 criteria · contextual follow-ups · client-side tool calls · live transcript · readiness panel · execution trace · session self-measurement · controlled failure path · report with Markdown export · deployed URL.

### Deferred

Audio Quality pillar · Security & Governance pillar · external tracing · PDF export · server-side tools.

### Out of Scope

User accounts · persistence · RAG · multi-agent orchestration · real CRM integration · automated remediation · a production platform.

---

## 21. Deliverables

**Application** — deployed and runnable locally.

**README** — problem, architecture, ElevenLabs integration, tool design, assessment model, observability, how to run.

Plus a **Design Decisions and Trade-offs** section: why three states instead of a score, why client-side tools instead of webhooks, what was cut and why, what changes at production scale. This section is what distinguishes a working demo from evidence of engineering judgment.

**Architecture diagram** — User → ElevenLabs Agent → Client Tools → State → Trace.

**Demo script** — the repeatable five-minute walkthrough from §17.

---

## 22. Design Principle

**The checklist is the rubric. The conversation is the product.**

This should not feel like a checklist with voice controls attached. The agent is the primary interface; the panels exist to make its reasoning and resulting state visible.

The system holds itself to the standard it is measuring.
