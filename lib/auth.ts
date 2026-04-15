import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Hardcoded credentials for production fix
        if (credentials?.email === "admin@cuemath.com" && credentials?.password === "admin123") {
          return { 
            id: "admin-static", 
            name: "Cuemath Admin", 
            email: "admin@cuemath.com", 
            role: "ADMIN" 
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error -- session user type extension
        session.user.id = token?.sub;
        // @ts-expect-error -- session user type extension
        session.user.role = (token as any)?.role || "RECRUITER";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
  },
};

export const auth = () => getServerSession(authOptions);
