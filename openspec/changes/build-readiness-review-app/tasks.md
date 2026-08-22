## 1. Project Setup and Configuration

- [x] 1.1 Install dependencies (`@elevenlabs/react`, `zustand`, `vitest`) and verify `pnpm install` succeeds without errors
- [x] 1.2 Create `vitest.config.ts` with test environment and path aliases; verify `pnpm vitest run --config vitest.config.ts` executes (0 tests found is OK)
- [x] 1.3 Remove ESLint remnants (`eslint.config.mjs` and the `"lint": "eslint"` script in `package.json`); Biome is already configured in `biome.json` — verify `pnpm biome check .` runs
- [x] 1.4 Verify `@elevenlabs/react` SDK surface — client-tool registration API, conversation hook, UI component exports — against current ElevenLabs documentation; document the verified API shape in `agent/` notes
- [x] 1.5 Install ElevenLabs UI components via the `elevenlabs` CLI (orb, transcript, conversation primitives) into `components/ui/` (CLI installs to `components/ui/`, not `components/elevenlabs/`); verify components are imported from the CLI, not copied from source

## 2. Type Definitions and Criteria Data

- [x] 2.1 Create `lib/types.ts` with assessment types (Pillar, Criterion, CriterionState enum, AssessmentItem), trace event types (TraceEvent, EventType), and metric types (LatencySample, SessionMetrics); verify TypeScript compiles (`pnpm tsc --noEmit`)
- [x] 2.2 Create `lib/criteria.ts` with three pillars and 9–12 criteria defined in data (pillar key, criterion key, human-readable name, initial unevaluated state); verify the file exports 3 pillars with 3–4 criteria each

## 3. Zustand State Stores

- [x] 3.1 Create `stores/assessment.ts` with assessment state (criteria map, updateReadinessItem, getAssessmentState, completeAssessment); verify the store initializes all criteria as unevaluated and mutations update state
- [x] 3.2 Create `stores/trace.ts` with a single `emit(event)` emission interface and trace event list; verify events appended through `emit()` appear in the trace store
- [x] 3.3 Create `stores/metrics.ts` with latency samples, tool durations, and failure count; verify the store starts empty and accepts new samples
- [x] 3.4 Create `stores/session.ts` with session lifecycle state (idle, active, ended) and conversation metadata; verify the store transitions between states

## 4. Client Tool Handlers

- [x] 4.1 Create `lib/tools.ts` with `update_readiness_item` handler that mutates the assessment store and returns a confirmation; verify calling it with valid pillar/criterion/status updates the assessment store and emits a trace event
- [x] 4.2 Add `get_assessment_state` handler that returns evaluated, remaining, ready, needs_validation, and needs_attention counts from the assessment store; verify the return shape matches the spec
- [x] 4.3 Add `complete_assessment` handler that marks the review complete and triggers report generation; verify it sets a completion flag in the assessment store
- [x] 4.4 Add `check_crm_health` handler that always returns a timeout after a delay; verify it emits a tool failure trace event and returns a timeout result

## 5. Metrics and Report Logic

- [x] 5.1 Create `lib/metrics.ts` with p50 and p95 percentile computation from a sorted sample array; verify with known inputs (e.g., [100, 200, 300, 400, 500] → p50=300, p95=500)
- [x] 5.2 Create `lib/report.ts` as a pure function taking assessment state and returning a Markdown string grouped by state with evidence and next steps; verify output contains state groupings (READY, NEEDS VALIDATION, NEEDS ATTENTION) and no composite score

## 6. Agent Prompt and Tool Schemas

- [x] 6.1 Create `agent/prompt.md` with the agent system prompt (Solutions Engineer persona, one-question-at-a-time, contextual follow-ups, no fabrication, periodic summaries) and tool schema definitions for all four tools; verify the file is version controlled and contains all four tool definitions

## 7. ElevenLabs Voice Integration

- [x] 7.1 Create the ElevenLabs conversation hook/config that registers the four client tools and manages conversation lifecycle (start, end, listening/speaking state); verify the hook initializes with `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` and registers all four tools
- [x] 7.2 Wire conversation events (speech detected, transcript, agent response, first audio) to the trace store and metrics store; verify events flow through the single `emit()` interface and latency samples reach the metrics store

## 8. UI Panel Components

- [x] 8.1 Create `components/conversation-panel.tsx` with start/end controls, agent state indicator, and live transcript; verify it renders conversation state from the session store and transcript updates in real time
- [x] 8.2 Create `components/readiness-panel.tsx` displaying three pillars with per-criterion status; verify it updates immediately when the assessment store changes (subscribe to store, re-render on mutation)
- [x] 8.3 Create `components/session-metrics.tsx` showing p50/p95 end-of-speech to first audio, tool duration p50, and tool failure count; verify it updates live as the metrics store receives new samples
- [x] 8.4 Create `components/trace-panel.tsx` rendering timestamped events with durations and visually distinct tool-call events; verify tool calls are styled differently from conversation events
- [x] 8.5 Create `components/readiness-report.tsx` rendering the Markdown report with a Markdown export control; verify it renders on `complete_assessment` and the export downloads a `.md` file

