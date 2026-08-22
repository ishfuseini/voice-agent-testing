## Purpose

Computes and displays live latency percentiles for the current session so the application visibly measures itself against the criteria it evaluates — the demo's central argument made concrete.

## ADDED Requirements

### Requirement: End-of-speech to first-audio percentiles
The system SHALL compute p50 and p95 percentiles for end-of-speech to first-audio latency during the active session. These SHALL update live as each conversational turn completes.

#### Scenario: Percentiles computed from session turns
- **WHEN** the agent produces audio in response to user speech
- **THEN** the system records the time from end-of-speech detection to first-audio playback and updates the p50 and p95 values

#### Scenario: Percentiles update live
- **WHEN** a new conversational turn adds a latency measurement
- **THEN** the displayed p50 and p95 values reflect the updated computation including the new sample

### Requirement: Tool duration metrics
The system SHALL compute p50 percentile for tool-call duration during the session, measuring the time from tool invocation to tool result.

#### Scenario: Tool duration recorded
- **WHEN** a client tool is invoked and returns a result
- **THEN** the system records the duration and updates the tool duration p50

### Requirement: Tool failure count
The system SHALL track and display the count of tool failures that occurred during the session.

#### Scenario: Failed tool counted
- **WHEN** a client tool invocation returns an error or times out
- **THEN** the tool failure count increments by one

### Requirement: Metrics visible alongside corresponding questions
The session metrics panel SHALL be positioned so a reviewer sees the latency measurements while the agent asks about latency. The self-measurement SHALL be visible at the moment the corresponding criterion is being discussed.

#### Scenario: Metrics visible during latency question
- **WHEN** the agent asks about end-of-speech to first-audio latency
- **THEN** the session metrics panel showing the same measurement for the current session is visible on the same screen

### Requirement: Session-scoped metrics
All metrics SHALL be scoped to the current session. Starting a new conversation SHALL reset all metric measurements to zero.

#### Scenario: Metrics reset on new session
- **WHEN** a new conversation is started after a previous one ended
- **THEN** all session metrics (p50, p95, tool duration, failure count) are reset to their initial empty state
