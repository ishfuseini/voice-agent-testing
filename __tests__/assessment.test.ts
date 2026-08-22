import { describe, it, expect, beforeEach } from "vitest";
import { pillars } from "@/lib/criteria";
import { CriterionState } from "@/lib/types";
import type { AssessmentItem } from "@/lib/types";
import { useAssessmentStore } from "@/stores/assessment";

/**
 * Assessment store tests — state transitions, no composite score,
 * and unknown criterion rejection.
 *
 * The store is a Zustand singleton, so we reset it to initial state
 * before each test by rebuilding the criteria map from the `pillars` data
 * (the same source of truth the store uses at module load).
 */
function resetAssessmentStore() {
	const criteria: Record<string, AssessmentItem> = {};
	for (const pillar of pillars) {
		for (const criterion of pillar.criteria) {
			criteria[criterion.key] = {
				pillarKey: criterion.pillarKey,
				criterionKey: criterion.key,
				state: CriterionState.Unevaluated,
			};
		}
	}
	useAssessmentStore.setState({ criteria, completed: false });
}

describe("assessment store", () => {
	beforeEach(() => {
		resetAssessmentStore();
	});

	describe("initial state", () => {
		it("initializes all criteria as Unevaluated", () => {
			const { criteria } = useAssessmentStore.getState();
			const all = Object.values(criteria);
			expect(all).toHaveLength(9);
			for (const item of all) {
				expect(item.state).toBe(CriterionState.Unevaluated);
			}
		});

		it("starts with completed flag false", () => {
			expect(useAssessmentStore.getState().completed).toBe(false);
		});
	});

	describe("state transitions via updateReadinessItem", () => {
		it("sets a criterion to Ready with evidence and recommendation", () => {
			const result = useAssessmentStore.getState().updateReadinessItem({
				pillarKey: "latency",
				criterionKey: "end_of_speech_to_first_audio",
				status: CriterionState.Ready,
				evidence: "p50 latency is 250ms",
				recommendation: "Continue monitoring in production",
			});

			expect(result).toEqual({ ok: true });

			const item = useAssessmentStore.getState().criteria[
				"end_of_speech_to_first_audio"
			];
			expect(item.state).toBe(CriterionState.Ready);
			expect(item.evidence).toBe("p50 latency is 250ms");
			expect(item.recommendation).toBe("Continue monitoring in production");
		});

		it("sets a criterion to Needs Validation", () => {
			const result = useAssessmentStore.getState().updateReadinessItem({
				pillarKey: "tool_calling",
				criterionKey: "failure_handling",
				status: CriterionState.NeedsValidation,
				evidence: "CRM health check timed out",
				recommendation: "Verify CRM connectivity in staging",
			});

			expect(result).toEqual({ ok: true });

			const item =
				useAssessmentStore.getState().criteria["failure_handling"];
			expect(item.state).toBe(CriterionState.NeedsValidation);
		});

		it("sets a criterion to Needs Attention", () => {
			const result = useAssessmentStore.getState().updateReadinessItem({
				pillarKey: "observability",
				criterionKey: "trace_stream",
				status: CriterionState.NeedsAttention,
				evidence: "No trace events are emitted",
				recommendation: "Instrument the conversation hook",
			});

			expect(result).toEqual({ ok: true });

			const item = useAssessmentStore.getState().criteria["trace_stream"];
			expect(item.state).toBe(CriterionState.NeedsAttention);
		});
	});

	describe("unknown criterion rejection", () => {
		it("rejects an unknown criterion key", () => {
			const result = useAssessmentStore.getState().updateReadinessItem({
				pillarKey: "latency",
				criterionKey: "nonexistent_criterion",
				status: CriterionState.Ready,
			});

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toContain("Unknown criterion");
			}
		});

		it("does not mutate state when criterion is unknown", () => {
			const before = useAssessmentStore.getState().criteria;

			useAssessmentStore.getState().updateReadinessItem({
				pillarKey: "latency",
				criterionKey: "nonexistent_criterion",
				status: CriterionState.Ready,
			});

			const after = useAssessmentStore.getState().criteria;
			expect(after).toEqual(before);
		});

		it("rejects a pillar/criterion mismatch", () => {
			const result = useAssessmentStore.getState().updateReadinessItem({
				pillarKey: "observability",
				criterionKey: "end_of_speech_to_first_audio",
				status: CriterionState.Ready,
			});

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toContain("does not belong to pillar");
			}
		});

		it("does not mutate state on pillar mismatch", () => {
			const before = useAssessmentStore.getState().criteria;

			useAssessmentStore.getState().updateReadinessItem({
				pillarKey: "observability",
				criterionKey: "end_of_speech_to_first_audio",
				status: CriterionState.Ready,
			});

			const after = useAssessmentStore.getState().criteria;
			expect(after).toEqual(before);
		});
	});

	describe("no composite score", () => {
		it("getAssessmentState returns counts, not a percentage or score", () => {
			const counts = useAssessmentStore.getState().getAssessmentState();

			expect(counts).toHaveProperty("evaluated");
			expect(counts).toHaveProperty("remaining");
			expect(counts).toHaveProperty("ready");
			expect(counts).toHaveProperty("needsValidation");
			expect(counts).toHaveProperty("needsAttention");
			expect(counts).not.toHaveProperty("score");
			expect(counts).not.toHaveProperty("percentage");
		});

		it("counts all criteria as remaining when unevaluated", () => {
			const counts = useAssessmentStore.getState().getAssessmentState();

			expect(counts.evaluated).toBe(0);
			expect(counts.remaining).toBe(9);
			expect(counts.ready).toBe(0);
			expect(counts.needsValidation).toBe(0);
			expect(counts.needsAttention).toBe(0);
		});

		it("counts evaluated criteria correctly after mixed updates", () => {
			const store = useAssessmentStore.getState();
			store.updateReadinessItem({
				pillarKey: "latency",
				criterionKey: "end_of_speech_to_first_audio",
				status: CriterionState.Ready,
			});
			store.updateReadinessItem({
				pillarKey: "tool_calling",
				criterionKey: "failure_handling",
				status: CriterionState.NeedsValidation,
			});
			store.updateReadinessItem({
				pillarKey: "observability",
				criterionKey: "trace_stream",
				status: CriterionState.NeedsAttention,
			});

			const counts = useAssessmentStore.getState().getAssessmentState();

			expect(counts.evaluated).toBe(3);
			expect(counts.remaining).toBe(6);
			expect(counts.ready).toBe(1);
			expect(counts.needsValidation).toBe(1);
			expect(counts.needsAttention).toBe(1);
		});
	});

	describe("completeAssessment", () => {
		it("sets the completed flag to true", () => {
			expect(useAssessmentStore.getState().completed).toBe(false);

			useAssessmentStore.getState().completeAssessment();

			expect(useAssessmentStore.getState().completed).toBe(true);
		});
	});
});
