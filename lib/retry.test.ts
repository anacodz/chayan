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
    const fn = vi.fn().mockRejectedValue(new Error("failure"));
    
    const promise = withRetry(fn, { maxRetries: 3, delayMs: 100, backoff: true });
    
    // Attempt 1: fails immediately
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);
    
    // Attempt 2: waits 100ms
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(2);
    
    // Attempt 3: waits 200ms (100 * 2^1)
    await vi.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledTimes(3);
    
    await expect(promise).rejects.toThrow();
    vi.useRealTimers();
  });

  it("uses constant delay if backoff is disabled", async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockRejectedValue(new Error("failure"));
    
    const promise = withRetry(fn, { maxRetries: 3, delayMs: 100, backoff: false });
    
    // Attempt 1
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);
    
    // Attempt 2
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(2);
    
    // Attempt 3
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(3);
    
    await expect(promise).rejects.toThrow();
    vi.useRealTimers();
  });
});
