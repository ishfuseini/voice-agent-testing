"use client";

import {
	AlertTriangle,
	Circle,
	FlaskConical,
	Mic,
	Phone,
	PhoneOff,
	Square,
	Volume2,
} from "lucide-react";
import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
} from "@/components/ui/conversation";
import { Message, MessageContent } from "@/components/ui/message";
import { type AgentState, Orb } from "@/components/ui/orb";
import { useReadinessConversation } from "@/lib/useConversation";
import type { SampleSessionControls } from "@/lib/useSampleSession";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session";

// Preserves the incumbent Start Conversation brand treatment (pink outline).
const BRAND_OUTLINE =
	"border-primary bg-transparent text-primary hover:border-primary hover:bg-transparent dark:border-primary dark:bg-transparent dark:hover:border-primary dark:hover:bg-transparent";

function AgentStateBadge({
	status,
	isSpeaking,
	isListening,
	isSample,
}: {
	status: string;
	isSpeaking: boolean;
	isListening: boolean;
	isSample: boolean;
}) {
	if (isSample) {
		return (
			<Badge
				className="gap-1.5 border-primary/40 bg-primary/10 text-primary"
				variant="outline"
			>
				<FlaskConical className="size-3" />
				Sample session
			</Badge>
		);
	}
	if (status === "error") {
		return (
			<Badge variant="destructive" className="gap-1.5">
				<Circle className="size-3 fill-current" />
				Error
			</Badge>
		);
	}
	if (status === "connecting") {
		return (
			<Badge variant="secondary" className="gap-1.5">
				<Circle className="size-3 animate-pulse" />
				Connecting…
			</Badge>
		);
	}
	if (status === "disconnected") {
		return (
			<Badge variant="outline" className="gap-1.5">
				<Circle className="size-3 text-muted-foreground" />
				Idle
			</Badge>
		);
	}
	// connected
	if (isSpeaking) {
		return (
			<Badge className="gap-1.5 bg-info/10 text-info">
				<Volume2 className="size-3" />
				Speaking
			</Badge>
		);
	}
	if (isListening) {
		return (
			<Badge className="gap-1.5 bg-success/10 text-success">
				<Mic className="size-3" />
				Listening
			</Badge>
		);
	}
	return (
		<Badge variant="secondary" className="gap-1.5">
			<Circle className="size-3 text-muted-foreground" />
			Connected
		</Badge>
	);
}

export type ConversationPanelProps = ComponentProps<typeof Card> & {
	sample: SampleSessionControls;
};

export function ConversationPanel({
	sample,
	className,
	...props
}: ConversationPanelProps) {
	const { status, isSpeaking, isListening, startSession, endSession, agentId } =
		useReadinessConversation();
	const transcript = useSessionStore((s) => s.transcript);
	const sessionStatus = useSessionStore((s) => s.status);
	const isSample = useSessionStore((s) => s.isSample);
	const error = useSessionStore((s) => s.error);

	const sampleActive = isSample && sessionStatus === "active";
	const isConnecting = status === "connecting";
	const isConnected = status === "connected";

	const orbState: AgentState = sampleActive
		? sample.phase
		: isConnecting
			? "thinking"
			: isSpeaking
				? "talking"
				: isListening
					? "listening"
					: isConnected
						? "thinking"
						: null;

	return (
		<Card
			className={cn("flex h-full flex-col bg-muted/50", className)}
			{...props}
		>
			<CardHeader className="pb-2">
				<h2 className="font-heading text-2xl font-bold tracking-tight">
					Conversation
				</h2>
			</CardHeader>

			{(error || status === "error") && (
				<div
					className="mx-4 flex flex-wrap items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm"
					role="alert"
				>
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
					<div className="min-w-0 flex-1 space-y-0.5">
						<p className="font-medium">The conversation couldn't start.</p>
						<p className="text-muted-foreground">
							{error ??
								"Something went wrong connecting to the agent. Check your microphone permission and try again."}
						</p>
					</div>
					<Button onClick={startSession} size="sm" variant="outline">
						Try again
					</Button>
				</div>
			)}

			<CardContent className="flex min-h-0 flex-1 flex-col items-stretch gap-4 overflow-hidden p-4 pt-0 sm:flex-row sm:items-center sm:p-0">
				<div className="flex w-full shrink-0 items-center justify-center gap-3 sm:w-1/3 sm:flex-col sm:gap-4">
					<Orb
						className="size-24 sm:size-30"
						colors={["#B3B8F0", "#F092DD"]}
						agentState={orbState}
					/>
					<div aria-live="polite" role="status">
						<AgentStateBadge
							status={status}
							isSpeaking={isSpeaking}
							isListening={isListening}
							isSample={isSample}
						/>
					</div>
				</div>
				{transcript.length === 0 ? (
					<div className="flex min-h-40 w-full flex-1 items-center justify-center sm:h-full sm:min-h-0 sm:w-2/3">
						<ConversationEmptyState>
							<div className="max-w-sm space-y-2">
								<h3 className="font-heading text-base font-medium">
									Run a readiness review
								</h3>
								<p className="text-muted-foreground text-sm">
									Nine production criteria — latency, tool calling, and
									observability — assessed one question at a time. Evidence is
									recorded as the review runs, and a readiness report is
									generated at the end.
								</p>
								{!agentId && (
									<p className="text-muted-foreground/80 text-xs">
										Run the sample session to watch a full review end to end.
										Connect a live agent with NEXT_PUBLIC_ELEVENLABS_AGENT_ID to
										review your own deployment.
									</p>
								)}
							</div>
						</ConversationEmptyState>
					</div>
				) : (
					<Conversation className="h-full min-h-40 w-full flex-1 sm:min-h-0 sm:w-2/3">
						<ConversationContent>
							{transcript.map((entry) => (
								<Message
									key={entry.id}
									from={entry.speaker === "user" ? "user" : "assistant"}
								>
									<MessageContent variant="contained">
										{entry.text}
									</MessageContent>
								</Message>
							))}
						</ConversationContent>
					</Conversation>
				)}
			</CardContent>

			<CardFooter className="justify-center gap-2">
				{sampleActive ? (
					<Button
						className="w-full"
						onClick={sample.stop}
						size="lg"
						variant="destructive"
					>
						<Square className="size-4" />
						Stop sample session
					</Button>
				) : isConnecting ? (
					<Button className="w-full" disabled size="lg" variant="secondary">
						<Circle className="size-4 animate-pulse" />
						Connecting…
					</Button>
				) : isConnected ? (
					<Button
						className="w-full"
						onClick={endSession}
						size="lg"
						variant="destructive"
					>
						<PhoneOff className="size-4" />
						End Conversation
					</Button>
				) : agentId ? (
					<>
						<Button
							className={cn("flex-1", BRAND_OUTLINE)}
							onClick={startSession}
							size="lg"
							variant="outline"
						>
							<Phone className="size-4" />
							Start Conversation
						</Button>
						<Button
							className="flex-1"
							onClick={sample.start}
							size="lg"
							variant="ghost"
						>
							<FlaskConical className="size-4" />
							Sample session
						</Button>
					</>
				) : (
					<Button
						className={cn("w-full", BRAND_OUTLINE)}
						onClick={sample.start}
						size="lg"
						variant="outline"
					>
						<FlaskConical className="size-4" />
						Run sample session
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}
