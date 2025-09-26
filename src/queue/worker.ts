import { Worker } from "bullmq";
import { OAuth2Client } from "google-auth-library";
import { redisConfig } from "../config/redisConfig";
import { getEventsInNext5Minutes, makeCustomCall } from "../services/eventService";

interface JobData {
  email: string;
  phoneNumber: string;
  oauthCredentials: {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
  };
}


const worker = new Worker(
  "test-queue",
  async (job: { name: string; data: JobData }) => {
    const { email, phoneNumber, oauthCredentials } = job.data;

    try {
      const oauth2Client = new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
      });
      oauth2Client.setCredentials(oauthCredentials);

      const events = await getEventsInNext5Minutes(oauth2Client);
      if (events.length > 0) {
        for (const event of events) {
          if (!event.start?.dateTime && !event.start?.date) {
            console.warn(`Skipping event with no start time: ${event.summary}`);
            continue;
          }
          console.log(`Upcoming event for ${email}: ${event.summary}`);
          await makeCustomCall(
            phoneNumber,
            `Reminder: ${event.summary} starts at ${event.start?.dateTime || event.start?.date}`
          );
        }
      } else {
        console.log(`No events in the next 5 minutes for ${email}.`);
      }
    } catch (error) {
      console.error(`Error processing job for ${email}:`, error);
      throw error; 
    }
  },
  {
    connection: redisConfig,
    concurrency: 5, 
  }
);

process.on("SIGINT", async () => {
  await worker.close();
  process.exit(0);
});
