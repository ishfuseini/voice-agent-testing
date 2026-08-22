## Purpose

Defines the readiness assessment model — pillars, criteria, and the three-state evaluation that distinguishes missing evidence from identified problems — and the client-side tools the agent uses to mutate assessment state through ElevenLabs tool calling.

## ADDED Requirements

### Requirement: Three readiness pillars defined in data
The system SHALL define three readiness pillars in data (not hardcoded in logic): Latency & Turn-Taking, Tool Calling & Grounding, and Observability & Monitoring. Adding a pillar SHALL be a configuration change, not a code rewrite.

#### Scenario: Pillars loaded from data
- **WHEN** the application initializes
- **THEN** three pillars are loaded from the criteria definitions with their associated criteria

### Requirement: Nine to twelve criteria across pillars
The system SHALL define 3–4 criteria per pillar, totaling 9–12 criteria. Each criterion SHALL have a pillar key, a criterion key, a human-readable name, and an initial unevaluated state.

#### Scenario: Criteria distributed across pillars
- **WHEN** the criteria definitions are loaded
- **THEN** each of the three pillars contains between 3 and 4 criteria, and the total count is between 9 and 12

### Requirement: Three assessment states
Each criterion SHALL hold exactly one of three states: Ready, Needs Validation, or Needs Attention. Ready means sufficient evidence was produced. Needs Validation means the user cannot currently provide enough information. Needs Attention means a known gap, failure, or risk was identified.

#### Scenario: Criterion set to Ready
- **WHEN** the agent records evidence that the criterion is addressed
- **THEN** the criterion's state is set to Ready

#### Scenario: Criterion set to Needs Validation
- **WHEN** the user cannot provide enough information and the agent records the gap
- **THEN** the criterion's state is set to Needs Validation

#### Scenario: Criterion set to Needs Attention
- **WHEN** the conversation identifies a known gap or failure
- **THEN** the criterion's state is set to Needs Attention

### Requirement: No composite score
The system SHALL NOT produce a readiness percentage or composite score anywhere in the UI or report. State SHALL always be reported as counts per state.

#### Scenario: State reported as counts
- **WHEN** the assessment state is displayed
- **THEN** it shows counts (e.g., "4 Ready · 2 Needs Validation · 1 Needs Attention · 4 Pending") with no percentage or composite score

### Requirement: update_readiness_item tool
The system SHALL provide a client-side tool `update_readiness_item` that records evidence discovered during conversation. The tool SHALL accept pillar, criterion, status, evidence, and recommendation parameters and SHALL mutate the assessment state directly.

#### Scenario: Tool records evidence
- **WHEN** the agent calls `update_readiness_item` with pillar, criterion, status, evidence, and recommendation
- **THEN** the assessment state for that criterion is updated with the provided evidence, recommendation, and status

#### Scenario: Tool rejects unknown criterion
- **WHEN** the agent calls `update_readiness_item` with a criterion key that does not exist in the criteria definitions
- **THEN** the tool returns an error and does not mutate state

### Requirement: get_assessment_state tool
The system SHALL provide a client-side tool `get_assessment_state` that returns the current assessment state so the agent knows what has been covered. The return SHALL include evaluated count, remaining count, and counts per state.

#### Scenario: Agent queries state mid-review
- **WHEN** the agent calls `get_assessment_state`
- **THEN** the tool returns counts of evaluated, remaining, ready, needs_validation, and needs_attention criteria

### Requirement: complete_assessment tool
The system SHALL provide a client-side tool `complete_assessment` that ends the review and triggers report generation.

#### Scenario: Assessment completed
- **WHEN** the agent calls `complete_assessment`
- **THEN** the review is marked complete and the report generation is triggered

### Requirement: check_crm_health tool
The system SHALL provide a client-side tool `check_crm_health` that simulates a dependency check. This tool SHALL always return a timeout to demonstrate the failure path.

#### Scenario: CRM health check times out
- **WHEN** the agent calls `check_crm_health`
- **THEN** the tool returns a timeout result after a delay, simulating an unreachable dependency

### Requirement: Failure path handling
When `check_crm_health` times out, the agent SHALL mark the relevant criterion as Needs Validation — not Needs Attention — because the integration could not be verified, not because it is confirmed broken. The agent SHALL explain this distinction conversationally and SHALL continue the conversation without breaking.

#### Scenario: Timeout results in Needs Validation
- **WHEN** the `check_crm_health` tool times out
- **THEN** the affected criterion is set to Needs Validation, not Needs Attention

#### Scenario: Agent continues after failure
- **WHEN** the CRM health check fails
- **THEN** the agent explains the result conversationally, updates the criterion, and proceeds to the next topic without terminating the conversation
