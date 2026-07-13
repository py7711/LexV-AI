import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { shouldUseDatabaseFallback, warnDatabaseFallback, withDatabaseTimeout } from "@/lib/database-fallback";
import { readLocalAuthUsersFromCookieHeader, verifyLocalAuthUser } from "@/lib/local-auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const hasGoogleConfig =
  Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);

const providers: NextAuthOptions["providers"] = [
  ...(hasGoogleConfig
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          authorization: {
            params: {
              prompt: "consent",
              access_type: "offline",
              response_type: "code",
              scope: "openid email profile"
            }
          }
        })
      ]
    : []),
  CredentialsProvider({
    id: "credentials",
    name: "Email",
    credentials: {
      email: { label: "Email address", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials, request) {
      const email = credentials?.email?.trim().toLowerCase();
      const password = credentials?.password ?? "";
      const demoEmail = process.env.DEVOICE_DEMO_EMAIL?.trim().toLowerCase();
      const demoPassword = process.env.DEVOICE_DEMO_PASSWORD;
      const isDemoLogin = Boolean(demoEmail && demoPassword && email === demoEmail && password === demoPassword);

      if (!email || !password) {
        return null;
      }
      const normalizedEmail = email;
      const submittedPassword = password;
      const cookieHeader =
        typeof request?.headers?.get === "function"
          ? request.headers.get("cookie")
          : typeof (request?.headers as { cookie?: unknown } | undefined)?.cookie === "string"
            ? (request?.headers as { cookie: string }).cookie
            : null;

      async function authorizeLocalRegisteredUser() {
        const localUser = await verifyLocalAuthUser(
          readLocalAuthUsersFromCookieHeader(cookieHeader),
          normalizedEmail,
          submittedPassword
        );
        if (!localUser) return null;
        return {
          id: localUser.id,
          email: localUser.email,
          name: localUser.name
        };
      }

      if (shouldUseDatabaseFallback()) {
        const localUser = await authorizeLocalRegisteredUser();
        if (localUser) return localUser;
      }

      if (isDemoLogin && shouldUseDatabaseFallback()) {
        return {
          id: `demo-${normalizedEmail.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
          email: normalizedEmail,
          name: normalizedEmail.split("@")[0]
        };
      }

      let existingUser;
      try {
        existingUser = await withDatabaseTimeout(prisma.user.findUnique({ where: { email: normalizedEmail } }), {
          message: "DeVoice user lookup timed out."
        });
      } catch (error) {
        const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
        if (code === "P2022") {
          const localUser = await authorizeLocalRegisteredUser();
          return localUser;
        }
        if (isDemoLogin) {
          warnDatabaseFallback("Using local DeVoice demo login because the database is unavailable", error);
          return {
            id: `demo-${normalizedEmail.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
            email: normalizedEmail,
            name: normalizedEmail.split("@")[0]
          };
        }
        const localUser = await authorizeLocalRegisteredUser();
        if (localUser) {
          warnDatabaseFallback("Using local DeVoice registered login because the database is unavailable", error);
          return localUser;
        }
        throw error;
      }

      if (existingUser?.passwordHash) {
        if (isDemoLogin) {
          return {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name
          };
        }

        const validPassword = await verifyPassword(submittedPassword, existingUser.passwordHash);
        if (!validPassword) {
          return null;
        }

        return {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name
        };
      }

      if (!isDemoLogin) {
        const localUser = await authorizeLocalRegisteredUser();
        return localUser;
      }

      if (existingUser) {
        return {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name
        };
      }

      let user;
      try {
        user = await withDatabaseTimeout(
          prisma.user.create({
            data: {
              email: normalizedEmail,
              name: normalizedEmail.split("@")[0],
              locale: "en",
              role: "USER"
            }
          }),
          {
            message: "DeVoice demo user creation timed out."
          }
        );
      } catch (error) {
        warnDatabaseFallback("Using local DeVoice demo login because demo account creation is unavailable", error);
        return {
          id: `demo-${email.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
          email,
          name: email.split("@")[0]
        };
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name
      };
    }
  })
];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt"
  },
  providers,
  pages: {
    signIn: "/en"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub ?? "");
      }
      return session;
    }
  }
};
