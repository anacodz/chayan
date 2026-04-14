import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashToken, validateInvite, createInviteToken } from "./invites";
import prisma from "./prisma";
import * as jose from "jose";

vi.mock("./prisma", () => ({
  default: {
    interviewSession: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock jose
vi.mock("jose", async () => {
  const actual = await vi.importActual("jose");
  return {
    ...actual,
    jwtVerify: vi.fn(),
    SignJWT: vi.fn().mockImplementation(() => ({
      setProtectedHeader: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue("mocked-jwt-token"),
    })),
  };
});

describe("invites utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    const payload = { candidateId: "cand-1", sessionId: "session-1" };
    
    (jose.jwtVerify as any).mockResolvedValue({ payload });
    
    const mockSession = {
      id: "session-1",
      inviteTokenHash: hashToken(token),
      inviteExpiresAt: new Date(Date.now() + 100000),
      candidate: { name: "Test" },
    };
    (prisma.interviewSession.findUnique as any).mockResolvedValue(mockSession);

    const result = await validateInvite(token);
    expect(result.valid).toBe(true);
    expect(result.session?.id).toBe("session-1");
  });

  it("fails validation for invalid signature", async () => {
    (jose.jwtVerify as any).mockRejectedValue(new Error("invalid signature"));
    
    const result = await validateInvite("invalid-token");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid or expired token signature");
  });

  it("fails validation for missing session in DB", async () => {
    const token = "token-not-in-db";
    (jose.jwtVerify as any).mockResolvedValue({ 
      payload: { candidateId: "c1", sessionId: "s1" } 
    });
    (prisma.interviewSession.findUnique as any).mockResolvedValue(null);

    const result = await validateInvite(token);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invite session not found in database");
  });

  it("fails validation for expired token in DB", async () => {
    const token = "expired-token";
    (jose.jwtVerify as any).mockResolvedValue({ 
      payload: { candidateId: "c1", sessionId: "s1" } 
    });
    
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
