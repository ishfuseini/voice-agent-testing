## Purpose

Provides the voice agent integration that conducts the production-readiness review conversationally — managing conversation lifecycle, live transcript, agent state, and contextual follow-up questions through ElevenLabs Agents.

## ADDED Requirements

### Requirement: Conversation start and end controls
The system SHALL provide controls to start and end a voice conversation with the agent. When started, the agent SHALL introduce the review and begin asking about the deployment. When ended, the conversation SHALL terminate cleanly.

#### Scenario: Start conversation
- **WHEN** the user activates the start control
- **THEN** the agent connects via ElevenLabs Agents and begins speaking an introduction to the readiness review

#### Scenario: End conversation
- **WHEN** the user activates the end control
- **THEN** the conversation terminates and the agent stops listening and speaking

### Requirement: Live transcript rendering
The system SHALL render a live transcript of the conversation as it progresses, showing both user speech and agent responses in real time.

#### Scenario: Transcript updates during conversation
- **WHEN** the user speaks or the agent responds
- **THEN** the transcript renders the new content immediately without requiring a page refresh

### Requirement: Agent listening and speaking state
The system SHALL display the agent's current state — listening, speaking, or idle — so the user can see whether the agent is awaiting input or producing a response.

#### Scenario: Agent speaking
- **WHEN** the agent is producing a spoken response
- **THEN** the agent state indicator shows "speaking"

#### Scenario: Agent listening
- **WHEN** the agent has finished speaking and is awaiting user input
- **THEN** the agent state indicator shows "listening"

### Requirement: Contextual follow-up questions
The agent SHALL ask follow-up questions shaped by previous answers rather than reading a fixed question order. The agent SHALL ask one clear question at a time and SHALL NOT re-ask what has already been answered.

#### Scenario: Follow-up shaped by deployment channel
- **WHEN** the user states they are deploying to telephony
- **THEN** the agent asks follow-up questions relevant to telephony deployments rather than web or mobile

#### Scenario: No re-asking answered questions
- **WHEN** the user has already answered a question about latency measurement
- **THEN** the agent does not ask the same question again in a later turn

### Requirement: Recognition of insufficient information
The agent SHALL recognize when the user cannot provide enough information to determine readiness and SHALL move on to the next criterion without forcing an answer.

#### Scenario: User does not know the answer
- **WHEN** the user responds that they have not measured a particular metric
- **THEN** the agent acknowledges the gap, records it via the appropriate tool call, and proceeds to the next criterion

### Requirement: Periodic findings summary
The agent SHALL periodically summarize findings during the review so the user can track progress and understand what has been assessed so far.

#### Scenario: Mid-review summary
- **WHEN** the conversation has covered approximately half the criteria
- **THEN** the agent provides a brief summary of what has been evaluated and the current state counts

### Requirement: Review duration target
The full review SHALL be demonstrable in 5–10 minutes at roughly 40 seconds per criterion including follow-ups.

#### Scenario: Review completes within target
- **WHEN** all 9–12 criteria have been evaluated through conversation
- **THEN** the total conversation duration falls within the 5–10 minute target range

### Requirement: No fabricated deployment information
The agent SHALL never invent deployment information that was not provided by the user. The agent SHALL only record evidence based on what the user actually said.

#### Scenario: Agent does not fabricate evidence
- **WHEN** the user provides incomplete information about their deployment
- **THEN** the agent records only what was stated and does not fill in missing details with assumptions
