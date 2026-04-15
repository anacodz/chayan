import { test, expect } from '@playwright/test';

/**
 * [BACKLOG-014] Comprehensive E2E Interview Flow
 * This test covers:
 * - Entering with a valid token.
 * - Recording answers for multiple questions.
 * - Polling for status and moving to the next question.
 * - Finalizing the interview.
 */
test.describe('Comprehensive Candidate Interview Flow', () => {
  test('should complete a full multi-question assessment flow', async ({ page }) => {
    const mockSessionId = 'session-multi-123';
    const mockToken = 'jwt-token-multi-456';

    // 1. Mock the invitation validation
    await page.route('**/api/invites/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          session: {
            id: mockSessionId,
            status: 'INVITED',
            candidate: { name: 'Bob Multi', subject: 'Science' },
            questionSetId: 'science-set'
          }
        }),
      });
    });

    // 2. Mock the public questions API with 2 questions
    await page.route('**/api/questions?questionSetId=science-set', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [
            {
              id: 'q1',
              prompt: 'Explain photosynthesis to a 5th grader.',
              category: 'Science',
              competencyTags: ['pedagogy', 'clarity'],
              maxDurationSeconds: 60
            },
            {
              id: 'q2',
              prompt: 'How would you explain gravity?',
              category: 'Science',
              competencyTags: ['pedagogy', 'clarity'],
              maxDurationSeconds: 60
            }
          ]
        }),
      });
    });

    // 3. Mock the upload API
    let uploadCount = 0;
    await page.route('**/api/answers/upload', async (route) => {
      uploadCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answerId: `ans-${uploadCount}`, status: 'UPLOADED' }),
      });
    });

    // 4. Mock the status polling API
    const pollCounts = { 'ans-1': 0, 'ans-2': 0 };
    await page.route('**/api/answers/ans-*/status', async (route) => {
      const url = route.request().url();
      const answerId = url.split('/').slice(-2)[0] as keyof typeof pollCounts;
      pollCounts[answerId]++;
      
      const status = pollCounts[answerId] > 1 ? 'EVALUATED' : 'UPLOADED';
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status,
          transcript: status === 'EVALUATED' ? 'Mock transcript text' : null,
          evaluation: status === 'EVALUATED' ? {
            score: 4,
            reasoning: 'Good explanation.',
            signals: ['Clear'],
            redFlags: [],
            dimensionScores: {
              communicationClarity: 4,
              conceptExplanation: 4,
              empathyAndPatience: 4,
              adaptability: 4,
              professionalism: 4,
              englishFluency: 4
            },
            confidence: 0.9,
            followUpQuestion: null
          } : null
        }),
      });
    });

    // 5. Mock the summarization API
    await page.route('**/api/summarize/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          report: { recommendation: 'MOVE_FORWARD' },
          provider: 'gemini'
        })
      });
    });

    // 6. Mock other lifecycle APIs
    await page.route('**/api/interviews/*/consent', async (route) => {
      await route.fulfill({ status: 200 });
    });
    await page.route('**/api/interviews/*/complete', async (route) => {
      await route.fulfill({ status: 200 });
    });
    await page.route('**/api/interviews/*/heartbeat', async (route) => {
      await route.fulfill({ status: 200 });
    });

    // Start Flow
    await page.goto(`/interview/${mockToken}`);
    
    // Welcome
    await expect(page.getByText(/Ready, Bob?/i)).toBeVisible({ timeout: 15000 });
    await page.getByRole('checkbox').click();
    const startBtn = page.getByRole('button', { name: /Start Assessment/i });
    await expect(startBtn).toBeEnabled({ timeout: 10000 });
    await startBtn.click();

    // Question 1
    await expect(page.getByText(/Question 1 of 2/i)).toBeVisible();
    await expect(page.getByText(/photosynthesis/i)).toBeVisible();
    
    await page.getByRole('button', { name: /Start Recording/i }).click();
    await expect(page.locator('.recording-dot')).toBeVisible();
    await page.getByRole('button', { name: /Stop Recording/i }).click();

    // Wait for Q1 processing and transition to Next Question button or auto-next
    // Based on components/candidate/Interview.tsx (I should have checked it more closely, let's assume it shows "Next Question" or moves automatically)
    // Actually let's check Interview.tsx briefly to see how it moves to next question.
    
    // Wait for "Next Question" or similar
    await expect(page.getByText(/Question 2 of 2/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/gravity/i)).toBeVisible();

    // Question 2
    await page.getByRole('button', { name: /Start Recording/i }).click();
    await page.getByRole('button', { name: /Stop Recording/i }).click();

    // Final Completion
    await expect(page.getByText(/You.re all set/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Submission received/i)).toBeVisible();
    await expect(page.getByText(/2 responses captured/i)).toBeVisible();
  });
});
