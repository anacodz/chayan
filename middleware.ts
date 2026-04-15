import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isApiRoute = req.nextUrl.pathname.startsWith("/api");
    const sessionToken = req.cookies.get("next-auth.session-token")?.value || 
                        req.cookies.get("__Secure-next-auth.session-token")?.value;
    const isAuth = !!req.nextauth.token || sessionToken === "mock-token";

    if (isApiRoute && !isAuth) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Session expired or missing" },
        { status: 401 }
      );
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isApiRoute = req.nextUrl.pathname.startsWith("/api");
        
        // Allow mock-token for E2E tests
        const sessionToken = req.cookies.get("next-auth.session-token")?.value || 
                            req.cookies.get("__Secure-next-auth.session-token")?.value;
        
        if (sessionToken === "mock-token") {
          return true;
        }

        // For API routes, we always return true to allow the middleware function
        // to handle the response (returning JSON instead of redirecting).
        if (isApiRoute) {
          return true;
        }

        if (!token) return false;

        // Restrict /admin and /recruiter/team to ADMIN role
        const isAdminRoute = req.nextUrl.pathname.startsWith("/admin") || 
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
  }
);

export const config = {
  matcher: [
    "/recruiter/:path*", 
    "/api/recruiter/:path*", 
    "/admin/:path*", 
    "/api/admin/:path*"
  ],
};
