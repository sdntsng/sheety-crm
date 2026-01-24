import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: any) {
    try {
        const url =
            "https://oauth2.googleapis.com/token?" +
            new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID || "",
                client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
            });

        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
        });

        const refreshedTokens = await response.json();

        if (!response.ok) {
            throw refreshedTokens;
        }

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            // Google gives expires_in in seconds
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
        };
    } catch (error) {
        console.log("RefreshAccessTokenError", error);

        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}

const providers: any[] = [
    Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
            params: {
                scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file openid email profile",
                prompt: "consent",
                access_type: "offline",
                response_type: "code"
            }
        }
    }),
];

// MOCK MODE: Add CredentialsProvider if enabled
if (process.env.NEXT_PUBLIC_MOCK_AUTH === "true") {
    console.log("[NextAuth] Mock Mode Enabled: Adding CredentialsProvider");
    providers.push(
        CredentialsProvider({
            id: "mock-login",
            name: "Mock Login (Dev)",
            credentials: {},
            authorize: async () => {
                return {
                    id: "mock-user-1",
                    name: "Dev User",
                    email: "dev@localhost",
                    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
                    accessToken: "mock_token_xyz" // Backend checks this
                } as any
            }
        })
    );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers,
    callbacks: {
        async jwt({ token, account, user }) {
            // Initial sign in
            if (account && user) {
                console.log("[NextAuth] Initial sign-in, storing tokens");
                return {
                    accessToken: account.access_token,
                    // expires_at is seconds since epoch
                    accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000,
                    refreshToken: account.refresh_token,
                    user,
                };
            }

            // Return previous token if the access token has not expired yet
            // @ts-ignore
            const expiresAt = token.accessTokenExpires as number;
            if (Date.now() < expiresAt) {
                return token;
            }

            console.log("[NextAuth] Access token expired, refreshing...");
            // Access token has expired, try to update it
            return refreshAccessToken(token);
        },
        async session({ session, token }) {
            // @ts-ignore
            session.user = token.user;
            // @ts-ignore
            session.accessToken = token.accessToken;
            // @ts-ignore
            session.error = token.error;

            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
});
