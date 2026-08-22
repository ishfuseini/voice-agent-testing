import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { computeSessionMetrics } from "@/lib/metrics";
import { generateReport } from "@/lib/report";
import {
	check_crm_health,
	complete_assessment,
	update_readiness_item,
} from "@/lib/tools";
import { buildInitialCriteria, useAssessmentStore } from "@/stores/assessment";
import { useMetricsStore } from "@/stores/metrics";
import { emit, useTraceStore } from "@/stores/trace";

/**
 * End-to-end flow tests that simulate a full review session.
 *
 * These tests exercise the tool handlers, stores, trace, metrics, and report
 * together — the same code paths a live conversation would trigger, but
 * driven programmatically instead of through the ElevenLabs SDK.
 */

function resetStores() {
	useAssessmentStore.setState({
		criteria: buildInitialCriteria(),
		completed: false,
	});
	useMetricsStore.getState().reset();
	useTraceStore.getState().clear();
}

describe("E2E review session flow", () => {
	beforeEach(() => resetStores());
	afterEach(() => resetStores());

	// ── 12.1: All three assessment states are reachable ─────────────────

	describe("12.1 — three assessment states reachable", () => {
		it("transitions criteria through Ready, Needs Validation, and Needs Attention", () => {
			update_readiness_item({
				pillar: "latency",
				criterion: "end_of_speech_to_first_audio",
				status: "ready",
				evidence: "p50 latency is 250ms, well within SLA",
			});
			update_readiness_item({
				pillar: "tool_calling",
				criterion: "tool_registration",
				status: "needs_validation",
				evidence: "Tools registered but dynamic variables not tested",
			});
			update_readiness_item({
				pillar: "observability",
				criterion: "trace_stream",
				status: "needs_attention",
				evidence: "No external tracing sink configured",
				recommendation: "Add OpenTelemetry export before production",
			});

			const counts = useAssessmentStore.getState().getAssessmentState();
			expect(counts.ready).toBe(1);
			expect(counts.needsValidation).toBe(1);
			expect(counts.needsAttention).toBe(1);
			expect(counts.evaluated).toBe(3);
			expect(counts.remaining).toBe(6); // 9 total - 3 evaluated
		});
	});

	// ── 12.2: check_crm_health times out, agent handles gracefully ─────

	describe("12.2 — check_crm_health timeout", () => {
		it("times out, records failure, and instructs Needs Validation", async () => {
			const result = await check_crm_health();

			expect(result).toContain("timed out");
			expect(result).toContain("Needs Validation");

			const metrics = useMetricsStore.getState();
			expect(metrics.toolFailureCount).toBe(1);
			expect(metrics.toolDurations).toHaveLength(1);
			expect(metrics.toolDurations[0].valueMs).toBeGreaterThanOrEqual(4000);

			const events = useTraceStore.getState().events;
			const toolCall = events.find((e) => e.type === "tool_call");
			const toolFailure = events.find((e) => e.type === "tool_failure");
			expect(toolCall).toBeDefined();
			expect(toolFailure).toBeDefined();
			expect(toolFailure?.durationMs).toBeGreaterThanOrEqual(4000);
		}, 10000);

		it("does not set any criterion to Needs Attention as a side effect", async () => {
			await check_crm_health();

			const counts = useAssessmentStore.getState().getAssessmentState();
			expect(counts.needsAttention).toBe(0);
			expect(counts.evaluated).toBe(0);
		}, 10000);
	});

	// ── 12.3: complete_assessment renders report with state groupings ─

	describe("12.3 — complete_assessment and report generation", () => {
		it("marks assessment complete and generates a grouped report", () => {
			update_readiness_item({
				pillar: "latency",
				criterion: "end_of_speech_to_first_audio",
				status: "ready",
				evidence: "p50 250ms, p95 400ms",
			});
			update_readiness_item({
				pillar: "tool_calling",
				criterion: "failure_handling",
				status: "needs_validation",
				evidence: "CRM timeout path not fully verified",
			});
			update_readiness_item({
				pillar: "observability",
				criterion: "trace_stream",
				status: "needs_attention",
				evidence: "No external sink",
				recommendation: "Add OTel export",
			});

			const result = complete_assessment();
			expect(result).toContain("complete");
			expect(useAssessmentStore.getState().completed).toBe(true);

			const items = Object.values(useAssessmentStore.getState().criteria);
			const counts = useAssessmentStore.getState().getAssessmentState();
			const report = generateReport(items, counts);

			// Report contains state groupings
			expect(report).toContain("READY");
			expect(report).toContain("NEEDS VALIDATION");
			expect(report).toContain("NEEDS ATTENTION");

			// Report contains evidence
			expect(report).toContain("p50 250ms");
			expect(report).toContain("CRM timeout path");
			expect(report).toContain("No external sink");

			// Report contains next steps
			expect(report).toContain("→ Add OTel export");

			// No composite score
			expect(report.toLowerCase()).not.toContain("score");
			expect(report.toLowerCase()).not.toContain("percentage");
			expect(report.toLowerCase()).not.toContain("%");
		});
	});

	// ── 12.4: Trace shows conversation events, tool calls, state changes ─

	describe("12.4 — trace event coverage", () => {
		it("captures assessment_change, tool_call, tool_failure, and latency events", async () => {
			update_readiness_item({
				pillar: "latency",
				criterion: "interruption_handling",
				status: "ready",
				evidence: "Interruption works within 200ms",
			});

			await check_crm_health();

			emit({
				type: "latency",
				data: { kind: "end_of_speech_to_first_audio", valueMs: 280 },
			});
			emit({
				type: "conversation_start",
				data: { conversationId: "test" },
			});
			emit({
				type: "speech_detected",
				data: { message: "hello", role: "user" },
			});
			emit({
				type: "agent_response",
				data: { message: "hi", role: "agent" },
			});

			const events = useTraceStore.getState().events;
			const types = events.map((e) => e.type);
			expect(types).toContain("assessment_change");
			expect(types).toContain("tool_call");
			expect(types).toContain("tool_failure");
			expect(types).toContain("latency");
			expect(types).toContain("conversation_start");
			expect(types).toContain("speech_detected");
			expect(types).toContain("agent_response");

			// All events have timestamps and IDs
			for (const event of events) {
				expect(event.timestamp).toBeGreaterThan(0);
				expect(event.id).toMatch(/^evt_\d+$/);
			}

			// Tool failure has a duration
			const failure = events.find((e) => e.type === "tool_failure");
			expect(failure?.durationMs).toBeGreaterThanOrEqual(4000);
		}, 10000);
	});

	// ── 12.5: Session metrics update with latency samples ───────────────

	describe("12.5 — session metrics live updating", () => {
		it("computes p50/p95 from latency samples as they arrive", () => {
			const store = useMetricsStore.getState();

			const samples = [180, 320, 250, 410, 290];
			for (const ms of samples) {
				store.recordFirstAudioLatency(ms);
			}
			store.recordToolDuration(5000);

			const state = useMetricsStore.getState();
			expect(state.firstAudioLatencies).toHaveLength(5);
			expect(state.toolDurations).toHaveLength(1);
			expect(state.toolFailureCount).toBe(0);

			const metrics = computeSessionMetrics(
				state.firstAudioLatencies,
				state.toolDurations,
				state.toolFailureCount,
			);

			// Sorted: [180, 250, 290, 320, 410]
			// p50: ceil(0.50 * 5) = 3, index 2 → 290
			// p95: ceil(0.95 * 5) = 5, index 4 → 410
			expect(metrics.firstAudioP50).toBe(290);
			expect(metrics.firstAudioP95).toBe(410);
			expect(metrics.firstAudioCount).toBe(5);
			expect(metrics.toolDurationP50).toBe(5000);
		});
	});

	// ── 12.6: No composite percentage in UI or report ────────────────────

	describe("12.6 — no composite percentage anywhere", () => {
		it("assessment counts have no score field", () => {
			const counts = useAssessmentStore.getState().getAssessmentState();
			expect(counts).not.toHaveProperty("score");
			expect(counts).not.toHaveProperty("percentage");
			expect(counts).not.toHaveProperty("rating");
			expect(counts).not.toHaveProperty("grade");
			expect(counts).not.toHaveProperty("composite");
		});

		it("report contains no percentage or score", () => {
			update_readiness_item({
				pillar: "latency",
				criterion: "end_of_speech_to_first_audio",
				status: "ready",
				evidence: "p50 250ms",
			});
			update_readiness_item({
				pillar: "observability",
				criterion: "trace_stream",
				status: "needs_attention",
				evidence: "No sink",
				recommendation: "Add OTel",
			});

			const items = Object.values(useAssessmentStore.getState().criteria);
			const counts = useAssessmentStore.getState().getAssessmentState();
			const report = generateReport(items, counts);

			expect(report.toLowerCase()).not.toContain("score");
			expect(report.toLowerCase()).not.toContain("percentage");
			expect(report.toLowerCase()).not.toContain("composite");
			expect(report.toLowerCase()).not.toContain("rating");
			expect(report.toLowerCase()).not.toContain("grade");
		});
	});
});
