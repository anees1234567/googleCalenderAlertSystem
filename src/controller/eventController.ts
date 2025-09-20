// src/controller/calendarController.ts
import { Request, Response } from "express";
import { oauth2Client } from "../config/Oauth";
import { getTodayEventsService } from "../services/eventService";
import { twilioClient } from "../config/twilio";
import User from '../UserModel/UserModel'

   export const getTodayEvents = async (req: Request, res: Response) => {
  try {
    // ✅ Get email from session (set in googleCallback)
    const email = req.session?.user?.email;
    if (!email) {
      return res.status(401).json({ error: "Unauthorized - no email in session" });
    }

    // ✅ Find user in DB
    const user = await User.findOne({ email });
    if (!user || !user.oauthCredentials) {
      return res.status(401).json({ error: "Unauthorized - no credentials found" });
    }

    // ✅ Set credentials for Google API
    oauth2Client.setCredentials({
      access_token: user.oauthCredentials.access_token,
      refresh_token: user.oauthCredentials.refresh_token,
      expiry_date: user.oauthCredentials.expiry_date,
    });

    // ✅ Get events
    const events = await getTodayEventsService(oauth2Client);

    return res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching today's events:", error);
    return res.status(500).json({ error: "Failed to fetch events" });
  }
};

    export const twilioTestCall = async (req: Request, res: Response) => {
      try {
        const call = await twilioClient.calls.create({
          to: "+918547489236",
          from: process.env.TWILIO_PHONE_NUMBER!,
          url: "http://demo.twilio.com/docs/voice.xml"
        });
        res.status(200).json({ message: "Call initiated", callSid: call.sid });
      } catch (err) {
        console.error("Error making call:", err);
        res.status(500).json({ error: "Failed to make call" });
      }
    }
