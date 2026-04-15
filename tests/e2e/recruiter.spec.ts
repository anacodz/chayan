import { test, expect } from '@playwright/test';

/**
 * [BACKLOG-014] Automated E2E Testing Suite - Recruiter Flow
 * Simulates the recruiter journey: Dashboard → Report Detail → Decision Recording.
 */
test.describe('Recruiter Review Flow', () => {
  test.beforeEach(async ({ context }) => {
    // Bypass middleware by adding a mock session token
    await context.addCookies([{
      name: 'next-auth.session-token',
      value: 'mock-token',
      url: 'http://localhost:3000',
    }]);
  });

  test('should navigate to report and confirm a hiring decision', async ({ page }) => {
    const mockSessionId = 'session-abc-123';

    // 1. Mock the auth session
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Lead Recruiter', email: 'recruiter@cuemath.com', role: 'RECRUITER' },
          expires: new Date(Date.now() + 86400000).toISOString()
        }),
      });
    });

    // 2. Mock the interviews list API
    await page.route(/\/api\/recruiter\/interviews(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            {
              id: mockSessionId,
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
              candidate: { name: 'John Doe', email: 'john@example.com' },
              finalReport: {
                recommendation: 'MOVE_FORWARD',
                overallScore: 4.2
              },
              recruiterDecision: null
            }
          ],
          total: 1
        }),
      });
    });

    // 3. Mock the metrics API
    await page.route('**/api/admin/metrics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalInvites: 150,
          completionRate: 0.85,
          avgConfidence: 0.92,
          avgTimeToReportMs: 120000,
          sttFallbackRate: 0.05
        }),
      });
    });

    // 4. Mock the specific interview detail API
    await page.route(`**/api/recruiter/interviews/${mockSessionId}`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
        return;
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            id: mockSessionId,
            status: 'COMPLETED',
            createdAt: new Date().toISOString(),
            candidate: { name: 'John Doe', email: 'john@example.com' },
            answers: [
              {
                id: 'ans-999',
                questionId: 'q1',
                audioObjectKey: 'https://example.com/audio.webm',
                createdAt: new Date().toISOString(),
                transcript: { text: 'I have extensive experience in explaining complex concepts.' },
                evaluation: {
                  evidence: ['Great clarity', 'Pedagogical depth'],
                  communicationClarity: 5,
                  conceptExplanation: 4,
                  empathyAndPatience: 5,
                  professionalism: 5,
                  adaptability: 4,
                  confidence: 0.98,
                  reasoning: 'Excellent response.'
                },
                question: { prompt: 'Explain a complex topic.' }
              }
            ],
            finalReport: {
              recommendation: 'MOVE_FORWARD',
              overallScore: 4.2,
              confidence: 0.92,
              strengths: ['Clear communication', 'Strong pedagogical intent'],
              risks: [],
              dimensionScores: {
                communicationClarity: 5,
                conceptExplanation: 4,
                empathyAndPatience: 5,
                professionalism: 5,
                adaptability: 4
              }
            }
          }
        }),
      });
    });

    // ─── Execution ───

    // Log all browser console messages
    page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

    // 1. Visit Dashboard
    await page.goto('/recruiter');
    console.log(`CURRENT URL: ${page.url()}`);
    // Use attached instead of visible if glassmorphism/animations are tricky
    await expect(page.getByRole('heading', { name: /Recruitment Overview/i })).toBeAttached({ timeout: 30000 });
    await expect(page.getByText(/John Doe/i)).toBeAttached();
    
    // 2. Navigate to Detail via Visibility Icon
    await page.getByRole('link').filter({ hasText: 'visibility' }).click();
    
    // 3. Verify Detail Page Content
    await expect(page.getByText(/John Doe's Analysis/i)).toBeVisible();
    await expect(page.getByText(/Interview Evidence/i)).toBeVisible();
    await expect(page.getByText(/extensive experience/i).first()).toBeVisible();

    // 4. Record Hiring Decision
    // The panel should have a "Move Forward" button selected by default or clickable
    const moveForwardBtn = page.getByRole('button', { name: /Move Forward/i });
    await expect(moveForwardBtn).toBeVisible();
    
    // Fill internal notes
    const notesField = page.getByPlaceholder(/Add a note/i);
    await notesField.fill('Strong pedagogical skills observed in the transcript. Recommended for next round.');

    // 5. Submit and Verify
    // Handle the success alert
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('successfully');
      await dialog.dismiss();
    });

    const confirmBtn = page.getByRole('button', { name: /Confirm Decision/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();
  });
});
