import NextAuth, { NextAuthOptions, getServerSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any),
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
        // @ts-ignore -- session user type extension
        session.user.id = user?.id || token?.sub;
        // @ts-ignore -- session user type extension
        session.user.role = user?.role || (token as any)?.role || "RECRUITER";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore -- session user type extension
        token.role = (user as unknown as any).role;
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
};

export const auth = () => getServerSession(authOptions);
