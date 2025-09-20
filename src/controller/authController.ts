

import { Request, Response } from "express";
import { google } from "googleapis"; // Import googleapis
import { getAuthUrl, getTokens } from "../config/Oauth";
import User from "../UserModel/UserModel";
import { savePhoneNumberService } from "../services/userService";

export const redirectToGoogle = (req: Request, res: Response) => {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Missing or invalid authorization code" });
    }

    const tokens = await getTokens(code);

    const oauth2Client = new google.auth.OAuth2({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    });
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    const email = data.email;
    if (!email) {
      return res.status(400).json({ error: "Unable to retrieve user email" });
    }
    await User.updateOne(
      { email },
      { oauthCredentials: tokens },
      { upsert: true }
    );
      res.cookie("accessToken", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 1000, 
    });
    req.session.user = { email };
    res.redirect("http://localhost:3000/dashboard");
  } catch (error) {
    console.error("Error in Google callback:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};


export const ActivatEvent = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    const email = req.session?.user?.email;
    if ( !phoneNumber) {
      return res.status(400).json({ error: "Email and phone number are required" });
    }
     const user = await savePhoneNumberService({ email, phoneNumber });
    console.log(`Phone number saved and reminders activated for ${email}`);
    return res.status(200).json({ message: "Phone number saved and reminders activated", user });
  } catch (error: any) {
    console.error("Error saving phone number:", error.message || error);
    return res.status(500).json({ error: error.message || "Failed to save phone number" });
  }
};




