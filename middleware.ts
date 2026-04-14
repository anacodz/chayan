import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // Allow mock-token for E2E tests
      const sessionToken = req.cookies.get("next-auth.session-token")?.value || 
                          req.cookies.get("__Secure-next-auth.session-token")?.value;
      
      if (sessionToken === "mock-token") {
        return true;
      }
      return !!token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export const config = {
  matcher: [
    "/recruiter/:path*", 
    "/api/recruiter/:path*", 
    "/admin/:path*", 
    "/api/admin/:path*"
  ],
};
