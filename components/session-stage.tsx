"use client";

import { useEffect, useState } from "react";
import { ConversationPanel } from "@/components/conversation-panel";
import { ReadinessReport } from "@/components/readiness-report";
import { Button } from "@/components/ui/button";
import { useSampleSession } from "@/lib/useSampleSession";
import { cn } from "@/lib/utils";
import { useAssessmentStore } from "@/stores/assessment";

/**
 * The primary column. It holds the conversation while the review runs and
 * hands the stage to the readiness report when the review completes, so the
 * outcome gets the largest surface on the page. The report toggle keeps the
 * transcript and the session controls one click away.
 *
 * The sample session lives here rather than inside the conversation panel so a
 * running scripted review keeps playing while the report view is shown.
 */

type StageView = "conversation" | "report";

export function SessionStage({ className }: { className?: string }) {
	const completed = useAssessmentStore((s) => s.completed);
	const sample = useSampleSession();
	const [view, setView] = useState<StageView>("conversation");

	useEffect(() => {
		if (completed) setView("report");
	}, [completed]);

	const showReport = completed && view === "report";

	return (
		<div className={cn("flex min-h-0 flex-col gap-3", className)}>
			{completed && (
				<div className="flex shrink-0 justify-center">
					<div className="inline-flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
						<Button
							aria-pressed={showReport}
							className="h-7 px-3"
							onClick={() => setView("report")}
							size="sm"
							variant={showReport ? "secondary" : "ghost"}
						>
							Readiness report
						</Button>
						<Button
							aria-pressed={!showReport}
							className="h-7 px-3"
							onClick={() => setView("conversation")}
							size="sm"
							variant={showReport ? "ghost" : "secondary"}
						>
							Conversation
						</Button>
					</div>
				</div>
			)}

			{showReport ? (
				<ReadinessReport className="min-h-[20rem] w-full flex-1 ring-primary/40 xl:min-h-0" />
			) : (
				<ConversationPanel
					className="min-h-[32rem] w-full flex-1 ring-primary/40 xl:min-h-0"
					sample={sample}
				/>
			)}
		</div>
	);
}
