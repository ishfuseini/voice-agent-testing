## Purpose

Provides a timestamped event stream that exposes conversation events, tool calls, state changes, and timing underneath the session — the in-app observability deliverable that makes the agent's reasoning and resulting state visible.

## ADDED Requirements

### Requirement: Traced event types
The system SHALL trace and display the following event types during a session: conversation start, conversation end, user speech detected, transcript completion, agent responses, tool calls, tool results, tool failures, assessment state changes, and latency measurements.

#### Scenario: User speech event traced
- **WHEN** the user speaks during the conversation
- **THEN** a "speech detected" event is added to the trace stream with a timestamp

#### Scenario: Tool call event traced
- **WHEN** the agent invokes a client tool
- **THEN** a tool call event is added to the trace with a timestamp and the tool name

#### Scenario: State change event traced
- **WHEN** a tool handler mutates the assessment state
- **THEN** an assessment state change event is added to the trace identifying the criterion and new state

### Requirement: Timestamps on all events
Every trace event SHALL carry a timestamp. Latency-sensitive events (tool calls, speech detection, first audio) SHALL also carry duration where applicable.

#### Scenario: Tool call has timestamp and duration
- **WHEN** a tool call event and its result are traced
- **THEN** both events carry timestamps and the duration between them is computable from the trace

### Requirement: Tool-call events visually distinct
Tool-call events SHALL be visually distinct from conversation events in the trace panel so they are scannable by a developer reviewing the stream.

#### Scenario: Tool call stands out
- **WHEN** the trace panel renders a tool call event
- **THEN** it is styled differently from speech and transcript events (e.g., different color, icon, or border)

### Requirement: Single emission interface
All trace events SHALL be emitted through a single interface so an external sink can attach later without modifying call sites.

#### Scenario: External sink attaches
- **WHEN** an external tracing system is connected to the emission interface
- **THEN** it receives all trace events without requiring changes to the code that emits them
