"use client";

import { AlertOctagon, Clock, Wrench } from "lucide-react";
import type { ComponentProps } from "react";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { computeSessionMetrics } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import { useMetricsStore } from "@/stores/metrics";

function formatMs(ms: number | null): string {
	if (ms === null) return "—";
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function MetricBadge({
	icon: Icon,
	label,
	value,
	iconClass,
}: {
	icon: typeof Clock;
	label: string;
	value: string;
	iconClass: string;
}) {
	return (
		<div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
			<div
				className={cn(
					"flex items-center gap-2 rounded-md border px-2.5 py-1.5",
					iconClass,
				)}
			>
				<Icon className="size-4" aria-hidden="true" />
				<span className="font-sans text-sm font-medium tabular-nums">
					{value}
				</span>
			</div>
			<span className="font-sans text-xs leading-tight text-muted-foreground sm:text-sm">
				{label}
			</span>
		</div>
	);
}

export type SessionMetricsPanelProps = ComponentProps<typeof Card>;

export function SessionMetricsPanel({
	className,
	...props
}: SessionMetricsPanelProps) {
	const firstAudioLatencies = useMetricsStore((s) => s.firstAudioLatencies);
	const toolDurations = useMetricsStore((s) => s.toolDurations);
	const toolFailureCount = useMetricsStore((s) => s.toolFailureCount);

	const metrics = useMemo(
		() =>
			computeSessionMetrics(
				firstAudioLatencies,
				toolDurations,
				toolFailureCount,
			),
		[firstAudioLatencies, toolDurations, toolFailureCount],
	);

	return (
		<Card className={cn("flex flex-col ring-primary/25", className)} {...props}>
			<CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
				<MetricBadge
					icon={Clock}
					label="Latency (Median)"
					value={formatMs(metrics.firstAudioP50)}
					iconClass="bg-info/10 text-info"
				/>
				<MetricBadge
					icon={Clock}
					label="Latency (Peak)"
					value={formatMs(metrics.firstAudioP95)}
					iconClass="bg-info/10 text-info"
				/>
				<MetricBadge
					icon={Wrench}
					label="Tool Response (Median)"
					value={formatMs(metrics.toolDurationP50)}
					iconClass="bg-info/10 text-info"
				/>
				<MetricBadge
					icon={AlertOctagon}
					label="Tool Failures"
					value={String(metrics.toolFailureCount)}
					iconClass={cn(
						"bg-muted text-muted-foreground",
						metrics.toolFailureCount > 0 &&
							"bg-destructive/10 text-destructive",
					)}
				/>
			</CardContent>
		</Card>
	);
}
