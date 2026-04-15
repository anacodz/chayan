import { test, expect } from '@playwright/test';

/**
 * [BACKLOG-015] Automated E2E Testing Suite - Candidate Interview Flow
 * Simulates the candidate journey: Welcome/Consent → Interview Questions → Completion.
 */
test.describe('Candidate Interview Flow', () => {
  const mockToken = 'mock-interview-token';
  const mockSessionId = 'session-xyz-789';

  test('should complete the full interview flow successfully', async ({ page }) => {
    // 1. Mock the specific interview session validation
    await page.route(`**/api/invites/${mockToken}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            id: mockSessionId,
            candidate: { name: 'Alice Smith' },
            status: 'INVITED',
            questionSetId: 'default',
            activeSecondsSpent: 0
          }
        }),
      });
    });

    // 2. Mock questions API
    await page.route('**/api/questions?questionSetId=default', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [
            { id: 'q1', prompt: 'Explain gravity to a child.', maxDurationSeconds: 60, competencyTags: ['teaching'] },
            { id: 'q2', prompt: 'How do you handle a student who is bored?', maxDurationSeconds: 60, competencyTags: ['empathy'] }
          ]
        }),
      });
    });

    // 3. Mock Heartbeat, Consent, Complete
    await page.route(`**/api/interviews/${mockSessionId}/consent`, async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });
    await page.route(`**/api/interviews/${mockSessionId}/heartbeat`, async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ activeSecondsSpent: 10 }) });
    });
    await page.route(`**/api/interviews/${mockSessionId}/complete`, async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    // ─── Execution ───

    // 1. Visit the interview page
    await page.goto(`/interview/${mockToken}`);
    
    // 2. Welcome Screen: Check personalized greeting
    await expect(page.getByText(/Ready, Alice?/i)).toBeVisible();
    
    // 3. Microphone Permission
    const enableMicBtn = page.getByRole('button', { name: /Enable Mic/i });
    await expect(enableMicBtn).toBeVisible();
    await enableMicBtn.click();
    await expect(page.getByText(/Ready/i)).toBeVisible(); // Check visually for "Ready" state after click

    // 4. Consent and Start
    const consentCheckbox = page.locator('input[type="checkbox"]');
    await consentCheckbox.check();
    
    const startBtn = page.getByRole('button', { name: /Start Assessment/i });
    await expect(startBtn).toBeEnabled();
    await startBtn.click();

    // 5. Interview Screen: First Question
    await expect(page.getByText(/Explain gravity/i)).toBeVisible();
    await expect(page.getByText(/Question 1 of 2/i)).toBeVisible();

    // Mock answer upload & status polling
    const mockAnswerId = 'ans-111';
    await page.route('**/api/answers/upload', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ answerId: mockAnswerId }) });
    });

    // Initial status check: TRANSCRIBED -> EVALUATED
    let pollCount = 0;
    await page.route(`**/api/answers/${mockAnswerId}/status`, async (route) => {
      pollCount++;
      if (pollCount === 1) {
        await route.fulfill({ status: 200, body: JSON.stringify({ status: 'TRANSCRIBED' }) });
      } else {
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ 
            status: 'EVALUATED',
            evaluation: { dimensionScores: { clarity: 5 } },
            transcript: 'Gravity is like a magnet for the earth.'
          }) 
        });
      }
    });

    // Trigger recording end (simulate "Stop Recording")
    // Note: In E2E we usually mock the MediaRecorder or wait for progress
    // Here we'll click "Stop Recording" if it exists or simulate the behavior
    const stopBtn = page.getByRole('button', { name: /Stop/i });
    // Assuming startRecording was called by the component, we might need to wait for it to be recording
    await page.getByRole('button', { name: /Start Recording/i }).click();
    await page.waitForTimeout(1000);
    await stopBtn.click();

    // 6. Transition to Question 2
    await expect(page.getByText(/How do you handle a student/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Question 2 of 2/i)).toBeVisible();

    // Mock summarize API
    await page.route('**/api/summarize', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    const mockAnswerId2 = 'ans-222';
    await page.route(`**/api/answers/${mockAnswerId2}/status`, async (route) => {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify({ 
          status: 'EVALUATED',
          evaluation: { dimensionScores: { clarity: 4 } },
          transcript: 'I will use toys.'
        }) 
      });
    });

    await page.getByRole('button', { name: /Start Recording/i }).click();
    await page.waitForTimeout(1000);
    await stopBtn.click();

    // 7. Completion Screen
    await expect(page.getByText(/Assessment Complete/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Thank you for your time/i)).toBeVisible();
  });
});
