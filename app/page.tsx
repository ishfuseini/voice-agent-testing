import { ConversationPanel } from "@/components/conversation-panel";
import { ReadinessPanel } from "@/components/readiness-panel";
import { ReadinessReport } from "@/components/readiness-report";
import { SessionMetricsPanel } from "@/components/session-metrics";
import { TracePanel } from "@/components/trace-panel";
import Image from "next/image";

export default function Home() {
	return (
		<div className="flex h-dvh flex-col bg-background">
			<header className="flex items-center gap-3 border-b-2 border-[#8A2BE2] p-8">
				<Image
					src="/assets/ish-avatar.png"
					alt="Avatar"
					width={48}
					height={48}
					className="rounded-full"
				/>
				<div className="flex flex-col">
					<h1 className="font-heading text-xl font-bold">
						Voice Agent Readiness Review
					</h1>
					<hr className="my-1" />
					<span className="font-heading text-base font-light text-muted-foreground">An ishlabs Production</span>
				</div>
			<p className="font-heading text-xl font-light italic text-muted-foreground ml-auto text-right">
				A voice agent that conducts a production-readiness review of a voice-agent deployment — conversationally, not as a checklist read aloud.
			</p>
		</header>
			<main className="grid flex-1 grid-cols-2 gap-3 overflow-hidden px-6 pb-6 pt-6">
				<div className="flex min-h-0 items-center justify-center">
					<ConversationPanel className="min-h-0 max-h-[85%] w-full max-w-[90%]" />
				</div>
				<div className="grid min-h-0 grid-cols-2 grid-rows-[auto_1fr_1fr] gap-3 py-4">
					<SessionMetricsPanel className="col-span-2 min-h-0 bg-muted/50" />
					<ReadinessPanel className="min-h-0 bg-muted/50" />
					<TracePanel className="min-h-0 bg-muted/50" />
					<ReadinessReport className="col-span-2 min-h-0 bg-muted/50" />
				</div>
			</main>
		</div>
	);
}
