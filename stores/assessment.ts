import { create } from "zustand";
import { pillars } from "@/lib/criteria";
import type { AssessmentItem } from "@/lib/types";
import { CriterionState } from "@/lib/types";

export interface AssessmentCounts {
	evaluated: number;
	remaining: number;
	ready: number;
	needsValidation: number;
	needsAttention: number;
}

export type UpdateReadinessItemResult =
	| { ok: true }
	| { ok: false; error: string };

export interface UpdateReadinessItemArgs {
	pillarKey: string;
	criterionKey: string;
	status: CriterionState;
	evidence?: string;
	recommendation?: string;
}

interface AssessmentState {
	criteria: Record<string, AssessmentItem>;
	completed: boolean;
	updateReadinessItem: (
		args: UpdateReadinessItemArgs,
	) => UpdateReadinessItemResult;
	getAssessmentState: () => AssessmentCounts;
	completeAssessment: () => void;
}

function buildInitialCriteria(): Record<string, AssessmentItem> {
	const criteria: Record<string, AssessmentItem> = {};
	for (const pillar of pillars) {
		for (const criterion of pillar.criteria) {
			criteria[criterion.key] = {
				pillarKey: criterion.pillarKey,
				criterionKey: criterion.key,
				state: criterion.initialState,
			};
		}
	}
	return criteria;
}

export const useAssessmentStore = create<AssessmentState>()((set, get) => ({
	criteria: buildInitialCriteria(),
	completed: false,

	updateReadinessItem: ({
		pillarKey,
		criterionKey,
		status,
		evidence,
		recommendation,
	}) => {
		const current = Object.hasOwn(get().criteria, criterionKey)
			? get().criteria[criterionKey]
			: undefined;
		if (!current) {
			return { ok: false, error: `Unknown criterion: ${criterionKey}` };
		}
		if (current.pillarKey !== pillarKey) {
			return {
				ok: false,
				error: `Criterion "${criterionKey}" does not belong to pillar "${pillarKey}"`,
			};
		}
		set((state) => ({
			criteria: {
				...state.criteria,
				[criterionKey]: {
					...state.criteria[criterionKey],
					state: status,
					evidence,
					recommendation,
				},
			},
		}));
		return { ok: true };
	},

	getAssessmentState: () => {
		const counts: AssessmentCounts = {
			evaluated: 0,
			remaining: 0,
			ready: 0,
			needsValidation: 0,
			needsAttention: 0,
		};
		for (const item of Object.values(get().criteria)) {
			switch (item.state) {
				case CriterionState.Ready:
					counts.ready += 1;
					counts.evaluated += 1;
					break;
				case CriterionState.NeedsValidation:
					counts.needsValidation += 1;
					counts.evaluated += 1;
					break;
				case CriterionState.NeedsAttention:
					counts.needsAttention += 1;
					counts.evaluated += 1;
					break;
				case CriterionState.Unevaluated:
					counts.remaining += 1;
					break;
			}
		}
		return counts;
	},

	completeAssessment: () => {
		set({ completed: true });
	},
}));
