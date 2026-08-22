import { create } from "zustand";
import type { LatencySample } from "@/lib/types";

function makeSample(valueMs: number): LatencySample {
	return { timestamp: Date.now(), valueMs };
}

interface MetricsState {
	firstAudioLatencies: LatencySample[];
	toolDurations: LatencySample[];
	toolFailureCount: number;
	recordFirstAudioLatency: (valueMs: number) => void;
	recordToolDuration: (valueMs: number) => void;
	recordToolFailure: () => void;
	reset: () => void;
}

export const useMetricsStore = create<MetricsState>()((set) => ({
	firstAudioLatencies: [],
	toolDurations: [],
	toolFailureCount: 0,

	recordFirstAudioLatency: (valueMs) =>
		set((state) => ({
			firstAudioLatencies: [
				...state.firstAudioLatencies,
				makeSample(valueMs),
			],
		})),

	recordToolDuration: (valueMs) =>
		set((state) => ({
			toolDurations: [...state.toolDurations, makeSample(valueMs)],
		})),

	recordToolFailure: () =>
		set((state) => ({ toolFailureCount: state.toolFailureCount + 1 })),

	reset: () =>
		set({ firstAudioLatencies: [], toolDurations: [], toolFailureCount: 0 }),
}));
