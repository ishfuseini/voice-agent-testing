export enum CriterionState {
	Unevaluated = "unevaluated",
	Ready = "ready",
	NeedsValidation = "needs_validation",
	NeedsAttention = "needs_attention",
}

export interface Criterion {
	pillarKey: string;
	key: string;
	name: string;
	initialState: CriterionState;
}

export interface Pillar {
	key: string;
	name: string;
	criteria: Criterion[];
}

export interface AssessmentItem {
	pillarKey: string;
	criterionKey: string;
	state: CriterionState;
	evidence?: string;
	recommendation?: string;
}

export type EventType =
	| "conversation_start"
	| "conversation_end"
	| "speech_detected"
	| "transcript_complete"
	| "agent_response"
	| "tool_call"
	| "tool_result"
	| "tool_failure"
	| "assessment_change"
	| "latency";

export interface TraceEvent {
	id: string;
	type: EventType;
	timestamp: number;
	durationMs?: number;
	data?: Record<string, unknown>;
}

export interface LatencySample {
	timestamp: number;
	valueMs: number;
}

export interface SessionMetrics {
	firstAudioLatencies: LatencySample[];
	toolDurations: LatencySample[];
	toolFailureCount: number;
}
