import { Request, Response } from "express";
import { google } from "googleapis";
import { getAuthUrl, getTokens } from "../config/Oauth";
import User from "../UserModel/UserModel";
import { savePhoneNumberService } from "../services/userService";
import { IError } from "@utility/interface"; 

export const redirectToGoogle = (req: Request, res: Response) => {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
};


export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== "string") {
      const error: IError = new Error("Missing or invalid authorization code");
      error.statusCode = 400;
      throw error;
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
      const error: IError = new Error("Unable to retrieve user email");
      error.statusCode = 400;
      throw error;
    }

    await User.updateOne({ email }, { oauthCredentials: tokens }, { upsert: true });

    res.cookie("accessToken", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 1000,
    });

    req.session.user = { email };
    return res.success({ redirect: "http://localhost:3000/dashboard" }, "Authentication successful", 200);
  } catch (error: any) {
    error.statusCode = error.statusCode || 500;
    throw error;
  }
};
export const ActivatEvent = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    const email = req.session?.user?.email;
    if (!email || !phoneNumber) {
      const error: IError = new Error("Email and phone number are required");
      error.statusCode = 400;
      throw error;
    }
    const user = await savePhoneNumberService({ email, phoneNumber });
    return res.success(user, "Phone number saved and reminders activated", 200);
  } catch (error: any) {
    error.statusCode = error.statusCode || 500;
    throw error;
  }
};
