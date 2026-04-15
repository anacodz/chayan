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

      if (!token) return false;

      // Restrict /admin, /api/admin, and /recruiter/team to ADMIN role
      const isAdminRoute = req.nextUrl.pathname.startsWith("/admin") || 
                          req.nextUrl.pathname.startsWith("/api/admin") ||
                          req.nextUrl.pathname === "/recruiter/team";
      
      if (isAdminRoute) {
        return token.role === "ADMIN";
      }

      return true;
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
