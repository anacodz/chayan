import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuth = !!req.auth;
  const isRecruiterPage = req.nextUrl.pathname.startsWith("/recruiter");
  const isRecruiterApi = req.nextUrl.pathname.startsWith("/api/recruiter");
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin");
  const isAdminApi = req.nextUrl.pathname.startsWith("/api/admin");

  if ((isRecruiterPage || isRecruiterApi || isAdminPage || isAdminApi) && !isAuth) {
    return NextResponse.redirect(new URL("/auth/signin", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/recruiter/:path*", "/api/recruiter/:path*", "/admin/:path*", "/api/admin/:path*"],
};
