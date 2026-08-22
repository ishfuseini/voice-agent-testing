"use client";

import type { HookOptions } from "@elevenlabs/react";
import { useConversation } from "@elevenlabs/react";
import { useCallback, useRef } from "react";
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

/**
 * Wraps `useConversation` with:
 * - All four client tools registered (update_readiness_item, get_assessment_state,
 *   complete_assessment, check_crm_health)
 * - Conversation events wired to the trace store via the single emit() interface
 * - Transcript updates pushed to the session store
 * - First-audio latency measured on mode transitions (listening → speaking)
 * - Session lifecycle (start/end) managed through the session store
 *
 * Must be used within a `<ConversationProvider>`.
 */
export function useReadinessConversation() {
	const speechEndTimestamp = useRef<number | null>(null);

	const handleStart = useCallback(() => {
		useSessionStore.getState().start();
		emit({ type: "conversation_start" });
	}, []);

	const handleEnd = useCallback(() => {
		useSessionStore.getState().end();
		emit({ type: "conversation_end" });
	}, []);

	const options: HookOptions = {
		agentId: AGENT_ID,
		clientTools: {
			update_readiness_item,
			get_assessment_state,
			complete_assessment,
			check_crm_health,
		},
		onConnect: ({ conversationId }) => {
			emit({
				type: "conversation_start",
				data: { conversationId },
			});
		},
		onDisconnect: (details) => {
			emit({
				type: "conversation_end",
				data: { reason: details.reason },
			});
			useSessionStore.getState().end();
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
			emit({
				type: role === "user" ? "speech_detected" : "agent_response",
				data: { message, role: speaker },
			});
		},
		onModeChange: ({ mode }) => {
			if (mode === "listening") {
				// User finished speaking, agent is now processing
				speechEndTimestamp.current = Date.now();
				emit({ type: "speech_detected", data: { mode } });
			} else if (mode === "speaking") {
				// Agent started speaking — measure latency from speech end
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
				emit({ type: "agent_response", data: { mode } });
			}
		},
		onStatusChange: ({ status }) => {
			emit({
				type: "assessment_change",
				data: { status },
			});
		},
	};

	const conversation = useConversation(options);

	const startSession = useCallback(() => {
		handleStart();
		conversation.startSession();
	}, [conversation, handleStart]);

	const endSession = useCallback(() => {
		conversation.endSession();
		handleEnd();
	}, [conversation, handleEnd]);

	return {
		...conversation,
		startSession,
		endSession,
		agentId: AGENT_ID,
	};
}
