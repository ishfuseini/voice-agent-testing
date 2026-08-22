import type { LatencySample } from "@/lib/types";

/**
 * Percentile computation for session latency metrics.
 *
 * Uses a simple sorted-array approach — session sample sizes are small
 * (tens of conversational turns), so sorting the full array each update
 * is trivially fast. No streaming algorithm (t-digest, P²) needed.
 */

/**
 * Compute a percentile from an array of latency samples.
 *
 * @param samples - latency samples (unsorted, will be sorted internally)
 * @param percentile - percentile to compute (0–100), e.g. 50 for p50, 95 for p95
 * @returns the percentile value in ms, or null if no samples
 *
 * Uses the "nearest rank" method: the value at position
 * ceil(percentile/100 * N) - 1 in the sorted array (0-indexed).
 *
 * For the known-input case: [100, 200, 300, 400, 500]
 *   p50 → sorted[ceil(0.50 * 5) - 1] = sorted[2] = 300
 *   p95 → sorted[ceil(0.95 * 5) - 1] = sorted[4] = 500
 */
export function percentile(
	samples: LatencySample[],
	percentile: number,
): number | null {
	if (samples.length === 0) {
		return null;
	}

	const sorted = [...samples].sort((a, b) => a.valueMs - b.valueMs);
	const n = sorted.length;

	// Nearest rank: position = ceil(P/100 * N), then convert to 0-indexed
	const rank = Math.ceil((percentile / 100) * n);
	const index = Math.min(rank - 1, n - 1);

	return sorted[index].valueMs;
}

/**
 * Compute p50 (median) from latency samples.
 */
export function p50(samples: LatencySample[]): number | null {
	return percentile(samples, 50);
}

/**
 * Compute p95 from latency samples.
 */
export function p95(samples: LatencySample[]): number | null {
	return percentile(samples, 95);
}

/**
 * Compute all session metrics from the metrics store's sample arrays.
 * Returns null for any metric with no samples.
 */
export interface ComputedMetrics {
	firstAudioP50: number | null;
	firstAudioP95: number | null;
	firstAudioCount: number;
	toolDurationP50: number | null;
	toolDurationCount: number;
	toolFailureCount: number;
}

export function computeSessionMetrics(
	firstAudioLatencies: LatencySample[],
	toolDurations: LatencySample[],
	toolFailureCount: number,
): ComputedMetrics {
	return {
		firstAudioP50: p50(firstAudioLatencies),
		firstAudioP95: p95(firstAudioLatencies),
		firstAudioCount: firstAudioLatencies.length,
		toolDurationP50: p50(toolDurations),
		toolDurationCount: toolDurations.length,
		toolFailureCount,
	};
}
