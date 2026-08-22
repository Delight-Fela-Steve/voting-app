import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Role } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const LOGIN_RATE_LIMIT = 8;
const LOGIN_RATE_WINDOW_MS = 15 * 60_000;
const DUMMY_PASSWORD_HASH =
  "$2a$12$" + "a".repeat(53);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const allowed = await checkRateLimit(
          `login:${email.toLowerCase()}`,
          LOGIN_RATE_LIMIT,
          LOGIN_RATE_WINDOW_MS,
        );
        if (!allowed) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
