## Purpose

Composes the single-screen interface that renders the conversation, readiness panel, session metrics, and trace — driven reactively by Zustand stores so tool-call mutations propagate immediately to all panels.

## ADDED Requirements

### Requirement: Single screen with no navigation
The application SHALL present a single screen with no navigation elements. All four panels SHALL be visible simultaneously without tab switching or page transitions.

#### Scenario: All panels visible at once
- **WHEN** the application loads
- **THEN** the Conversation, Production Readiness, Session Metrics, and Trace panels are all visible on the same screen

### Requirement: Production Readiness panel
The Production Readiness panel SHALL persistently display the three pillars with per-criterion status. It SHALL update immediately as tool calls land — no manual refresh required.

#### Scenario: Panel updates on tool call
- **WHEN** the agent calls `update_readiness_item` and mutates assessment state
- **THEN** the Production Readiness panel reflects the new criterion status immediately

### Requirement: Three states visually distinct
The three assessment states (Ready, Needs Validation, Needs Attention) SHALL be visually distinct in the readiness panel — using different icons, colors, or both so a reviewer can scan status at a glance.

#### Scenario: States distinguishable
- **WHEN** the readiness panel shows criteria in different states
- **THEN** Ready, Needs Validation, and Needs Attention criteria each have a distinct visual indicator

### Requirement: Session Metrics panel positioned for simultaneous viewing
The Session Metrics panel SHALL sit where a reviewer sees it while the agent asks the corresponding question. The layout SHALL ensure that latency measurements are visible during the latency discussion.

#### Scenario: Metrics visible during latency discussion
- **WHEN** the agent is asking about end-of-speech to first-audio latency
- **THEN** the Session Metrics panel with the current session's p50/p95 is visible on screen without scrolling or navigation

### Requirement: Trace panel is developer-facing
The Trace panel SHALL present a developer-facing event stream with timestamps and durations. It SHALL be scannable, with tool-call events visually distinct from conversation events.

#### Scenario: Developer scans trace during conversation
- **WHEN** a reviewer looks at the trace panel during an active conversation
- **THEN** they see timestamped events in chronological order with tool calls distinguishable from speech and transcript events

### Requirement: Zustand-driven reactivity
All panels SHALL react to Zustand store mutations. Tool handlers SHALL be the only writers to the assessment, trace, metrics, and session stores. UI components SHALL read from stores and re-render on state change.

#### Scenario: Panel re-renders on store mutation
- **WHEN** a tool handler writes to the assessment store
- **THEN** all UI components subscribed to that store re-render to reflect the updated state without requiring explicit event dispatching

### Requirement: Agent prompt and tool schemas version controlled
The agent system prompt and tool schemas SHALL be version controlled under the `agent/` directory in the repository, not solely in the ElevenLabs dashboard.

#### Scenario: Prompt reviewed in repo
- **WHEN** a reviewer opens the `agent/` directory
- **THEN** they find the agent system prompt and tool schema definitions tracked in version control
