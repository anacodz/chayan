import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuth = !!req.auth;
  const isRecruiterPage = req.nextUrl.pathname.startsWith("/recruiter");
  const isRecruiterApi = req.nextUrl.pathname.startsWith("/api/recruiter");

  if ((isRecruiterPage || isRecruiterApi) && !isAuth) {
    return NextResponse.redirect(new URL("/auth/signin", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/recruiter/:path*", "/api/recruiter/:path*"],
};
