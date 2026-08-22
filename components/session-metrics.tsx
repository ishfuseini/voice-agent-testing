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
		<div className="flex items-center gap-2">
			<div
				className={cn(
					"flex items-center gap-2 rounded-md border px-3 py-1.5",
					iconClass,
				)}
			>
				<div className="flex size-6 items-center justify-center">
					<Icon className="size-4" />
				</div>
				<span className="font-sans text-sm font-medium tabular-nums">
					{value}
				</span>
			</div>
			<span className="font-sans text-sm font-medium">{label}</span>
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
		<Card className={cn("flex flex-col ring-[#c4ecd2]", className)} {...props}>
			<CardContent className="flex flex-wrap items-center justify-center gap-6 p-1.5">
				<MetricBadge
					icon={Clock}
					label="Latency (Median)"
					value={formatMs(metrics.firstAudioP50)}
					iconClass="bg-blue-500/10 text-blue-500"
				/>
				<MetricBadge
					icon={Clock}
					label="Latency (Peak)"
					value={formatMs(metrics.firstAudioP95)}
					iconClass="bg-indigo-500/10 text-indigo-500"
				/>
				<MetricBadge
					icon={Wrench}
					label="Tool Response (Median)"
					value={formatMs(metrics.toolDurationP50)}
					iconClass="bg-purple-500/10 text-purple-500"
				/>
				<MetricBadge
					icon={AlertOctagon}
					label="Tool Failures"
					value={String(metrics.toolFailureCount)}
					iconClass={cn(
						"bg-red-500/5 text-red-400",
						metrics.toolFailureCount === 0 && "bg-red-500/5 text-red-400/50",
					)}
				/>
			</CardContent>
		</Card>
	);
}
