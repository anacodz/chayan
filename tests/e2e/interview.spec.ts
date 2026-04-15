import { test, expect } from '@playwright/test';

/**
 * [BACKLOG-014] Automated E2E Testing Suite
 * This test simulates the entire candidate journey: 
 * Invite → Welcome → Consent → Audio Recording → Processing → Final Completion.
 */
test.describe('Candidate Interview Flow', () => {
  test('should complete a full assessment flow with mocked AI responses', async ({ page }) => {
    const mockSessionId = 'mock-session-123';
    const mockToken = 'mock-jwt-token-xyz';

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
            candidate: { name: 'Alice Smith', subject: 'Mathematics' },
            questionSetId: 'default',
            consentAcceptedAt: null,
            activeSecondsSpent: 0
          }
        }),
      });
    });

    // 2. Mock the public questions API
    await page.route('**/api/questions?questionSetId=default', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [
            {
              id: 'q1',
              prompt: 'Explain the concept of Fractions to a 9-year-old.',
              category: 'Pedagogy',
              competencyTags: ['pedagogy', 'clarity'],
              maxDurationSeconds: 120
            }
          ]
        }),
      });
    });

    // 3. Mock the upload API
    await page.route('**/api/answers/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answerId: 'mock-answer-456', status: 'UPLOADED' }),
      });
    });

    // 4. Mock the status polling API (Simulate background processing)
    let pollCount = 0;
    await page.route('**/api/answers/mock-answer-456/status', async (route) => {
      pollCount++;
      // Return 'UPLOADED' for the first two polls, then 'EVALUATED'
      const status = pollCount > 2 ? 'EVALUATED' : 'UPLOADED';
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status,
          transcript: pollCount > 2 ? 'I would use a pizza to explain fractions...' : null,
          evaluation: pollCount > 2 ? {
            score: 4.5,
            reasoning: 'Clear analogy used.',
            signals: ['Used physical manipulative analogy'],
            redFlags: [],
            dimensionScores: {
              communicationClarity: 5,
              conceptExplanation: 4,
              empathyAndPatience: 5,
              adaptability: 4,
              professionalism: 5,
              englishFluency: 5
            },
            confidence: 0.95,
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

    // ─── Phase 1: Landing & Welcome ───
    await page.goto(`/interview/${mockToken}`);
    
    // Log for debugging
    console.log(`INTERVIEW URL: ${page.url()}`);
    if (page.url().includes('invalid')) {
      const body = await page.innerHTML('body');
      console.log(`INVALID PAGE CONTENT: ${body.slice(0, 500)}`);
    }

    // Check if branding and candidate name are visible
    await expect(page.getByText(/Chayan/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Ready, Alice?/i)).toBeVisible();

    // ─── Phase 2: Consent & Start ───
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: /Start Assessment/i }).click();

    // ─── Phase 3: Interview Question ───
    // Verify question content
    await expect(page.getByText(/Question 1 of 1/i)).toBeVisible();
    await expect(page.getByText(/Fractions/i)).toBeVisible();
    
    // Recording Flow
    const startBtn = page.getByRole('button', { name: /Start Recording/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Pulse dot should appear
    await expect(page.locator('.recording-dot')).toBeVisible();
    
    // Stop Recording
    const stopBtn = page.getByRole('button', { name: /Stop Recording/i });
    await expect(stopBtn).toBeVisible();
    await stopBtn.click();

    // ─── Phase 4: Processing ───
    // Should show some processing step
    await expect(page.getByText(/Uploading/i).or(page.getByText(/Transcribing/i)).or(page.getByText(/Evaluation/i))).toBeVisible();
    
    // ─── Phase 5: Completion ───
    // Wait for the final summarization and transition
    await expect(page.getByText(/You.re all set/i)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Submission received/i)).toBeVisible();
    await expect(page.getByText(/1 responses captured/i)).toBeVisible();
  });
});
