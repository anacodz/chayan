import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Temporary Credentials provider for development
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // In a real app, verify the password hash. 
        // For the build challenge, we allow a development bypass or simple check.
        if (credentials?.email === "admin@cuemath.com" && credentials?.password === "admin123") {
          return { id: "admin", name: "Admin", email: "admin@cuemath.com", role: "ADMIN" };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = user?.id || token?.sub;
        // @ts-ignore
        session.user.role = user?.role || token?.role || "RECRUITER";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore
        token.role = user.role;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
});
