import { describe, expect, it } from "vitest";
import { p50, p95, percentile } from "@/lib/metrics";
import type { LatencySample } from "@/lib/types";

function sample(valueMs: number): LatencySample {
	return { timestamp: 0, valueMs };
}

function samples(...values: number[]): LatencySample[] {
	return values.map(sample);
}

describe("percentile computation", () => {
	describe("edge cases", () => {
		it("returns null for an empty array (p50)", () => {
			expect(p50([])).toBeNull();
		});

		it("returns null for an empty array (p95)", () => {
			expect(p95([])).toBeNull();
		});

		it("returns the single sample value for p50", () => {
			expect(p50(samples(250))).toBe(250);
		});

		it("returns the single sample value for p95", () => {
			expect(p95(samples(250))).toBe(250);
		});
	});

	describe("odd count", () => {
		// [100, 200, 300, 400, 500] sorted
		// p50: ceil(0.50 * 5) = 3, index 2 → 300
		// p95: ceil(0.95 * 5) = 5, index 4 → 500
		it("computes p50 = 300 for [100, 200, 300, 400, 500]", () => {
			expect(p50(samples(100, 200, 300, 400, 500))).toBe(300);
		});

		it("computes p95 = 500 for [100, 200, 300, 400, 500]", () => {
			expect(p95(samples(100, 200, 300, 400, 500))).toBe(500);
		});
	});

	describe("even count", () => {
		// [100, 200, 300, 400] sorted
		// p50: ceil(0.50 * 4) = 2, index 1 → 200
		// p95: ceil(0.95 * 4) = 4, index 3 → 400
		it("computes p50 = 200 for [100, 200, 300, 400]", () => {
			expect(p50(samples(100, 200, 300, 400))).toBe(200);
		});

		it("computes p95 = 400 for [100, 200, 300, 400]", () => {
			expect(p95(samples(100, 200, 300, 400))).toBe(400);
		});
	});

	describe("unsorted input", () => {
		it("sorts internally for p50", () => {
			expect(p50(samples(500, 100, 400, 200, 300))).toBe(300);
		});

		it("sorts internally for p95", () => {
			expect(p95(samples(500, 100, 400, 200, 300))).toBe(500);
		});
	});

	describe("percentile function directly", () => {
		it("computes an arbitrary percentile (p90)", () => {
			// [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] — 10 elements
			// p90: ceil(0.90 * 10) = 9, index 8 → 90
			expect(
				percentile(samples(10, 20, 30, 40, 50, 60, 70, 80, 90, 100), 90),
			).toBe(90);
		});

		it("returns the max value for p100", () => {
			expect(percentile(samples(100, 200, 300), 100)).toBe(300);
		});

		it("returns the min value for p0", () => {
			expect(percentile(samples(100, 200, 300), 0)).toBe(100);
		});
	});
});
