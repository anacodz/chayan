import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuth = !!token;
  
  const isRecruiterPage = req.nextUrl.pathname.startsWith("/recruiter");
  const isRecruiterApi = req.nextUrl.pathname.startsWith("/api/recruiter");
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin");
  const isAdminApi = req.nextUrl.pathname.startsWith("/api/admin");

  // Not authenticated
  if ((isRecruiterPage || isRecruiterApi || isAdminPage || isAdminApi) && !isAuth) {
    const signInUrl = req.nextUrl.clone();
    signInUrl.pathname = "/auth/signin";
    signInUrl.search = `callbackUrl=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(signInUrl);
  }

  // Not an ADMIN trying to access ADMIN paths
  if ((isAdminPage || isAdminApi) && token?.role !== "ADMIN") {
    // If it's an API, return 403
    if (isAdminApi) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
    // If it's a page, redirect to recruiter dashboard with an error (or just 403)
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = "/recruiter";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/recruiter/:path*", "/api/recruiter/:path*", "/admin/:path*", "/api/admin/:path*"],
};
