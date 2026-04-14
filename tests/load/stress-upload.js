// Basic stress test for the /api/answers/upload endpoint
// Simulates concurrent candidate uploads to ensure Inngest queues handle the load gracefully.

const CONCURRENT_UPLOADS = 10;
const API_URL = process.env.API_URL || "http://localhost:3000/api/answers/upload";

async function stressTest() {
  console.log(`Starting load test with ${CONCURRENT_UPLOADS} concurrent uploads to ${API_URL}...`);

  // Create a minimal mock WebM file blob (just a text file masquerading as audio for the test)
  const mockFileContent = "mock audio data for load testing " + Date.now();
  const mockBlob = new Blob([mockFileContent], { type: "audio/webm" });

  const startTime = Date.now();

  const requests = Array.from({ length: CONCURRENT_UPLOADS }).map(async (_, i) => {
    const formData = new FormData();
    formData.append("audio", mockBlob, `test-audio-${i}.webm`);
    formData.append("sessionId", `load-test-session-${Date.now()}`);
    formData.append("questionId", `load-test-question-${i}`);
    formData.append("question", "What is 2+2?");
    formData.append("competencyTags", JSON.stringify(["math", "clarity"]));

    const reqStart = Date.now();
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });
      
      const reqEnd = Date.now();
      const duration = reqEnd - reqStart;

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, status: response.status, error: errorText, duration };
      }

      const data = await response.json();
      return { success: true, status: response.status, data, duration };
    } catch (error) {
      const reqEnd = Date.now();
      return { success: false, error: error.message, duration: reqEnd - reqStart };
    }
  });

  const results = await Promise.all(requests);
  const totalTime = Date.now() - startTime;

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const avgDuration = results.reduce((acc, r) => acc + r.duration, 0) / results.length;

  console.log("\n--- Load Test Results ---");
  console.log(`Total Requests: ${CONCURRENT_UPLOADS}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Average Request Duration: ${avgDuration.toFixed(2)}ms`);

  if (failed.length > 0) {
    console.log("\nErrors encountered:");
    failed.slice(0, 3).forEach((f, i) => console.log(`  ${i+1}. Status ${f.status || "N/A"}: ${f.error}`));
    if (failed.length > 3) console.log(`  ...and ${failed.length - 3} more errors.`);
  } else {
    console.log("\n✅ All uploads succeeded. The background queue is handling the load.");
  }
}

stressTest().catch(console.error);
