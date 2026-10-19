import { describe, expect, it } from "vitest";
import { getVideoLoadingProgress } from "../../supabase/functions/_shared/video-loading";

describe("video startup loading", () => {
  it("advances before metadata and buffer ranges become available", () => {
    expect(getVideoLoadingProgress(1000, 0, 0, 3)).toBeGreaterThan(0);
    expect(getVideoLoadingProgress(3000, 0, 0, 3)).toBeGreaterThan(getVideoLoadingProgress(1000, 0, 0, 3));
  });
  it("measures the startup buffer rather than the entire long video", () => {
    expect(getVideoLoadingProgress(0, 1, 1.5, 3)).toBe(47);
  });
  it("does not finish while playback is still unavailable", () => {
    expect(getVideoLoadingProgress(600000, 2, 30, 3)).toBe(95);
  });
  it("finishes when the browser can play", () => {
    expect(getVideoLoadingProgress(100, 3, 0, 3)).toBe(100);
  });
});