
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import dayjs from "dayjs";
import { twilioClient } from "../config/twilio";

export const getTodayEventsService = async (oauth2Client: OAuth2Client) => {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const startOfDay = dayjs().startOf("day").toISOString();
  const endOfDay = dayjs().endOf("day").toISOString();

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: startOfDay,
    timeMax: endOfDay,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
};

export async function getEventsInNext5Minutes(oauth2Client: OAuth2Client) {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const now = new Date();
  const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);
  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: fiveMinutesLater.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });
  console.log("Events fetched:", response.data.items);

  const events = response.data.items || [];
  return events.map((event) => ({
    id: event.id,
    summary: event.summary || "No Title",
    start: event.start,
    end: event.end,
  }));
}

export async function makeCustomCall(to: string, message: string) {
  try {
    const call = await twilioClient.calls.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER!,
      twiml: `<Response><Say voice="alice">${message}</Say></Response>`,
    });
    console.log("Call initiated:", call.sid);
    return call;
  } catch (error) {
    console.error(" Error making call:", error);
    throw error;
  }
}
