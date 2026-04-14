import { test, expect } from '@playwright/test';

test.describe('Recruiter Flow (Mocked API)', () => {
  test.beforeEach(async ({ context }) => {
    // Bypass middleware by adding a mock session token
    await context.addCookies([{
      name: 'next-auth.session-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/',
    }]);
  });

  test('should view candidate and save decision', async ({ page }) => {
    // 1. Mock the interviews list
    await page.route('/api/recruiter/interviews?skip=0&take=10&search=', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            {
              id: 'session-123',
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
              candidate: { name: 'Bob', email: 'bob@example.com' },
              finalReport: {
                recommendation: 'MOVE_FORWARD',
                overallScore: 4.5
              }
            }
          ],
          total: 1
        }),
      });
    });

    // 2. Mock the metrics
    await page.route('/api/admin/metrics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalInvites: 1,
          completionRate: 1,
          avgConfidence: 0.9,
          funnel: { invited: 1, started: 1, completed: 1, reviewed: 0 }
        }),
      });
    });

    // 3. Mock the specific interview detail
    await page.route('/api/recruiter/interviews/session-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            id: 'session-123',
            status: 'COMPLETED',
            createdAt: new Date().toISOString(),
            candidate: { name: 'Bob', email: 'bob@example.com' },
            answers: [
              {
                id: 'ans-1',
                questionId: 'q1',
                audioObjectKey: 'http://example.com/audio.webm',
                createdAt: new Date().toISOString(),
                transcript: { text: 'I love teaching.' },
                evaluation: {
                  evidence: ['Passion'],
                  communicationClarity: 5,
                  conceptExplanation: 4,
                  empathyAndPatience: 5,
                  professionalism: 5,
                  adaptability: 4
                }
              }
            ],
            finalReport: {
              recommendation: 'MOVE_FORWARD',
              overallScore: 4.5,
              confidence: 0.95,
              strengths: ['Clear communication'],
              risks: [],
              dimensionScores: {
                communicationClarity: 5,
                conceptExplanation: 4,
                empathyAndPatience: 5,
                professionalism: 5
              }
            }
          }
        }),
      });
    });

    // 4. Mock the decision saving
    await page.route('/api/recruiter/interviews/session-123', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 200 });
      }
    });

    // ─── Execution ───

    // Login and view dashboard
    await page.goto('/recruiter');
    await expect(page.getByText(/Bob/i)).toBeVisible();
    
    // Go to detail
    await page.getByRole('link').filter({ hasText: /visibility/i }).first().click();
    
    // Check detail data
    await expect(page.getByText(/Bob's Analysis/i)).toBeVisible();
    await expect(page.getByText(/I love teaching/i)).toBeVisible();

    // Save decision
    await page.getByRole('button', { name: /Move Forward/i }).click();
    await page.getByPlaceholder(/Add a note/i).fill('Great candidate.');
    
    // Listen for alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('success');
      await dialog.dismiss();
    });

    await page.getByRole('button', { name: /Confirm Decision/i }).click();
  });
});
