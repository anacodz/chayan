import { test, expect } from '@playwright/test';

/**
 * [BACKLOG-014] Recruiter Dashboard & Report Flow
 * This test covers:
 * - Viewing the candidate list.
 * - Opening a candidate report.
 * - Saving a recruiter decision and notes.
 */
test.describe('Recruiter Workflow', () => {
  test('should navigate through recruiter dashboard and save a decision', async ({ page }) => {
    const mockSessionId = 'recruiter-session-789';

    // 1. Mock the interviews list API
    await page.route('**/api/recruiter/interviews?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            {
              id: mockSessionId,
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
              candidate: {
                name: 'Jane Doe',
                email: 'jane@example.com'
              },
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

    // 2. Mock metrics API
    await page.route('**/api/admin/metrics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalInvites: 10,
          completionRate: 0.8,
          avgTimeToReportMs: 120000,
          sttFallbackRate: 0.05,
          avgConfidence: 0.92
        })
      });
    });

    // 3. Mock the single interview detail API (GET and POST)
    await page.route(`**/api/recruiter/interviews/${mockSessionId}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            session: {
              id: mockSessionId,
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
              candidate: {
                name: 'Jane Doe',
                email: 'jane@example.com'
              },
              answers: [
                {
                  id: 'ans-1',
                  questionId: 'q1',
                  question: { prompt: 'Explain Calculus.' },
                  audioObjectKey: 'http://example.com/audio.webm',
                  createdAt: new Date().toISOString(),
                  transcript: { id: 't-1', text: 'Calculus is the study of change.' },
                  evaluation: {
                    communicationClarity: 5,
                    conceptExplanation: 4,
                    empathyAndPatience: 5,
                    professionalism: 5,
                    evidence: ['Clear', 'Concise']
                  }
                }
              ],
              finalReport: {
                recommendation: 'MOVE_FORWARD',
                overallScore: 4.2,
                confidence: 0.95,
                strengths: ['Strong communicator'],
                risks: ['None'],
                dimensionScores: {
                  communicationClarity: 5,
                  conceptExplanation: 4,
                  empathyAndPatience: 5,
                  professionalism: 5
                }
              },
              recruiterDecision: null
            }
          }),
        });
      } else if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        // The UI might send MOVE_FORWARD instead of Move Forward depending on implementation
        // But the test fills it via button click
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }
    });

    // 4. Mock NextAuth session API
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Test Recruiter', email: 'recruiter@cuemath.com', role: 'RECRUITER' },
          expires: new Date(Date.now() + 3600000).toISOString()
        })
      });
    });

    // --- Start Recruiter Flow ---
    
    // Add auth cookie
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    // Dashboard
    await page.goto('/recruiter');
    await expect(page.getByText(/Recruitment Overview/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Jane Doe/i)).toBeVisible();

    // Open Report
    await page.locator(`a[href="/recruiter/interviews/${mockSessionId}"]`).click();
    
    // Verify Report Content
    await expect(page.locator('h1')).toContainText(/Jane Doe/i, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText(/Analysis/i);
    await expect(page.getByText(/84%/i)).toBeVisible(); // 4.2 * 20
    await expect(page.getByText(/Calculus/i)).toBeVisible();
    await expect(page.getByText(/Calculus is the study of change/i)).toBeVisible();

    // Save Decision
    await page.getByRole('button', { name: /Move Forward/i }).click();
    await page.locator('textarea[placeholder*="Add a note"]').fill('Excellent candidate.');
    
    // Mock window.alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Decision saved successfully');
      await dialog.accept();
    });

    await page.getByRole('button', { name: /Confirm Decision/i }).click();
  });
});
