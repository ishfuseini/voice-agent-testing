import { pillars } from "@/lib/criteria";
import type { AssessmentItem } from "@/lib/types";
import { CriterionState } from "@/lib/types";
import type { AssessmentCounts } from "@/stores/assessment";

/**
 * Report generation — a pure function that takes assessment state and
 * returns a Markdown string grouped by assessment state with evidence
 * and actionable next steps.
 *
 * The report does NOT contain a composite score or percentage. It reports
 * state counts only, prioritizing actionable next steps over a score.
 */

function criterionDisplayName(criterionKey: string): string {
	for (const pillar of pillars) {
		for (const criterion of pillar.criteria) {
			if (criterion.key === criterionKey) {
				return criterion.name;
			}
		}
	}
	return criterionKey;
}

function groupByState(items: AssessmentItem[]): {
	ready: AssessmentItem[];
	needsValidation: AssessmentItem[];
	needsAttention: AssessmentItem[];
	unevaluated: AssessmentItem[];
} {
	const groups = {
		ready: [] as AssessmentItem[],
		needsValidation: [] as AssessmentItem[],
		needsAttention: [] as AssessmentItem[],
		unevaluated: [] as AssessmentItem[],
	};

	for (const item of items) {
		switch (item.state) {
			case CriterionState.Ready:
				groups.ready.push(item);
				break;
			case CriterionState.NeedsValidation:
				groups.needsValidation.push(item);
				break;
			case CriterionState.NeedsAttention:
				groups.needsAttention.push(item);
				break;
			case CriterionState.Unevaluated:
				groups.unevaluated.push(item);
				break;
		}
	}

	return groups;
}

function formatSection(
	title: string,
	marker: string,
	items: AssessmentItem[],
): string {
	if (items.length === 0) {
		return "";
	}

	const lines: string[] = [`## ${title} (${items.length})`];

	for (const item of items) {
		lines.push(`  ${marker} ${criterionDisplayName(item.criterionKey)}`);
		if (item.evidence) {
			lines.push(`      ${item.evidence}`);
		}
		if (item.recommendation) {
			lines.push(`      → ${item.recommendation}`);
		}
		lines.push("");
	}

	return lines.join("\n");
}

/**
 * Generate a Markdown readiness report from assessment state.
 *
 * The report is grouped by state: READY, NEEDS VALIDATION, NEEDS ATTENTION.
 * Each finding carries its evidence and a concrete next step.
 * No composite score or percentage appears anywhere in the report.
 *
 * @param items - all assessment items from the assessment store
 * @param counts - pre-computed assessment counts (for the summary line)
 * @returns a Markdown string
 */
export function generateReport(
	items: AssessmentItem[],
	counts: AssessmentCounts,
): string {
	const groups = groupByState(items);

	const header = [
		"# Production Readiness Review",
		"",
		`${counts.ready} Ready · ${counts.needsValidation} Needs Validation · ${counts.needsAttention} Needs Attention · ${counts.remaining} Pending`,
	].join("\n");

	const body = [
		formatSection("READY", "✓", groups.ready),
		formatSection("NEEDS VALIDATION", "?", groups.needsValidation),
		formatSection("NEEDS ATTENTION", "!", groups.needsAttention),
	].filter((s) => s.length > 0);

	return [header, ...body].join("\n\n");
}
