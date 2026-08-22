import { create } from "zustand";
import type { TraceEvent } from "@/lib/types";

export type TraceEventInput = Omit<TraceEvent, "id" | "timestamp">;

type TraceSink = (event: TraceEvent) => void;

const sinks: TraceSink[] = [];
let eventSequence = 0;

/**
 * Subscribe a sink to the single trace emission interface. Returns an
 * unsubscribe function. External sinks (e.g. a future tracing backend) can
 * attach here without touching any call site that emits events.
 */
export function subscribeToTrace(sink: TraceSink): () => void {
	sinks.push(sink);
	return () => {
		const index = sinks.indexOf(sink);
		if (index !== -1) {
			sinks.splice(index, 1);
		}
	};
}

/**
 * Emit a trace event through the single emission interface. `id` and
 * `timestamp` are filled in here so every event carries a timestamp by
 * construction. Returns the fully-formed event for callers that need its
 * timestamp to compute durations.
 */
export function emit(input: TraceEventInput): TraceEvent {
	eventSequence += 1;
	const event: TraceEvent = {
		id: `evt_${eventSequence}`,
		timestamp: Date.now(),
		...input,
	};
	for (const sink of sinks) {
		sink(event);
	}
	return event;
}

interface TraceState {
	events: TraceEvent[];
	append: (event: TraceEvent) => void;
	clear: () => void;
}

export const useTraceStore = create<TraceState>()((set) => ({
	events: [],
	append: (event) => set((state) => ({ events: [...state.events, event] })),
	clear: () => set({ events: [] }),
}));

// The trace store is one subscriber to the single emission interface. Appending
// via `emit()` therefore lands in the store's event list.
subscribeToTrace((event) => {
	useTraceStore.getState().append(event);
});
