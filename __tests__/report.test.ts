import { describe, it, expect } from "vitest";
import { generateReport } from "@/lib/report";
import { CriterionState } from "@/lib/types";
import type { AssessmentItem } from "@/lib/types";
import type { AssessmentCounts } from "@/stores/assessment";

function makeItem(
	pillarKey: string,
	criterionKey: string,
	state: CriterionState,
	evidence?: string,
	recommendation?: string,
): AssessmentItem {
	return { pillarKey, criterionKey, state, evidence, recommendation };
}

const emptyCounts: AssessmentCounts = {
	evaluated: 0,
	remaining: 9,
	ready: 0,
	needsValidation: 0,
	needsAttention: 0,
};

describe("report generation", () => {
	describe("state groupings", () => {
		it("contains a READY section header when a Ready item exists", () => {
			const items = [
				makeItem(
					"latency",
					"end_of_speech_to_first_audio",
					CriterionState.Ready,
					"p50 latency is 250ms",
					"Continue monitoring",
				),
			];
			const counts = { ...emptyCounts, evaluated: 1, remaining: 8, ready: 1 };
			const report = generateReport(items, counts);

			expect(report).toContain("## READY");
		});

		it("contains a NEEDS VALIDATION section header when applicable", () => {
			const items = [
				makeItem(
					"tool_calling",
					"failure_handling",
					CriterionState.NeedsValidation,
					"CRM health check timed out",
					"Verify CRM connectivity",
				),
			];
			const counts = {
				...emptyCounts,
				evaluated: 1,
				remaining: 8,
				needsValidation: 1,
			};
			const report = generateReport(items, counts);

			expect(report).toContain("## NEEDS VALIDATION");
		});

		it("contains a NEEDS ATTENTION section header when applicable", () => {
			const items = [
				makeItem(
					"observability",
					"trace_stream",
					CriterionState.NeedsAttention,
					"No trace events emitted",
					"Instrument the conversation hook",
				),
			];
			const counts = {
				...emptyCounts,
				evaluated: 1,
				remaining: 8,
				needsAttention: 1,
			};
			const report = generateReport(items, counts);

			expect(report).toContain("## NEEDS ATTENTION");
		});

		it("renders all three state sections when all states are present", () => {
			const items = [
				makeItem(
					"latency",
					"end_of_speech_to_first_audio",
					CriterionState.Ready,
					"Evidence A",
					"Step A",
				),
				makeItem(
					"tool_calling",
					"failure_handling",
					CriterionState.NeedsValidation,
					"Evidence B",
					"Step B",
				),
				makeItem(
					"observability",
					"trace_stream",
					CriterionState.NeedsAttention,
					"Evidence C",
					"Step C",
				),
			];
			const counts = {
				...emptyCounts,
				evaluated: 3,
				remaining: 6,
				ready: 1,
				needsValidation: 1,
				needsAttention: 1,
			};
			const report = generateReport(items, counts);

			expect(report).toContain("## READY");
			expect(report).toContain("## NEEDS VALIDATION");
			expect(report).toContain("## NEEDS ATTENTION");
		});

		it("omits sections that have no items", () => {
			const items = [
				makeItem(
					"latency",
					"end_of_speech_to_first_audio",
					CriterionState.Ready,
					"Evidence A",
					"Step A",
				),
			];
			const counts = { ...emptyCounts, evaluated: 1, remaining: 8, ready: 1 };
			const report = generateReport(items, counts);

			expect(report).toContain("## READY");
			expect(report).not.toContain("## NEEDS VALIDATION");
			expect(report).not.toContain("## NEEDS ATTENTION");
		});
	});

	describe("evidence and next steps", () => {
		it("includes evidence in each finding", () => {
			const items = [
				makeItem(
					"latency",
					"end_of_speech_to_first_audio",
					CriterionState.Ready,
					"p50 latency is 250ms",
					"Continue monitoring",
				),
			];
			const counts = { ...emptyCounts, evaluated: 1, remaining: 8, ready: 1 };
			const report = generateReport(items, counts);

			expect(report).toContain("p50 latency is 250ms");
		});

		it("includes a recommendation (next step) with the arrow marker", () => {
			const items = [
				makeItem(
					"observability",
					"trace_stream",
					CriterionState.NeedsAttention,
					"No trace events emitted",
					"Instrument the conversation hook",
				),
			];
			const counts = {
				...emptyCounts,
				evaluated: 1,
				remaining: 8,
				needsAttention: 1,
			};
			const report = generateReport(items, counts);

			expect(report).toContain("Instrument the conversation hook");
			expect(report).toContain("→");
		});

		it("includes evidence and recommendation for Needs Validation findings", () => {
			const items = [
				makeItem(
					"tool_calling",
					"failure_handling",
					CriterionState.NeedsValidation,
					"CRM health check timed out",
					"Verify CRM connectivity in staging",
				),
			];
			const counts = {
				...emptyCounts,
				evaluated: 1,
				remaining: 8,
				needsValidation: 1,
			};
			const report = generateReport(items, counts);

			expect(report).toContain("CRM health check timed out");
			expect(report).toContain("Verify CRM connectivity in staging");
		});
	});

	describe("no composite score", () => {
		it("does not contain a percentage anywhere", () => {
			const items = [
				makeItem(
					"latency",
					"end_of_speech_to_first_audio",
					CriterionState.Ready,
					"p50 latency is 250ms",
					"Continue monitoring",
				),
				makeItem(
					"tool_calling",
					"failure_handling",
					CriterionState.NeedsValidation,
					"CRM check timed out",
					"Verify CRM connectivity",
				),
			];
			const counts = {
				...emptyCounts,
				evaluated: 2,
				remaining: 7,
				ready: 1,
				needsValidation: 1,
			};
			const report = generateReport(items, counts);

			expect(report).not.toMatch(/\d+%/);
		});

		it("does not contain the word 'score'", () => {
			const items = [
				makeItem(
					"latency",
					"end_of_speech_to_first_audio",
					CriterionState.Ready,
					"Evidence A",
					"Step A",
				),
			];
			const counts = { ...emptyCounts, evaluated: 1, remaining: 8, ready: 1 };
			const report = generateReport(items, counts);

			expect(report.toLowerCase()).not.toContain("score");
		});

		it("displays counts in the summary line, not a percentage", () => {
			const items: AssessmentItem[] = [];
			const counts: AssessmentCounts = {
				evaluated: 9,
				remaining: 0,
				ready: 4,
				needsValidation: 3,
				needsAttention: 2,
			};
			const report = generateReport(items, counts);

			expect(report).toContain(
				"4 Ready · 3 Needs Validation · 2 Needs Attention · 0 Pending",
			);
		});
	});

	describe("report header", () => {
		it("contains the report title", () => {
			const report = generateReport([], emptyCounts);

			expect(report).toContain("# Production Readiness Review");
		});

		it("contains the counts summary line", () => {
			const report = generateReport([], emptyCounts);

			expect(report).toContain(
				"0 Ready · 0 Needs Validation · 0 Needs Attention · 9 Pending",
			);
		});
	});
});
