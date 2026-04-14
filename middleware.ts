import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
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
