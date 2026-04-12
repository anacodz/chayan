import { describe, it, expect, vi } from "vitest";
import { generateInviteToken, hashToken, validateInvite } from "./invites";
import prisma from "./prisma";

vi.mock("./prisma", () => ({
  default: {
    interviewSession: {
      findUnique: vi.fn(),
    },
  },
}));

describe("invites utility", () => {
  it("generates random token and matching hash", () => {
    const { token, hash } = generateInviteToken();
    expect(token).toHaveLength(64); // 32 bytes hex
    expect(hashToken(token)).toBe(hash);
  });

  it("hashes token consistently", () => {
    const token = "my-test-token";
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(token);
  });

  it("validates valid token correctly", async () => {
    const token = "valid-token";
    const hash = hashToken(token);
    const mockSession = {
      id: "session-1",
      inviteTokenHash: hash,
      inviteExpiresAt: new Date(Date.now() + 100000),
      candidate: { name: "Test" },
    };
    (prisma.interviewSession.findUnique as any).mockResolvedValue(mockSession);

    const result = await validateInvite(token);
    expect(result.valid).toBe(true);
    expect(result.session?.id).toBe("session-1");
  });

  it("fails validation for invalid token", async () => {
    (prisma.interviewSession.findUnique as any).mockResolvedValue(null);
    const result = await validateInvite("invalid-token");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invite not found");
  });

  it("fails validation for expired token", async () => {
    const token = "expired-token";
    const mockSession = {
      id: "session-2",
      inviteExpiresAt: new Date(Date.now() - 100000), // Past
    };
    (prisma.interviewSession.findUnique as any).mockResolvedValue(mockSession);

    const result = await validateInvite(token);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invite has expired");
  });
});
