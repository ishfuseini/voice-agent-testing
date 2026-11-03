import Image from "next/image";
import { ReadinessPanel } from "@/components/readiness-panel";
import { SessionMetricsPanel } from "@/components/session-metrics";
import { SessionStage } from "@/components/session-stage";
import { TracePanel } from "@/components/trace-panel";

export default function Home() {
	return (
		<div className="flex min-h-dvh flex-col bg-background xl:h-dvh xl:min-h-0">
			<header className="shrink-0 border-b border-border px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
				<div className="mx-auto flex max-w-[1600px] flex-col gap-4 sm:flex-row sm:items-center">
					<div className="flex min-w-0 items-center gap-3">
						<Image
							src="/assets/ish-avatar.png"
							alt="Illustration of Ish Fuseini"
							width={44}
							height={44}
							className="shrink-0 rounded-full ring-1 ring-border"
						/>
						<div className="min-w-0">
							<p className="font-sans text-xs font-medium uppercase tracking-[0.16em] text-primary">
								An ishlabs production
							</p>
							<h1 className="font-heading text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
								Voice Agent Readiness Review
							</h1>
						</div>
					</div>
					<p className="max-w-2xl font-sans text-base leading-relaxed text-muted-foreground sm:ml-auto sm:text-right">
						A conversational production-readiness review for voice-agent
						deployments.
					</p>
				</div>
			</header>
			<main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-6 xl:min-h-0 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:overflow-hidden">
				<SessionStage className="min-h-0" />
				<div className="grid min-h-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-rows-[auto_minmax(0,1fr)]">
					<SessionMetricsPanel className="min-h-0 bg-muted/50 md:col-span-2" />
					<ReadinessPanel className="min-h-[24rem] bg-muted/50 xl:min-h-0" />
					<TracePanel className="min-h-[24rem] bg-muted/50 xl:min-h-0" />
				</div>
			</main>
		</div>
	);
}