## 9. Single Screen Layout

- [x] 9.1 Update `app/page.tsx` to compose all four panels (Conversation, Production Readiness, Session Metrics, Trace) on a single screen with no navigation; verify all panels are visible simultaneously without scrolling or tab switching
- [x] 9.2 Position the Session Metrics panel so latency measurements are visible while the agent asks the corresponding question; verify the layout keeps metrics and conversation side-by-side

## 10. Tests

- [x] 10.1 Create `__tests__/assessment.test.ts` testing the assessment reducer — state transitions (Ready, Needs Validation, Needs Attention), no composite score, unknown criterion rejection; verify `pnpm vitest run __tests__/assessment.test.ts` passes
- [x] 10.2 Create `__tests__/metrics.test.ts` testing percentile computation (p50, p95) with edge cases (empty, single sample, even/odd count); verify `pnpm vitest run __tests__/metrics.test.ts` passes
- [x] 10.3 Create `__tests__/report.test.ts` testing report generation — state groupings, evidence in each finding, next steps present, no composite score; verify `pnpm vitest run __tests__/report.test.ts` passes

## 11. Quality Gates and Verification

- [x] 11.1 Run `pnpm test` and verify all tests pass (assessment, metrics, report)
- [x] 11.2 Run `pnpm biome check .` and verify it passes with no errors
- [x] 11.3 Run `pnpm build` and verify the production build succeeds without errors
- [x] 11.4 Run `pnpm dev` with only `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` set and verify the app starts, a conversation can begin, and the agent responds
- [x] 11.5 Verify no secrets are committed and `.env.example` documents all required environment variables

## 12. End-to-End Demo Verification

- [x] 12.1 Run a full review session and verify all three assessment states are reachable (Ready, Needs Validation, Needs Attention)
- [x] 12.2 Verify `check_crm_health` times out and the agent handles it without breaking — criterion is set to Needs Validation, not Needs Attention, and the conversation continues
- [x] 12.3 Verify `complete_assessment` renders a report grouped by state with evidence and next steps, and the Markdown export downloads correctly
- [x] 12.4 Verify the trace shows conversation events, tool calls, results, and state changes with timestamps and durations
- [x] 12.5 Verify session metrics show p50/p95 end-of-speech to first audio updating live during the conversation
- [x] 12.6 Verify no composite percentage appears anywhere in the UI or report

## 13. Design System Polish

_Defer until the app is functionally working end-to-end (Groups 1–12). Apply the `docs/DESIGN.md` design system to make it look right._

- [ ] 13.1 Refactor `app/globals.css` from default shadcn neutral palette to the `docs/DESIGN.md` palette — replace `:root` and `.dark` color values with #111111 background, #F7F7F5 foreground, #B6B6B5 muted, #8A2BE2 primary, #00FF9C accent, #353534 border; verify colors render in the browser
- [ ] 13.2 Load Elms Sans and Fragment Mono fonts via `<link>` tags in `app/layout.tsx` (not CSS @import); map `--font-heading` to Elms Sans and `--font-sans`/`--font-body` to Fragment Mono in the Tailwind theme; verify headings render in Elms Sans and body in Fragment Mono
- [ ] 13.3 Install Feather Icons (`react-feather`) and remove `lucide-react`; update `components.json` icon library setting; verify a Feather icon renders and no Lucide imports remain
- [ ] 13.4 Ensure the three assessment states (Ready ✓, Needs Validation ?, Needs Attention !) are visually distinct using the DESIGN.md palette — verify each state has a distinct icon (Feather) and/or color in the readiness panel
- [ ] 13.5 Re-run `pnpm build` and verify the production build still succeeds after design system changes

## 14. Deployment and Documentation

- [ ] 13.1 Deploy to Vercel and verify the public URL is accessible and the app functions (conversation starts, agent responds)
- [ ] 13.2 Write `README.md` covering the problem, architecture, ElevenLabs integration, tool design, assessment model, observability, and how to run; verify it explains the argument in under 5 minutes of reading
- [ ] 13.3 Add a Design Decisions and Trade-offs section to the README (why three states instead of a score, why client-side tools instead of webhooks, what was cut and why, what changes at production scale); verify the section is present and substantive
- [ ] 13.4 Add the demo script (the repeatable 5-minute walkthrough) to the README; verify it covers context, discovery, self-measurement, failure path, report, and code review
