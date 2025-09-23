
import { Request, Response } from "express";
import { oauth2Client } from "../config/Oauth";
import { getTodayEventsService } from "../services/eventService";
import { twilioClient } from "../config/twilio";
import User from "../UserModel/UserModel";
import { IError } from "@utility/interface";

export const getTodayEvents = async (req: Request, res: Response) => {
  try {
    const email = req.session?.user?.email;
    if (!email) {
      const error: IError = new Error("Unauthorized - no email in session");
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findOne({ email });
    if (!user || !user.oauthCredentials) {
      const error: IError = new Error("Unauthorized - no credentials found");
      error.statusCode = 401;
      throw error;
    }

    oauth2Client.setCredentials({
      access_token: user.oauthCredentials.access_token,
      refresh_token: user.oauthCredentials.refresh_token,
      expiry_date: user.oauthCredentials.expiry_date,
    });

    const events = await getTodayEventsService(oauth2Client);

    return res.success(events, "Today's events fetched successfully", 200);
  } catch (error: any) {
    error.statusCode = error.statusCode || 500;
    throw error; 
  }
};

export const twilioTestCall = async (req: Request, res: Response) => {
  try {
    const call = await twilioClient.calls.create({
      to: "+918547489236",
      from: process.env.TWILIO_PHONE_NUMBER!,
      url: "http://demo.twilio.com/docs/voice.xml",
    });

    return res.success(
      { callSid: call.sid },
      "Test call initiated successfully",
      200
    );
  } catch (error: any) {
    error.statusCode = error.statusCode || 500;
    throw error; 
  }
};
