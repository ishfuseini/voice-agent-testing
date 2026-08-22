import { ConversationPanel } from "@/components/conversation-panel";
import { ReadinessPanel } from "@/components/readiness-panel";
import { ReadinessReport } from "@/components/readiness-report";
import { SessionMetricsPanel } from "@/components/session-metrics";
import { TracePanel } from "@/components/trace-panel";

export default function Home() {
	return (
		<div className="flex h-dvh flex-col bg-background">
			<header className="border-b px-6 py-3">
				<h1 className="font-heading text-lg font-semibold">
					Voice Agent Readiness Review
				</h1>
			</header>
			<main className="grid flex-1 grid-cols-2 gap-3 overflow-hidden px-6 pb-6 pt-6">
				<ConversationPanel className="min-h-0" />
				<div className="grid min-h-0 grid-cols-2 grid-rows-[auto_1fr_1fr] gap-3">
					<SessionMetricsPanel className="col-span-2 min-h-0" />
					<ReadinessPanel className="min-h-0" />
					<TracePanel className="min-h-0" />
					<ReadinessReport className="col-span-2 min-h-0" />
				</div>
			</main>
		</div>
	);
}
