"use client";

import { Check, Copy, Download } from "lucide-react";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Response } from "@/components/ui/response";
import { generateReport } from "@/lib/report";
import { getAllAssessmentItems } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { countAssessment, useAssessmentStore } from "@/stores/assessment";
import { useSessionStore } from "@/stores/session";

function buildMarkdown(): string {
	const counts = useAssessmentStore.getState().getAssessmentState();
	return generateReport(getAllAssessmentItems(), counts);
}

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

/**
 * The completion stage: the readiness report at full height with its state
 * summary and export actions. `SessionStage` mounts this only once the
 * assessment is complete, so it renders the report unconditionally.
 */
export function ReadinessReport({ className, ...props }: ReadinessReportProps) {
	const criteria = useAssessmentStore((s) => s.criteria);
	const isSample = useSessionStore((s) => s.isSample);
	const [copied, setCopied] = useState(false);

	const counts = countAssessment(criteria);

	useEffect(() => {
		if (!copied) return;
		const timeout = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(timeout);
	}, [copied]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(buildMarkdown());
			setCopied(true);
		} catch {
			// Clipboard blocked — the export button remains available.
		}
	};

	const handleExport = () => {
		const date = new Date().toISOString().split("T")[0];
		downloadMarkdown(
			buildMarkdown(),
			`readiness-report${isSample ? "-sample" : ""}-${date}.md`,
		);
	};

	return (
		<Card
			className={cn("flex h-full flex-col ring-primary/25", className)}
			{...props}
		>
			<CardHeader>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0 space-y-1.5">
						<div className="flex items-center gap-2">
							<h2 className="font-heading text-xl font-bold tracking-tight">
								Readiness Report
							</h2>
							{isSample && (
								<Badge
									className="border-primary/40 bg-primary/10 text-primary"
									variant="outline"
								>
									Sample
								</Badge>
							)}
						</div>
						<p className="text-muted-foreground text-sm">
							Review complete · {counts.ready} Ready · {counts.needsValidation}{" "}
							Needs Validation · {counts.needsAttention} Needs Attention
						</p>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<Button onClick={handleCopy} size="sm" variant="outline">
							{copied ? (
								<Check className="size-4" />
							) : (
								<Copy className="size-4" />
							)}
							{copied ? "Copied" : "Copy"}
						</Button>
						<Button onClick={handleExport} size="sm" variant="outline">
							<Download className="size-4" />
							Export Markdown
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="min-h-0 flex-1 overflow-y-auto">
				<ReportContent />
			</CardContent>
		</Card>
	);
}

function ReportContent() {
	const criteria = useAssessmentStore((s) => s.criteria);
	const markdown = generateReport(
		Object.values(criteria),
		countAssessment(criteria),
	);

	return <Response>{markdown}</Response>;
}
