export function extractJsonObject<T>(text: string): T {
  // 1. Try to find JSON within markdown blocks first
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const blockMatch = text.match(jsonBlockRegex);
  if (blockMatch) {
    try {
      return JSON.parse(blockMatch[1].trim()) as T;
    } catch (e) {
      // If block parsing fails, fall back to other methods
    }
  }

  // 2. Fallback to finding the first { and last }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return a JSON object.");
  }

  const potentialJson = text.slice(start, end + 1);
  try {
    return JSON.parse(potentialJson) as T;
  } catch (e) {
    // 3. Last ditch: try to find the smallest valid JSON starting from the first {
    // This handles cases like: Something: { "a": 1 } and { "b": 2 }
    // We try to parse substrings from 'start' to each subsequent '}'
    let lastFoundIndex = start;
    while (true) {
      const nextEnd = text.indexOf("}", lastFoundIndex + 1);
      if (nextEnd === -1) break;
      
      try {
        return JSON.parse(text.slice(start, nextEnd + 1)) as T;
      } catch (innerError) {
        lastFoundIndex = nextEnd;
      }
    }
    
    throw new Error("Model did not return a valid JSON object.");
  }
}
