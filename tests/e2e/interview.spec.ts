import { test, expect } from '@playwright/test';

test.describe('Candidate Interview Flow (Mocked API)', () => {
  test('should complete a basic interview flow', async ({ page }) => {
    // 1. Mock the invitation validation
    await page.route('**/api/invites/test-token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          session: {
            id: 'mock-session-id',
            status: 'INVITED',
            candidate: { name: 'Alice' },
            questionSetId: 'default'
          }
        }),
      });
    });

    // 2. Mock the questions
    await page.route('**/api/questions?questionSetId=default', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [
            {
              id: 'q1',
              prompt: 'Tell us about your teaching experience.',
              competencyTags: ['experience'],
              maxDurationSeconds: 60
            }
          ]
        }),
      });
    });

    // 3. Mock the upload and status polling
    await page.route('**/api/answers/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answerId: 'mock-answer-id' }),
      });
    });

    await page.route('**/api/answers/mock-answer-id/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'EVALUATED',
          transcript: 'I have five years of experience teaching math.',
          evaluation: {
            followUpQuestion: null, // No follow-up for simple path
            communicationClarity: 5,
            conceptExplanation: 4,
            empathyAndPatience: 5
          }
        }),
      });
    });

    // 4. Mock the consent and completion
    await page.route('**/api/interviews/mock-session-id/consent', async (route) => {
      await route.fulfill({ status: 200 });
    });
    
    await page.route('**/api/interviews/mock-session-id/complete', async (route) => {
      await route.fulfill({ status: 200 });
    });

    // ─── Execution ───

    // Navigate to invite URL (which redirects to /interview/test-token)
    await page.goto('/?invite=test-token');
    
    // Welcome Phase
    await page.waitForTimeout(2000);
    await expect(page.getByText(/Alice/i).first()).toBeVisible();
    
    // Check consent and click Start Assessment
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: /Start Assessment/i }).click();

    // Interview Phase
    await expect(page.getByText(/Question 1/i)).toBeVisible();
    await expect(page.getByText(/teaching experience/i)).toBeVisible();
    
    // Start/Stop recording (handled by fake media in config)
    await page.getByRole('button', { name: /Start Recording/i }).click();
    await page.waitForTimeout(1000); 
    await page.getByRole('button', { name: /Stop Recording/i }).click();

    // Wait for processing and transition to completion
    await expect(page.getByText(/upload/i).first()).toBeVisible();
    await expect(page.getByText(/You.re all set/i)).toBeVisible({ timeout: 15000 });
  });
});

