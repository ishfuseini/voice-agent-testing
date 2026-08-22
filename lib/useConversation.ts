"use client";

import type { HookOptions } from "@elevenlabs/react";
import { useConversation } from "@elevenlabs/react";
import { useCallback, useMemo, useRef } from "react";
import {
	check_crm_health,
	complete_assessment,
	get_assessment_state,
	update_readiness_item,
} from "@/lib/tools";
import { useMetricsStore } from "@/stores/metrics";
import { useSessionStore } from "@/stores/session";
import { emit } from "@/stores/trace";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

if (!AGENT_ID) {
	console.warn(
		"NEXT_PUBLIC_ELEVENLABS_AGENT_ID is not set. The conversation will not start.",
	);
}

// Stable reference for client tools — they are pure store-mutating functions
// that don't depend on render state, so the same object identity can be reused
// across renders without causing useConversation to re-initialize.
const clientTools = {
	update_readiness_item,
	get_assessment_state,
	complete_assessment,
	check_crm_health,
};

/**
 * Wraps `useConversation` with:
 * - All four client tools registered (update_readiness_item, get_assessment_state,
 *   complete_assessment, check_crm_health)
 * - Conversation events wired to the trace store via the single emit() interface
 * - Transcript updates pushed to the session store
 * - First-audio latency measured from user message (end of speech) to agent
 *   speaking mode
 * - Session lifecycle (start/end) managed through SDK callbacks only
 *
 * Must be used within a `<ConversationProvider>`.
 */
export function useReadinessConversation() {
	// Timestamp of the last user speech transcription — used as the start point
	// for end-of-speech to first-audio latency. Set in onMessage (user role),
	// consumed in onModeChange (speaking).
	const speechEndTimestamp = useRef<number | null>(null);

	const options = useMemo<HookOptions>(
		() => ({
			agentId: AGENT_ID,
			clientTools,
			onConnect: ({ conversationId }) => {
				useSessionStore.getState().start();
				emit({
					type: "conversation_start",
					data: { conversationId },
				});
			},
			onDisconnect: (details) => {
				useSessionStore.getState().end();
				emit({
					type: "conversation_end",
					data: { reason: details.reason },
				});
			},
			onError: (message) => {
				emit({
					type: "tool_failure",
					data: { error: message },
				});
			},
			onMessage: ({ message, role }) => {
				const speaker = role === "user" ? "user" : "agent";
				useSessionStore.getState().appendTranscript({
					speaker,
					text: message,
				});
				if (role === "user") {
					// User speech transcribed — this is our end-of-speech timestamp
					speechEndTimestamp.current = Date.now();
					emit({
						type: "speech_detected",
						data: { message, role: speaker },
					});
				} else {
					emit({
						type: "agent_response",
						data: { message, role: speaker },
					});
				}
			},
			onModeChange: ({ mode }) => {
				if (mode === "speaking") {
					// Agent started producing audio — measure latency from
					// user speech end (recorded in onMessage) to first audio
					if (speechEndTimestamp.current !== null) {
						const latency = Date.now() - speechEndTimestamp.current;
						useMetricsStore.getState().recordFirstAudioLatency(latency);
						emit({
							type: "latency",
							data: {
								kind: "end_of_speech_to_first_audio",
								valueMs: latency,
							},
						});
						speechEndTimestamp.current = null;
					}
				}
			},
		}),
		[],
	);

	const conversation = useConversation(options);

	const startSession = useCallback(() => {
		conversation.startSession();
	}, [conversation]);

	const endSession = useCallback(() => {
		conversation.endSession();
	}, [conversation]);

	return {
		...conversation,
		startSession,
		endSession,
		agentId: AGENT_ID,
	};
}
