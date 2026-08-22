import { create } from "zustand";

export type SessionStatus = "idle" | "active" | "ended";
export type Speaker = "user" | "agent";

export interface TranscriptEntry {
	id: string;
	speaker: Speaker;
	text: string;
	timestamp: number;
}

interface SessionState {
	status: SessionStatus;
	transcript: TranscriptEntry[];
	startedAt: number | null;
	endedAt: number | null;
	start: () => void;
	end: () => void;
	reset: () => void;
	appendTranscript: (entry: { speaker: Speaker; text: string }) => void;
}

let transcriptSequence = 0;

export const useSessionStore = create<SessionState>()((set) => ({
	status: "idle",
	transcript: [],
	startedAt: null,
	endedAt: null,

	start: () => {
		transcriptSequence = 0;
		set({
			status: "active",
			transcript: [],
			startedAt: Date.now(),
			endedAt: null,
		});
	},

	end: () => set({ status: "ended", endedAt: Date.now() }),

	reset: () => {
		transcriptSequence = 0;
		set({
			status: "idle",
			transcript: [],
			startedAt: null,
			endedAt: null,
		});
	},

	appendTranscript: (entry) => {
		transcriptSequence += 1;
		set((state) => ({
			transcript: [
				...state.transcript,
				{
					id: `msg_${transcriptSequence}`,
					speaker: entry.speaker,
					text: entry.text,
					timestamp: Date.now(),
				},
			],
		}));
	},
}));
