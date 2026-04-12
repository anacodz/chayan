import { describe, it, expect } from "vitest";
import { extractJsonObject } from "./json";

describe("extractJsonObject utility", () => {
  it("extracts JSON from a simple string", () => {
    const text = '{"key": "value"}';
    const result = extractJsonObject<any>(text);
    expect(result).toEqual({ key: "value" });
  });

  it("extracts JSON from text with surrounding content", () => {
    const text = 'Here is the result: {"key": "value"} Hope this helps!';
    const result = extractJsonObject<any>(text);
    expect(result).toEqual({ key: "value" });
  });

  it("extracts JSON from markdown blocks", () => {
    const text = '```json\n{"key": "value"}\n```';
    const result = extractJsonObject<any>(text);
    expect(result).toEqual({ key: "value" });
  });

  it("throws error when no JSON object is found", () => {
    const text = 'This is not JSON';
    expect(() => extractJsonObject(text)).toThrow("Model did not return a JSON object.");
  });

  it("handles complex nested JSON", () => {
    const text = 'Result: {"a": {"b": 1}, "c": [2, 3]}';
    const result = extractJsonObject<any>(text);
    expect(result).toEqual({ a: { b: 1 }, c: [2, 3] });
  });

  it("handles multiple objects by taking the first valid one", () => {
    const text = 'Something: { "a": 1 } and { "b": 2 }';
    const result = extractJsonObject<any>(text);
    expect(result).toEqual({ a: 1 });
  });
});
