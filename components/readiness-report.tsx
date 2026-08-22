"use client";

import { Download } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Response } from "@/components/ui/response";
import { generateReport } from "@/lib/report";
import { getAllAssessmentItems } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { useAssessmentStore } from "@/stores/assessment";

function downloadMarkdown(content: string, filename: string) {
	const blob = new Blob([content], { type: "text/markdown" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export type ReadinessReportProps = ComponentProps<typeof Card>;

export function ReadinessReport({ className, ...props }: ReadinessReportProps) {
	const completed = useAssessmentStore((s) => s.completed);

	const handleExport = () => {
		const items = getAllAssessmentItems();
		const counts = useAssessmentStore.getState().getAssessmentState();
		const markdown = generateReport(items, counts);
		downloadMarkdown(
			markdown,
			`readiness-report-${new Date().toISOString().split("T")[0]}.md`,
		);
	};

	return (
		<Card className={cn("flex h-full flex-col ring-[#f0dbfe]", className)} {...props}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="font-heading text-lg font-medium underline underline-offset-8">
						Readiness Report
					</div>
					{completed && (
						<Button onClick={handleExport} size="sm" variant="outline">
							<Download className="size-4" />
							Export Markdown
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="flex-1 overflow-y-auto">
				{completed ? (
					<ReportContent />
				) : (
					<div className="text-muted-foreground flex h-full items-center justify-center p-8 text-center text-sm">
						The report will appear here when the assessment is completed
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function ReportContent() {
	const criteria = useAssessmentStore((s) => s.criteria);
	const items = Object.values(criteria);
	const counts = useAssessmentStore.getState().getAssessmentState();
	const markdown = generateReport(items, counts);

	return <Response>{markdown}</Response>;
}
