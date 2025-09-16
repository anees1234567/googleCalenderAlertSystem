
import { OAuth2Client } from "google-auth-library";

const clientId = process.env.GOOGLE_CLIENT_ID as string;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET as string;
const redirectUri = process.env.GOOGLE_REDIRECT_URI as string; // Align with .env

if (!clientId || !clientSecret || !redirectUri) {
  throw new Error(
    "Missing required environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI"
  );
}

export const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

export const getAuthUrl = (): string => {
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/calendar",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
};

export const getTokens = async (code: string): Promise<{
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
}> => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens as any;
  } catch (error) {
    console.error("Error retrieving Google OAuth tokens:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to retrieve OAuth tokens"
    );
  }
};