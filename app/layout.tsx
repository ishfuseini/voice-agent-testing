import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
	title: "Voice Agent Readiness Review",
	description: "A voice agent that assesses voice-agent production readiness",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" className="h-full antialiased">
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=Elms+Sans:wght@400;500;600&display=swap"
				/>
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=Fragment+Mono:wght@400;500&display=swap"
				/>
			</head>
			<body className="min-h-full flex flex-col">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
