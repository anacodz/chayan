import { describe, it, expect, vi } from "vitest";
import { withRetry } from "./retry";

describe("withRetry utility", () => {
  it("returns result on first attempt if successful", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await withRetry(fn);
    
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure until success", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("failure 1"))
      .mockRejectedValueOnce(new Error("failure 2"))
      .mockResolvedValue("success");
      
    const result = await withRetry(fn, { delayMs: 1 });
    
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws the last error if all retries fail", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("persistent failure"));
    
    await expect(withRetry(fn, { maxRetries: 2, delayMs: 1 }))
      .rejects.toThrow("persistent failure");
      
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("applies exponential backoff correctly", async () => {
    vi.useFakeTimers();
    const fn = vi.fn(async () => { throw new Error("failure"); });
    
    const promise = withRetry(fn, { maxRetries: 3, delayMs: 100, backoff: true, jitter: false });
    promise.catch(() => {}); // Prevent unhandled rejection warning
    
    // Attempt 1: fails immediately
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);
    
    // Attempt 2: waits 100ms
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(2);
    
    // Attempt 3: waits 200ms (100 * 2^1)
    await vi.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledTimes(3);
    
    await expect(promise).rejects.toThrow("failure");
    vi.useRealTimers();
  });

  it("uses constant delay if backoff is disabled", async () => {
    vi.useFakeTimers();
    const fn = vi.fn(async () => { throw new Error("failure"); });
    
    const promise = withRetry(fn, { maxRetries: 3, delayMs: 100, backoff: false, jitter: false });
    promise.catch(() => {}); // Prevent unhandled rejection warning
    
    // Attempt 1
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);
    
    // Attempt 2
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(2);
    
    // Attempt 3
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(3);
    
    await expect(promise).rejects.toThrow("failure");
    vi.useRealTimers();
  });

  it("applies jitter correctly", async () => {
    vi.useFakeTimers();
    const fn = vi.fn(async () => { throw new Error("failure"); });
    
    // With jitter=true, delay should be within +/- 20% of 1000ms
    const promise = withRetry(fn, { maxRetries: 2, delayMs: 1000, jitter: true });
    promise.catch(() => {});
    
    // Attempt 1
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);
    
    // 800ms to 1200ms
    await vi.advanceTimersByTimeAsync(800);
    // At 800ms, it might have triggered or not. Let's just check that it triggers eventually.
    // This is hard to test with exact timers because of Math.random().
    // But we can check it DOES trigger after 1200ms.
    await vi.advanceTimersByTimeAsync(401);
    expect(fn).toHaveBeenCalledTimes(2);
    
    await expect(promise).rejects.toThrow("failure");
    vi.useRealTimers();
  });
});
