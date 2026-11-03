"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentState } from "@/components/ui/orb";
import {
	check_crm_health,
	complete_assessment,
	type UpdateReadinessItemParams,
	update_readiness_item,
} from "@/lib/tools";
import { useMetricsStore } from "@/stores/metrics";
import { useSessionStore } from "@/stores/session";
import { emit } from "@/stores/trace";

/**
 * A scripted, fully client-side walkthrough of a readiness review.
 *
 * It drives the same stores and the same tool handlers a live ElevenLabs
 * session does — transcript, metrics, trace, assessment, and report all
 * populate through the production code paths. There is no separate tutorial
 * mode and no fabricated shortcut; the only difference from a live session is
 * that the turns come from this script instead of the agent.
 *
 * Used to give a cold visitor something to reach value with when no
 * NEXT_PUBLIC_ELEVENLABS_AGENT_ID is configured (or alongside a live agent).
 */

type SampleStep = { afterMs: number } & (
	| { kind: "agent"; text: string }
	| { kind: "user"; text: string }
	| { kind: "record"; params: UpdateReadinessItemParams }
	| { kind: "dependency-check" }
	| { kind: "complete" }
);

export const SAMPLE_STEPS: SampleStep[] = [
	{
		kind: "agent",
		afterMs: 300,
		text: "I'll be conducting a production-readiness review of your voice deployment — latency, tool calling, and observability, one question at a time. To start: what channel are you deploying to?",
	},
	{
		kind: "user",
		afterMs: 950,
		text: "Web, embedded directly in our product.",
	},
	{
		kind: "agent",
		afterMs: 780,
		text: "First pillar — latency. Do you measure the time between a caller finishing their sentence and hearing the first agent audio, and what are you seeing?",
	},
	{
		kind: "record",
		afterMs: 200,
		params: {
			pillar: "latency",
			criterion: "end_of_speech_to_first_audio",
			status: "ready",
			evidence:
				"Targets 700 ms; measured about 780 ms at p50 and 1.9 s at p95 on the web channel.",
			recommendation:
				"Keep p95 in the regression suite and alert when it crosses 2 s.",
		},
	},
	{
		kind: "user",
		afterMs: 850,
		text: "We target 700 milliseconds. We're measuring about 780 at p50 and 1.9 seconds at p95.",
	},
	{
		kind: "agent",
		afterMs: 420,
		text: "Recorded. Can callers interrupt the agent mid-sentence, and is barge-in tested?",
	},
	{
		kind: "record",
		afterMs: 200,
		params: {
			pillar: "latency",
			criterion: "interruption_handling",
			status: "ready",
			evidence:
				"Barge-in enabled with a 200 ms cutoff; tested by interrupting mid-answer.",
			recommendation:
				"Add a scripted interruption case so barge-in stays covered across model changes.",
		},
	},
	{
		kind: "user",
		afterMs: 820,
		text: "Yes — barge-in cuts the agent off within 200 milliseconds, and we test it.",
	},
	{
		kind: "agent",
		afterMs: 390,
		text: "And what happens when the caller goes silent — is there a turn-taking timeout?",
	},
	{
		kind: "record",
		afterMs: 200,
		params: {
			pillar: "latency",
			criterion: "turn_taking_timeout",
			status: "needs_validation",
			evidence:
				"No silence timeout configured; the agent waits indefinitely for the caller.",
			recommendation:
				"Set a configurable silence timeout with a reprompt or end-call fallback, then re-test.",
		},
	},
	{
		kind: "user",
		afterMs: 800,
		text: "Honestly, we haven't set one. The agent just waits.",
	},
	{
		kind: "agent",
		afterMs: 1250,
		text: "Understood — I'll record that as needs validation rather than a failure, since the behaviour is unverified. Next, tool calling: are your tools registered client-side or server-side?",
	},
	{
		kind: "record",
		afterMs: 200,
		params: {
			pillar: "tool_calling",
			criterion: "tool_registration",
			status: "ready",
			evidence:
				"Four client tools registered in the browser; no server or webhooks.",
			recommendation:
				"Keep tool names in sync with the agent dashboard and cover them in a smoke test.",
		},
	},
	{
		kind: "user",
		afterMs: 880,
		text: "Client-side. Four tools, all in the browser — no server, no webhooks.",
	},
	{
		kind: "agent",
		afterMs: 460,
		text: "Does the agent ground its answers in the tool results, or can it drift?",
	},
	{
		kind: "record",
		afterMs: 200,
		params: {
			pillar: "tool_calling",
			criterion: "tool_grounding",
			status: "ready",
			evidence:
				"Every answer is grounded in tool output, and the trace shows the evidence chain.",
			recommendation:
				"Keep tool results visible in the trace so grounding stays auditable.",
		},
	},
	{
		kind: "user",
		afterMs: 820,
		text: "It grounds every answer, and we can see the tool results in the trace.",
	},
	{
		kind: "agent",
		afterMs: 380,
		text: "Let me verify a dependency — checking the CRM integration health.",
	},
	{ kind: "dependency-check", afterMs: 400 },
	{
		kind: "record",
		afterMs: 250,
		params: {
			pillar: "tool_calling",
			criterion: "failure_handling",
			status: "needs_validation",
			evidence:
				"CRM health check timed out after about 5 s; the dependency could not be verified through this path.",
			recommendation:
				"Re-run the check behind synthetic monitoring and surface the timeout to the caller.",
		},
	},
	{
		kind: "agent",
		afterMs: 430,
		text: "The CRM check timed out, so I can't verify that integration. That's unverified, not broken — I'll record it as needs validation and note what to re-test.",
	},
	{
		kind: "user",
		afterMs: 700,
		text: "That's fair.",
	},
	{
		kind: "agent",
		afterMs: 390,
		text: "Last pillar — observability. Do you keep a timestamped trace of the conversation?",
	},
	{
		kind: "record",
		afterMs: 200,
		params: {
			pillar: "observability",
			criterion: "trace_stream",
			status: "ready",
			evidence:
				"Timestamped event stream covering speech, tool calls, and state changes in order.",
			recommendation:
				"Attach an external sink to the emit() seam when you need durable tracing.",
		},
	},
	{
		kind: "user",
		afterMs: 780,
		text: "Yes — every event, in order, with timestamps.",
	},
	{
		kind: "agent",
		afterMs: 360,
		text: "Do you track latency percentiles live, while the session runs?",
	},
	{
		kind: "record",
		afterMs: 200,
		params: {
			pillar: "observability",
			criterion: "session_metrics",
			status: "ready",
			evidence:
				"p50 and p95 end-of-speech-to-first-audio tracked live during the session.",
			recommendation:
				"Surface p95 next to the median so tail latency stays visible.",
		},
	},
	{
		kind: "user",
		afterMs: 760,
		text: "Yes, p50 and p95 update as we talk.",
	},
	{
		kind: "agent",
		afterMs: 380,
		text: "Last one — can you generate and export a readiness report from a session?",
	},
	{
		kind: "record",
		afterMs: 200,
		params: {
			pillar: "observability",
			criterion: "report_export",
			status: "ready",
			evidence:
				"Markdown report generated at the end of the review and exported on demand.",
			recommendation:
				"Archive reports per session so readiness can be compared over time.",
		},
	},
	{
		kind: "user",
		afterMs: 800,
		text: "Yes — Markdown, at the end of each review.",
	},
	{
		kind: "agent",
		afterMs: 410,
		text: "That's all nine criteria. Generating your readiness report now.",
	},
	{ kind: "complete", afterMs: 300 },
	{
		kind: "agent",
		afterMs: 500,
		text: "The report is ready — grouped by state, with the evidence and next steps. No score, just what to ship, verify, or fix.",
	},
];

