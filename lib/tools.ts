import type { AssessmentItem } from "@/lib/types";
import { CriterionState } from "@/lib/types";
import { useAssessmentStore } from "@/stores/assessment";
import { useMetricsStore } from "@/stores/metrics";
import { emit } from "@/stores/trace";

/**
 * Client-side tool handlers for the ElevenLabs agent.
 *
 * Every handler executes in the browser, mutates Zustand stores directly,
 * and emits trace events through the single `emit()` interface. The only
 * intentionally slow handler is `check_crm_health` (simulated timeout).
 *
 * Tool handlers are the ONLY writers to the assessment, trace, and metrics
 * stores. UI components read from stores and re-render on mutation.
 */

// ── update_readiness_item ──────────────────────────────────────────────────

export type UpdateReadinessItemParams = {
	pillar: string;
	criterion: string;
	status: "ready" | "needs_validation" | "needs_attention";
	evidence?: string;
	recommendation?: string;
};

const STATE_MAP: Record<string, CriterionState> = {
	ready: CriterionState.Ready,
	needs_validation: CriterionState.NeedsValidation,
	needs_attention: CriterionState.NeedsAttention,
};

/**
 * Records evidence discovered during conversation. Mutates the assessment
 * store and emits an assessment_change trace event.
 *
 * Rejects unknown criteria (pillar/criterion mismatch) without mutating state.
 */
export function update_readiness_item(
	params: UpdateReadinessItemParams,
): string {
	const status = STATE_MAP[params.status];
	if (!status) {
		return `Error: Unknown status "${params.status}". Valid statuses: ready, needs_validation, needs_attention.`;
	}

	const result = useAssessmentStore.getState().updateReadinessItem({
		pillarKey: params.pillar,
		criterionKey: params.criterion,
		status,
		evidence: params.evidence,
		recommendation: params.recommendation,
	});

	if (!result.ok) {
		return `Error: ${result.error}`;
	}

	emit({
		type: "assessment_change",
		data: {
			pillar: params.pillar,
			criterion: params.criterion,
			status: params.status,
			evidence: params.evidence,
		},
	});

	return `Updated: ${params.pillar}/${params.criterion} → ${params.status}`;
}

// ── get_assessment_state ───────────────────────────────────────────────────

/**
 * Returns current assessment state so the agent knows what has been covered.
 * Includes evaluated, remaining, ready, needs_validation, and needs_attention
 * counts.
 */
export function get_assessment_state(): string {
	const counts = useAssessmentStore.getState().getAssessmentState();
	return `${counts.ready} Ready · ${counts.needsValidation} Needs Validation · ${counts.needsAttention} Needs Attention · ${counts.remaining} Pending`;
}

// ── complete_assessment ───────────────────────────────────────────────────

/**
 * Ends the review and triggers report generation. Sets the completion flag
 * in the assessment store. The UI watches this flag to render the report.
 */
export function complete_assessment(): string {
	useAssessmentStore.getState().completeAssessment();
	emit({
		type: "assessment_change",
		data: { completed: true },
	});
	return "Assessment complete. Generating report…";
}

// ── check_crm_health ───────────────────────────────────────────────────────

const CRM_TIMEOUT_MS = 5000;

/**
 * Simulated dependency check. Always returns a timeout after a delay to
 * demonstrate the failure path. Emits a tool_failure trace event and
 * records the failure in the metrics store.
 *
 * The agent should mark the relevant criterion as Needs Validation
 * (unverified), not Needs Attention (broken).
 */
export async function check_crm_health(): Promise<string> {
	const callStart = Date.now();

	emit({
		type: "tool_call",
		data: { tool: "check_crm_health" },
	});

	const { promise, resolve } = Promise.withResolvers<void>();
	setTimeout(resolve, CRM_TIMEOUT_MS);
	await promise;

	const duration = Date.now() - callStart;

	useMetricsStore.getState().recordToolDuration(duration);
	useMetricsStore.getState().recordToolFailure();

	emit({
		type: "tool_failure",
		durationMs: duration,
		data: {
			tool: "check_crm_health",
			error: "Request timed out after 5000ms",
		},
	});

	return `Error: CRM health check timed out after ${duration}ms. The integration could not be verified — mark as Needs Validation, not broken.`;
}

// ── Tool registry ──────────────────────────────────────────────────────────

/**
 * The complete set of client tools registered with the ElevenLabs agent.
 * Each tool name MUST match the name configured on the agent dashboard.
 */
export const clientTools = {
	update_readiness_item,
	get_assessment_state,
	complete_assessment,
	check_crm_health,
} as const;

export type ClientToolName = keyof typeof clientTools;

/**
 * Helper: get all assessment items for report generation.
 */
export function getAllAssessmentItems(): AssessmentItem[] {
	return Object.values(useAssessmentStore.getState().criteria);
}
