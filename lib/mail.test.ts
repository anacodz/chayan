import { describe, expect, it, vi, beforeEach } from "vitest";
import { sendInviteEmail } from "./mail";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn(function ResendMock() {
    return {
      emails: {
        send: sendMock,
      },
    };
  }),
}));

vi.mock("./env", () => ({
  env: {
    RESEND_API_KEY: "re_test_key",
    RESEND_FROM: "onboarding@resend.dev",
  },
}));

describe("sendInviteEmail", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it("sends invite email successfully", async () => {
    sendMock.mockResolvedValue({ data: { id: "email_123" }, error: null });

    const result = await sendInviteEmail({
      to: "candidate@example.com",
      name: "Candidate",
      inviteUrl: "https://example.com/interview/token-123",
    });

    expect(result.ok).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("fails for non-absolute invite URLs", async () => {
    const result = await sendInviteEmail({
      to: "candidate@example.com",
      name: "Candidate",
      inviteUrl: "/interview/token-123",
    });

    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("INVALID_INVITE_URL");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns false when resend returns an API error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "bad request" } });

    const result = await sendInviteEmail({
      to: "candidate@example.com",
      name: "Candidate",
      inviteUrl: "https://example.com/interview/token-123",
    });

    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("RESEND_API_ERROR");
    expect(result.failureReason).toContain("bad request");
  });
});