export interface SampleRunHandle {
	cancelled: boolean;
}

const sleep = (ms: number) =>
	new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Play the scripted session through the real stores and tool handlers.
 * Resolves when the script finishes or the handle is cancelled.
 */
export async function runSampleSession(
	handle: SampleRunHandle = { cancelled: false },
	onPhase?: (phase: AgentState) => void,
): Promise<void> {
	useSessionStore.getState().start({ sample: true });
	emit({ type: "conversation_start", data: { mode: "sample" } });

	let speechEndedAt: number | null = null;

	const finish = (reason: string) => {
		onPhase?.(null);
		const session = useSessionStore.getState();
		if (session.status === "active") {
			session.end();
			emit({ type: "conversation_end", data: { reason } });
		}
	};

	for (const step of SAMPLE_STEPS) {
		onPhase?.(step.kind === "user" ? "listening" : "thinking");
		await sleep(step.afterMs);
		if (handle.cancelled) return finish("sample_stopped");

		switch (step.kind) {
			case "agent": {
				if (speechEndedAt !== null) {
					const valueMs = Date.now() - speechEndedAt;
					useMetricsStore.getState().recordFirstAudioLatency(valueMs);
					emit({
						type: "latency",
						data: { kind: "end_of_speech_to_first_audio", valueMs },
					});
					speechEndedAt = null;
				}
				onPhase?.("talking");
				useSessionStore
					.getState()
					.appendTranscript({ speaker: "agent", text: step.text });
				emit({
					type: "agent_response",
					data: { message: step.text, role: "agent" },
				});
				break;
			}
			case "user": {
				useSessionStore
					.getState()
					.appendTranscript({ speaker: "user", text: step.text });
				emit({
					type: "speech_detected",
					data: { message: step.text, role: "user" },
				});
				speechEndedAt = Date.now();
				break;
			}
			case "record": {
				update_readiness_item(step.params);
				break;
			}
			case "dependency-check": {
				await check_crm_health();
				if (handle.cancelled) return finish("sample_stopped");
				break;
			}
			case "complete": {
				complete_assessment();
				break;
			}
		}
	}

	finish("sample_complete");
}

/**
 * React binding for the scripted session: exposes the orb phase, a start
 * trigger, and a stop trigger that cancels mid-run.
 */
export function useSampleSession() {
	const [phase, setPhase] = useState<AgentState>(null);
	const handleRef = useRef<SampleRunHandle | null>(null);

	const start = useCallback(async () => {
		if (handleRef.current) return;
		const handle: SampleRunHandle = { cancelled: false };
		handleRef.current = handle;
		try {
			await runSampleSession(handle, setPhase);
		} finally {
			if (handleRef.current === handle) handleRef.current = null;
			setPhase(null);
		}
	}, []);

	const stop = useCallback(() => {
		const handle = handleRef.current;
		if (!handle) return;
		handle.cancelled = true;
		handleRef.current = null;
		setPhase(null);
		const session = useSessionStore.getState();
		if (session.status === "active") {
			session.end();
			emit({ type: "conversation_end", data: { reason: "sample_stopped" } });
		}
	}, []);

	useEffect(
		() => () => {
			if (handleRef.current) handleRef.current.cancelled = true;
			handleRef.current = null;
		},
		[],
	);

	return { start, stop, phase };
}

export type SampleSessionControls = ReturnType<typeof useSampleSession>;
