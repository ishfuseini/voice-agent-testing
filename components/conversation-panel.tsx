"use client";

import { Circle, Mic, Phone, PhoneOff, Volume2 } from "lucide-react";
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
import { Orb, type AgentState } from "@/components/ui/orb";
import { Message, MessageContent } from "@/components/ui/message";
import { useReadinessConversation } from "@/lib/useConversation";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session";

function AgentStateBadge({
	status,
	isSpeaking,
	isListening,
}: {
	status: string;
	isSpeaking: boolean;
	isListening: boolean;
}) {
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
			<Badge className="gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400">
				<Volume2 className="size-3" />
				Speaking
			</Badge>
		);
	}
	if (isListening) {
		return (
			<Badge className="gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400">
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

export type ConversationPanelProps = ComponentProps<typeof Card>;

export function ConversationPanel({
	className,
	...props
}: ConversationPanelProps) {
	const { status, isSpeaking, isListening, startSession, endSession, agentId } =
		useReadinessConversation();
	const transcript = useSessionStore((s) => s.transcript);

	const isIdle = status === "disconnected" || status === "error";
	const isConnecting = status === "connecting";
	const isConnected = status === "connected";

	const orbState: AgentState = isConnecting
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
			className={cn(
				"flex h-full flex-col border-[#8A2BE2] bg-muted/50",
				className,
			)}
			{...props}
		>
			<CardHeader>
				<div className="font-heading text-xl font-medium underline underline-offset-8">Conversation</div>
			</CardHeader>

			<CardContent className="flex flex-1 items-center overflow-hidden p-0">
				<div className="flex w-1/3 flex-col items-center justify-center gap-4">
					<Orb
						className="h-30 w-30"
						colors={["#00FF9C", "#04756F"]}
						agentState={orbState}
					/>
					<AgentStateBadge
						status={status}
						isSpeaking={isSpeaking}
						isListening={isListening}
					/>
				</div>
				{transcript.length === 0 ? (
					<div className="flex h-full w-2/3 items-center justify-center">
						<ConversationEmptyState
							title="No conversation yet"
							description={
								agentId
									? "Click Start to begin the readiness review"
								: "Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID to begin"
						}
						/>
					</div>
				) : (
					<Conversation className="h-full w-2/3">
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

			<CardFooter className="justify-center">
				{isIdle && (
					<Button
						className="w-full border-[#8A2BE2] bg-transparent text-[#8A2BE2] hover:bg-transparent hover:border-[#8A2BE2]"
						variant="outline"
						disabled={!agentId || isConnecting}
						onClick={startSession}
						size="lg"
					>
						<Phone className="size-4" />
						Start Conversation
					</Button>
				)}
				{isConnecting && (
					<Button className="w-full" disabled size="lg" variant="secondary">
						<Circle className="size-4 animate-pulse" />
						Connecting…
					</Button>
				)}
				{isConnected && (
					<Button
						className="w-full"
						onClick={endSession}
						size="lg"
						variant="destructive"
					>
						<PhoneOff className="size-4" />
						End Conversation
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}
