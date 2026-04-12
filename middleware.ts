import { NextRequest, NextResponse } from "next/server";

export default function middleware(req: NextRequest) {
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  const isAuth = !!sessionToken;
  const isRecruiterPage = req.nextUrl.pathname.startsWith("/recruiter");
  const isRecruiterApi = req.nextUrl.pathname.startsWith("/api/recruiter");
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin");
  const isAdminApi = req.nextUrl.pathname.startsWith("/api/admin");

  if ((isRecruiterPage || isRecruiterApi || isAdminPage || isAdminApi) && !isAuth) {
    const signInUrl = req.nextUrl.clone();
    signInUrl.pathname = "/auth/signin";
    signInUrl.search = `callbackUrl=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/recruiter/:path*", "/api/recruiter/:path*", "/admin/:path*", "/api/admin/:path*"],
};
