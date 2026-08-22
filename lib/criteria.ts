import type { Pillar } from "./types";
import { CriterionState } from "./types";

export const pillars: Pillar[] = [
	{
		key: "latency",
		name: "Latency & Turn-Taking",
		criteria: [
			{
				pillarKey: "latency",
				key: "end_of_speech_to_first_audio",
				name: "End-of-speech to first-audio latency",
				initialState: CriterionState.Unevaluated,
			},
			{
				pillarKey: "latency",
				key: "interruption_handling",
				name: "Interruption handling",
				initialState: CriterionState.Unevaluated,
			},
			{
				pillarKey: "latency",
				key: "turn_taking_timeout",
				name: "Turn-taking timeout",
				initialState: CriterionState.Unevaluated,
			},
		],
	},
	{
		key: "tool_calling",
		name: "Tool Calling & Grounding",
		criteria: [
			{
				pillarKey: "tool_calling",
				key: "tool_registration",
				name: "Client tool registration",
				initialState: CriterionState.Unevaluated,
			},
			{
				pillarKey: "tool_calling",
				key: "tool_grounding",
				name: "Tool grounding & evidence capture",
				initialState: CriterionState.Unevaluated,
			},
			{
				pillarKey: "tool_calling",
				key: "failure_handling",
				name: "Failure path handling",
				initialState: CriterionState.Unevaluated,
			},
		],
	},
	{
		key: "observability",
		name: "Observability & Monitoring",
		criteria: [
			{
				pillarKey: "observability",
				key: "trace_stream",
				name: "Trace event stream",
				initialState: CriterionState.Unevaluated,
			},
			{
				pillarKey: "observability",
				key: "session_metrics",
				name: "Live session metrics",
				initialState: CriterionState.Unevaluated,
			},
			{
				pillarKey: "observability",
				key: "report_export",
				name: "Report generation & export",
				initialState: CriterionState.Unevaluated,
			},
		],
	},
];
