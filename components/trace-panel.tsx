"use client";

import {
	Activity,
	AlertOctagon,
	ClipboardCheck,
	Clock,
	type LucideIcon,
	MessageSquare,
	Phone,
	PhoneOff,
	Wrench,
} from "lucide-react";
import type { ComponentProps } from "react";
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { EventType, TraceEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTraceStore } from "@/stores/trace";

interface EventConfig {
	icon: LucideIcon;
	label: string;
	containerClass: string;
}

// Semantic severity roles, shared with the assessment state ladder, so a trace
// event never introduces a hue the rest of the product does not use.
const NEUTRAL_CLASS = "border-l-muted-foreground/30";
const INFO_CLASS = "border-l-info bg-info/5 text-info";
const SUCCESS_CLASS = "border-l-success bg-success/5 text-success";
const WARNING_CLASS = "border-l-warning bg-warning/5 text-warning";
const DANGER_CLASS = "border-l-destructive bg-destructive/5 text-destructive";

const ASSESSMENT_CHANGE_CONFIG: EventConfig = {
	icon: ClipboardCheck,
	label: "Assessment Change",
	containerClass: INFO_CLASS,
};

const EVENT_CONFIGS: Partial<Record<EventType, EventConfig>> = {
	conversation_start: {
		icon: Phone,
		label: "Conversation Start",
		containerClass: NEUTRAL_CLASS,
	},
	conversation_end: {
		icon: PhoneOff,
		label: "Conversation End",
		containerClass: NEUTRAL_CLASS,
	},
	speech_detected: {
		icon: MessageSquare,
		label: "User Speech",
		containerClass: NEUTRAL_CLASS,
	},
	agent_response: {
		icon: MessageSquare,
		label: "Agent Response",
		containerClass: NEUTRAL_CLASS,
	},
	tool_call: {
		icon: Wrench,
		label: "Tool Call",
		containerClass: INFO_CLASS,
	},
	tool_result: {
		icon: Wrench,
		label: "Tool Result",
		containerClass: INFO_CLASS,
	},
	assessment_change: ASSESSMENT_CHANGE_CONFIG,
	latency: {
		icon: Clock,
		label: "Latency",
		containerClass: INFO_CLASS,
	},
};

const TOOL_FAILURE_CONFIG: EventConfig = {
	icon: AlertOctagon,
	label: "Tool Failure",
	containerClass: DANGER_CLASS,
};

const ASSESSMENT_STATUS_CLASSES: Record<string, string> = {
	ready: SUCCESS_CLASS,
	needs_validation: WARNING_CLASS,
	needs_attention: DANGER_CLASS,
};

const DEFAULT_CONFIG: EventConfig = {
	icon: Activity,
	label: "",
	containerClass: NEUTRAL_CLASS,
};

function getEventConfig(event: TraceEvent): EventConfig {
	if (event.type === "tool_failure") {
		return TOOL_FAILURE_CONFIG;
	}
	// A criterion change takes the colour of the state it produced.
	if (event.type === "assessment_change") {
		const status = event.data?.status;
		const statusClass =
			typeof status === "string"
				? ASSESSMENT_STATUS_CLASSES[status]
				: undefined;
		if (statusClass) {
			return { ...ASSESSMENT_CHANGE_CONFIG, containerClass: statusClass };
		}
	}
	return (
		EVENT_CONFIGS[event.type] ?? {
			...DEFAULT_CONFIG,
			label: event.type,
		}
	);
}

function formatTime(timestamp: number): string {
	const date = new Date(timestamp);
	const h = String(date.getHours()).padStart(2, "0");
	const m = String(date.getMinutes()).padStart(2, "0");
	const s = String(date.getSeconds()).padStart(2, "0");
	const ms = String(date.getMilliseconds()).padStart(3, "0");
	return `${h}:${m}:${s}.${ms}`;
}

function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function formatData(data: Record<string, unknown> | undefined): string | null {
	if (!data || Object.keys(data).length === 0) return null;
	const parts: string[] = [];
	for (const [key, value] of Object.entries(data)) {
		if (
			typeof value === "string" ||
			typeof value === "number" ||
			typeof value === "boolean"
		) {
			parts.push(`${key}: ${value}`);
		} else {
			parts.push(`${key}: ${JSON.stringify(value)}`);
		}
	}
	return parts.length > 0 ? parts.join(" · ") : null;
}

export type TracePanelProps = ComponentProps<typeof Card>;

export function TracePanel({ className, ...props }: TracePanelProps) {
	const events = useTraceStore((s) => s.events);
	const scrollRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-run on new events to auto-scroll
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [events]);

	return (
		<Card
			className={cn("flex h-full flex-col ring-primary/25", className)}
			{...props}
		>
			<CardHeader>
				<div className="flex items-center justify-between">
					<h2 className="font-heading text-xl font-bold tracking-tight">
						Trace
					</h2>
					<div className="text-muted-foreground text-xs tabular-nums">
						{events.length} events
					</div>
				</div>
			</CardHeader>
			<CardContent className="flex-1 overflow-y-auto p-0" ref={scrollRef}>
				{events.length === 0 ? (
					<div className="text-muted-foreground flex h-full items-center justify-center p-8 text-center text-sm">
						Events appear here as the review runs — speech, tool calls, and
						state changes, each timestamped.
					</div>
				) : (
					<div className="space-y-1 p-2">
						{events.map((event) => {
							const config = getEventConfig(event);
							const Icon = config.icon;
							const dataStr = formatData(event.data);
							return (
								<div
									key={event.id}
									className={cn(
										"flex items-start gap-2 border-l-2 p-2 text-xs",
										config.containerClass,
									)}
								>
									<Icon className="mt-0.5 size-3 shrink-0" />
									<div className="min-w-0 flex-1 space-y-0.5">
										<div className="flex items-center gap-2">
											<span className="font-medium">{config.label}</span>
											{event.durationMs !== undefined && (
												<span className="text-muted-foreground tabular-nums">
													{formatDuration(event.durationMs)}
												</span>
											)}
										</div>
										{dataStr && (
											<div className="text-muted-foreground truncate">
												{dataStr}
											</div>
										)}
									</div>
									<span className="text-muted-foreground shrink-0 tabular-nums">
										{formatTime(event.timestamp)}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
