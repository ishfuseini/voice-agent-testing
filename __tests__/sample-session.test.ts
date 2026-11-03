import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computeSessionMetrics } from "@/lib/metrics";
import { generateReport } from "@/lib/report";
import { runSampleSession } from "@/lib/useSampleSession";
import { buildInitialCriteria, useAssessmentStore } from "@/stores/assessment";
import { useMetricsStore } from "@/stores/metrics";
import { useSessionStore } from "@/stores/session";
import { useTraceStore } from "@/stores/trace";

/**
 * The sample session is the zero-config path to first value: it must drive the
 * same stores and tool handlers a live session does, so a reviewer sees a real
 * transcript, real metrics, a real trace, and a real report.
 */

function resetStores() {
	useAssessmentStore.setState({
		criteria: buildInitialCriteria(),
		completed: false,
	});
	useMetricsStore.getState().reset();
	useSessionStore.getState().reset();
	useTraceStore.getState().clear();
}

describe("sample session", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		resetStores();
	});

	afterEach(() => {
		vi.useRealTimers();
		resetStores();
	});

	it("plays a full review through the real stores and tool handlers", async () => {
		const run = runSampleSession();
		await vi.runAllTimersAsync();
		await run;

		const session = useSessionStore.getState();
		expect(session.status).toBe("ended");
		expect(session.isSample).toBe(true);
		expect(session.transcript.some((e) => e.speaker === "user")).toBe(true);
		expect(session.transcript.some((e) => e.speaker === "agent")).toBe(true);

		const assessment = useAssessmentStore.getState();
		expect(assessment.completed).toBe(true);
		const counts = assessment.getAssessmentState();
		expect(counts.evaluated).toBe(9);
		expect(counts.remaining).toBe(0);
		expect(counts.ready).toBe(7);
		expect(counts.needsValidation).toBe(2);
		expect(counts.needsAttention).toBe(0);

		const metrics = useMetricsStore.getState();
		expect(metrics.firstAudioLatencies).toHaveLength(10);
		expect(metrics.toolFailureCount).toBe(1);

		const metrics2 = computeSessionMetrics(
			metrics.firstAudioLatencies,
			metrics.toolDurations,
			metrics.toolFailureCount,
		);
		expect(metrics2.firstAudioP50).toBe(390);
		expect(metrics2.firstAudioP95).toBe(1250);
		expect(metrics2.toolDurationP50).toBe(5000);

		const types = new Set(useTraceStore.getState().events.map((e) => e.type));
		for (const type of [
			"conversation_start",
			"conversation_end",
			"speech_detected",
			"agent_response",
			"assessment_change",
			"latency",
			"tool_call",
			"tool_failure",
		]) {
			expect(types.has(type as never)).toBe(true);
		}

		const report = generateReport(Object.values(assessment.criteria), counts);
		expect(report).toContain("READY (7)");
		expect(report).toContain("NEEDS VALIDATION (2)");
		expect(report).not.toContain("NEEDS ATTENTION");
		expect(report.toLowerCase()).not.toContain("score");
		expect(report).not.toContain("%");
	});

	it("cancels cleanly when the run handle is cancelled mid-script", async () => {
		const handle = { cancelled: false };
		const run = runSampleSession(handle);
		await vi.advanceTimersByTimeAsync(3000);
		handle.cancelled = true;
		await vi.runAllTimersAsync();
		await run;

		const session = useSessionStore.getState();
		expect(session.status).toBe("ended");
		expect(session.isSample).toBe(true);
		expect(useAssessmentStore.getState().completed).toBe(false);
	});

	it("emits conversation_start and conversation_end for the session", async () => {
		const run = runSampleSession();
		await vi.runAllTimersAsync();
		await run;

		const events = useTraceStore.getState().events;
		expect(events[0]?.type).toBe("conversation_start");
		expect(events.at(-1)?.type).toBe("conversation_end");
	});
});
