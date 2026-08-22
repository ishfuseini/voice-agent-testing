## Purpose

Generates a Markdown readiness report grouped by assessment state with evidence and actionable next steps — the output that makes the conversational review durable and shareable after the session ends.

## ADDED Requirements

### Requirement: Report triggered by complete_assessment
The system SHALL generate a readiness report when the `complete_assessment` tool is invoked. The report SHALL render in the application interface.

#### Scenario: Report generated on completion
- **WHEN** the agent calls `complete_assessment`
- **THEN** a readiness report is generated and rendered in the application

### Requirement: Report grouped by assessment state
The report SHALL group findings by state: Ready, Needs Validation, and Needs Attention. Each group SHALL list its criteria with their evidence and recommendations.

#### Scenario: Report shows state groupings
- **WHEN** the report is rendered
- **THEN** it displays three sections — one for each assessment state — with criteria listed under each

### Requirement: Every finding carries evidence and next step
Each finding in the report SHALL include the evidence gathered during conversation and a concrete actionable next step. The report SHALL prioritize actionable next steps over a score.

#### Scenario: Needs Attention finding has evidence and recommendation
- **WHEN** a criterion with Needs Attention state appears in the report
- **THEN** it displays the evidence recorded by the agent and a specific recommendation for addressing the gap

### Requirement: Markdown export
The report SHALL be exportable as a Markdown file. The exported Markdown SHALL contain the same content as the rendered report.

#### Scenario: Export as Markdown
- **WHEN** the user activates the Markdown export control
- **THEN** a Markdown file is downloaded containing the full report grouped by state with evidence and next steps

### Requirement: No composite score in report
The report SHALL NOT contain a readiness percentage or composite score. It SHALL report state counts only.

#### Scenario: Report shows counts not percentage
- **WHEN** the report is rendered or exported
- **THEN** it displays counts per state (e.g., "4 Ready · 3 Needs Validation · 2 Needs Attention") with no percentage or score
