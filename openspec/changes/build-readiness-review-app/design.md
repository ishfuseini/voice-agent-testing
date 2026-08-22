## Context

The project is a Next.js 16 (App Router) scaffold with React 19, Tailwind CSS v4, Biome, and shadcn/ui already installed. The ElevenLabs CLI (v0.5.6) is installed globally and has scaffolded config files (`agents.json`, `tools.json`, `tests.json`, and `agent_configs/`, `tool_configs/`, `test_configs/` directories). The application has no existing business logic — only `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, a button component, and `lib/utils.ts`. The PRD (`docs/PRD.md`) defines the full product vision and `docs/DESIGN.md` specifies the complete design system (fonts, colors, icons, component rules). See `proposal.md` for why this change exists and `specs/` for the behavior contract.

The current `globals.css` is the default shadcn neutral palette (oklch grays, system fonts, Lucide icons). It needs refactoring to match `docs/DESIGN.md`, which specifies: Elms Sans for headings, Fragment Mono for body, a dark color palette (#111111 background, #F7F7F5 foreground, #8A2BE2 primary, #00FF9C accent, #353534 border), and Feather Icons (replacing Lucide).

The key constraint shaping this design: **client-side tools, no backend.** Tool calls execute in the browser and mutate state directly. This removes the need for a server, avoids tunneling during local development, and makes tool-call latency real and observable rather than a network round trip to a demo server.

## Goals / Non-Goals

**Goals:**
- Build a single-screen voice agent application that instruments itself against the same criteria it evaluates
- Make tool-call mutations propagate to all panels through Zustand stores with tool handlers as the only writers
- Ensure the in-app trace is the observability deliverable — no external tracing in v1
- Keep the agent prompt and tool schemas version-controlled in the repo
- Make the demo repeatable in 5–10 minutes with a controlled failure path

**Non-Goals:**
- No backend service, API routes, or ORM
- No router library (single screen only)
- No external tracing integration (deferred)
- No PDF export (Markdown only)
- No user accounts, persistence, RAG, or multi-agent orchestration
- No real CRM integration (simulated timeout only)

## Decisions

### Decision 1: Zustand as the sole state layer

**Choice:** Four Zustand stores — `assessment`, `trace`, `metrics`, `session` — with tool handlers as the only writers.

**Rationale:** Zustand is small, writable from outside the React tree (critical for tool handlers that are not React components), and has a live devtools timeline that aids debugging. The PRD explicitly calls out that "tool handlers are the only writers" — Zustand's vanilla store API makes this boundary natural.

**Alternatives considered:**
- *React Context + useReducer:* Would require dispatching from within React's tree, awkward for ElevenLabs tool handlers that execute outside React's render cycle. Also harder to inspect at runtime.
- *Redux Toolkit:* Heavier than needed for this scope, more boilerboard.

### Decision 2: Client-side tools via ElevenLabs React SDK

**Choice:** Register the four tools (`update_readiness_item`, `get_assessment_state`, `complete_assessment`, `check_crm_health`) as client-side tools through `@elevenlabs/react`. Tool handlers execute in the browser, mutate Zustand stores directly, and return results synchronously to the agent.

**Rationale:** The PRD specifies "client-side tools, no backend." This eliminates the need for a server, removes ngrok/tunneling during local development, and makes tool-call latency real and observable in the trace panel. The simulated timeout in `check_crm_health` is the only intentionally slow tool.

**Alternatives considered:**
- *Server-side webhooks:* Would require a running server, tunneling for local dev, and would add network latency that obscures the real tool execution time. Goes against the demo's argument.

### Decision 3: Criteria and pillars defined in data (`lib/criteria.ts`)

**Choice:** Pillar and criterion definitions live in a typed data module, not hardcoded in component or agent logic. Adding a pillar is a configuration change.

**Rationale:** The PRD explicitly requires that "pillar definitions live in data, so adding a pillar later is a config change, not a rewrite." TypeScript types ensure the agent's tool calls reference valid criterion keys.

### Decision 4: Single emission interface for trace events

**Choice:** All trace events flow through a single `emit(event)` function. The trace store subscribes to this function. External sinks can attach later by subscribing to the same interface without modifying call sites.

**Rationale:** The PRD requires that "events emit through a single interface so an external sink can attach later without touching call sites." This is a deliberate seam for the deferred external-tracing pillar.

### Decision 5: Percentile computation in `lib/metrics.ts`

**Choice:** p50 and p95 computed from a running sample of latency measurements using a simple sorted-array approach. No streaming percentile algorithm (t-digest, P²) needed — session sample sizes are small (tens of turns).

**Rationale:** For a 5–10 minute demo session with ~10–20 conversational turns, the sample size is small enough that sorting the full array each update is trivially fast. Streaming algorithms add complexity without measurable benefit at this scale.

### Decision 6: Report generation from assessment state (`lib/report.ts`)

**Choice:** A pure function takes the assessment store state and produces a Markdown string grouped by state with evidence and next steps. No templating engine — string concatenation with clear structure.

**Rationale:** The report is a pure transformation of assessment state to Markdown. Keeping it a pure function makes it trivially testable (input state → expected Markdown string) and decoupled from React rendering.

### Decision 7: Agent prompt version-controlled in `agent/prompt.md`

**Choice:** The agent system prompt and tool schema definitions live in the repo under `agent/`. The prompt is the product of design iteration and should be reviewable alongside the code.

**Rationale:** The PRD states "prompt design is part of the work being demonstrated and should be reviewable." The prompt is the highest-leverage, least predictable part of the build — keeping it in the repo makes iteration visible.

### Decision 8: Biome for lint/format, Vitest for tests

**Choice:** Biome (already installed and configured in `biome.json`) replaces ESLint for a single-tool lint/format workflow. The ESLint config file and lint script are the only remnants to remove. Vitest for testing the assessment reducer, percentile math, and report generation — pure logic that benefits from unit tests.

**Rationale:** The PRD specifies both. Biome's single-config approach reduces tooling complexity. Vitest is the natural choice for testing pure functions in a Vite-aware environment.

### Decision 9: Design system from `docs/DESIGN.md`

**Choice:** Implement the design system specified in `docs/DESIGN.md` — Elms Sans (headings), Fragment Mono (body), dark palette (#111111/#F7F7F5/#8A2BE2/#00FF9C/#353534), and Feather Icons. Fonts loaded via `<link>` tags in `app/layout.tsx` (not CSS @import — Tailwind v4/Lightning CSS cannot resolve remote @import URLs). Colors mapped to shadcn semantic tokens (primary → #8A2BE2, foreground → #F7F7F5, muted → #B6B6B5, border → #353534) so shadcn components inherit the palette.

**Rationale:** The design system is pre-specified and provides a cohesive visual identity distinct from default shadcn. Mapping custom colors to shadcn's semantic token system lets shadcn components adopt the palette without per-component overrides.

**Alternatives considered:**
- *Default shadcn neutral palette:* Functional but generic — doesn't serve the demo's argument about engineering judgment.
- *Custom palette without a spec:* Ad-hoc decisions would be inconsistent and harder to maintain.

**Trade-offs:**
- Feather Icons replaces Lucide (shadcn's default icon library via `lucide-react`). shadcn components that import Lucide internally will need icon replacement as they are installed.
- The current `globals.css` uses oklch neutral values and light/dark variants. DESIGN.md specifies a single dark palette — the refactor replaces both `:root` and `.dark` with the DESIGN.md palette.
- `components.json` currently sets `"iconLibrary": "lucide"` — this should be updated or the Lucide dependency removed after Feather Icons is installed.

## Risks / Trade-offs

- **Agent conversational quality** → The difference between "experienced SE" and "form reader" lives in the prompt. Budget real iteration time. This is the highest-leverage and least predictable part. Mitigation: version-control the prompt, iterate early, test with real conversations.

- **Review length drift** → Follow-ups eat time faster than expected. Mitigation: validate the 5–10 minute target against a real conversation early; cut criteria if it runs long. Criteria count (9–12) is configurable.

- **Live dependency during walkthrough** → The demo requires network and ElevenLabs availability. Mitigation: have a recent Markdown report and screenshot on hand as a fallback answer, not as a feature.

- **Client tool latency** → Tool handlers run in the browser and could block the agent's turn. Mitigation: keep handlers synchronous and trivial; the simulated timeout in `check_crm_health` is the only intentionally slow one.

- **ElevenLabs SDK surface changes** → The `@elevenlabs/react` SDK API may differ from expectations. Mitigation: verify current SDK surface and client-tool registration against ElevenLabs documentation before building.

- **No persistence** → Session state is lost on refresh. This is acceptable for v1 (persistence is out of scope) but means a demo must complete in one session.
