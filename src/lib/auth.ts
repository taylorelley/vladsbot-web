import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

// Authentik OAuth Provider configuration
const authentikProvider = {
  id: "authentik",
  name: "Authentik",
  type: "oidc" as const,
  issuer: process.env.AUTHENTIK_ISSUER,
  clientId: process.env.AUTHENTIK_CLIENT_ID,
  clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
  authorization: {
    params: {
      scope: "openid email profile",
    },
  },
  profile(profile: Record<string, unknown>) {
    return {
      id: profile.sub as string,
      name: profile.name as string || profile.preferred_username as string,
      email: profile.email as string,
      image: profile.picture as string | undefined,
    };
  },
};

export const authConfig: NextAuthConfig = {
  providers: [authentikProvider],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnChat = nextUrl.pathname === "/" || nextUrl.pathname.startsWith("/chat");
      const isOnLogin = nextUrl.pathname === "/login";
      
      if (isOnChat) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      } else if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }
      return true;
    },
    jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
