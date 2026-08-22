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

const EVENT_CONFIGS: Partial<Record<EventType, EventConfig>> = {
	conversation_start: {
		icon: Phone,
		label: "Conversation Start",
		containerClass: "border-l-muted-foreground/30",
	},
	conversation_end: {
		icon: PhoneOff,
		label: "Conversation End",
		containerClass: "border-l-muted-foreground/30",
	},
	speech_detected: {
		icon: MessageSquare,
		label: "User Speech",
		containerClass: "border-l-muted-foreground/30",
	},
	agent_response: {
		icon: MessageSquare,
		label: "Agent Response",
		containerClass: "border-l-muted-foreground/30",
	},
	tool_call: {
		icon: Wrench,
		label: "Tool Call",
		containerClass:
			"border-l-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400",
	},
	tool_result: {
		icon: Wrench,
		label: "Tool Result",
		containerClass:
			"border-l-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400",
	},
	assessment_change: {
		icon: ClipboardCheck,
		label: "Assessment Change",
		containerClass:
			"border-l-purple-500 bg-purple-500/5 text-purple-600 dark:text-purple-400",
	},
	latency: {
		icon: Clock,
		label: "Latency",
		containerClass:
			"border-l-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400",
	},
};

const TOOL_FAILURE_CONFIG: EventConfig = {
	icon: AlertOctagon,
	label: "Tool Failure",
	containerClass:
		"border-l-red-500 bg-red-500/5 text-red-600 dark:text-red-400",
};

const DEFAULT_CONFIG: EventConfig = {
	icon: Activity,
	label: "",
	containerClass: "border-l-muted-foreground/30",
};

function getEventConfig(event: TraceEvent): EventConfig {
	if (event.type === "tool_failure") {
		return TOOL_FAILURE_CONFIG;
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
		<Card className={cn("flex h-full flex-col ring-[#c4ecd2]", className)} {...props}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="font-heading text-lg font-medium underline underline-offset-8">Trace</div>
					<div className="text-muted-foreground text-xs tabular-nums">
						{events.length} events
					</div>
				</div>
			</CardHeader>
			<CardContent className="flex-1 overflow-y-auto p-0" ref={scrollRef}>
				{events.length === 0 ? (
					<div className="text-muted-foreground flex h-full items-center justify-center p-8 text-center text-sm">
						No events yet — start a conversation to see the trace stream
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
									<div className="flex-1 space-y-0.5">
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
