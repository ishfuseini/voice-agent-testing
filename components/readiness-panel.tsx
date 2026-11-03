"use client";

import {
	AlertTriangle,
	CheckCircle,
	Circle,
	HelpCircle,
	type LucideIcon,
} from "lucide-react";
import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { pillars } from "@/lib/criteria";
import type { AssessmentItem } from "@/lib/types";
import { CriterionState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAssessmentStore } from "@/stores/assessment";

interface StateConfig {
	label: string;
	icon: LucideIcon;
	iconClass: string;
	badgeClass: string;
}

const STATE_CONFIGS: Record<CriterionState, StateConfig> = {
	[CriterionState.Ready]: {
		label: "Ready",
		icon: CheckCircle,
		iconClass: "text-success",
		badgeClass: "bg-success/10 text-success border-success/20",
	},
	[CriterionState.NeedsValidation]: {
		label: "Needs Validation",
		icon: HelpCircle,
		iconClass: "text-warning",
		badgeClass: "bg-warning/10 text-warning border-warning/20",
	},
	[CriterionState.NeedsAttention]: {
		label: "Needs Attention",
		icon: AlertTriangle,
		iconClass: "text-destructive",
		badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
	},
	[CriterionState.Unevaluated]: {
		label: "Pending",
		icon: Circle,
		iconClass: "text-muted-foreground",
		badgeClass: "bg-muted text-muted-foreground",
	},
};

export type ReadinessPanelProps = ComponentProps<typeof Card>;

export function ReadinessPanel({ className, ...props }: ReadinessPanelProps) {
	const criteria = useAssessmentStore((s) => s.criteria);
	const getAssessmentState = useAssessmentStore((s) => s.getAssessmentState);

	const counts = getAssessmentState();

	return (
		<Card
			className={cn("flex h-full flex-col ring-primary/25", className)}
			{...props}
		>
			<CardHeader className="gap-3">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<h2 className="font-heading text-xl font-bold tracking-tight">
						Production Readiness
					</h2>
					<div
						aria-live="polite"
						className="flex flex-wrap gap-1.5 font-sans"
						role="status"
					>
						<Badge
							variant="outline"
							className={cn(
								"gap-1 text-[11px]",
								STATE_CONFIGS[CriterionState.Ready].badgeClass,
							)}
						>
							{counts.ready} Ready
						</Badge>
						<Badge
							variant="outline"
							className={cn(
								"gap-1 text-[11px]",
								STATE_CONFIGS[CriterionState.NeedsValidation].badgeClass,
							)}
						>
							{counts.needsValidation} Needs Validation
						</Badge>
						<Badge
							variant="outline"
							className={cn(
								"gap-1 text-[11px]",
								STATE_CONFIGS[CriterionState.NeedsAttention].badgeClass,
							)}
						>
							{counts.needsAttention} Needs Attention
						</Badge>
					</div>
				</div>
			</CardHeader>

			<CardContent className="flex-1 space-y-4 overflow-y-auto">
				{pillars.map((pillar, index) => (
					<div key={pillar.key} className="space-y-2">
						{index > 0 && <Separator className="mb-2" />}
						<div className="font-medium text-sm">{pillar.name}</div>
						<div className="space-y-1">
							{pillar.criteria.map((criterion) => {
								const item: AssessmentItem | undefined =
									criteria[criterion.key];
								const state = item?.state ?? criterion.initialState;
								const config =
									STATE_CONFIGS[state as keyof typeof STATE_CONFIGS];
								const Icon = config.icon;
								return (
									<div
										key={criterion.key}
										className="flex items-center gap-2 py-1"
									>
										<Icon className={cn("size-4 shrink-0", config.iconClass)} />
										<span className="flex-1 text-sm">{criterion.name}</span>
										<Badge
											variant="outline"
											className={cn("text-xs", config.badgeClass)}
										>
											{config.label}
										</Badge>
									</div>
								);
							})}
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
