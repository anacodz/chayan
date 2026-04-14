import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // Bypass for E2E tests
      if (req.cookies.get("next-auth.session-token")?.value === "mock-token") {
        return true;
      }
      return !!token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});

export const config = {
  matcher: [
    "/recruiter/:path*", 
    "/api/recruiter/:path*", 
    "/admin/:path*", 
    "/api/admin/:path*"
  ],
};
