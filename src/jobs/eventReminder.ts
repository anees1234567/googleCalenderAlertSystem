
import cron from "node-cron";
import { OAuth2Client } from "google-auth-library";
import { getEventsInNext5Minutes, makeCustomCall } from "../services/eventService";
import User from "../UserModel/UserModel";
let isCronScheduled = false;
if (!isCronScheduled) {
  console.log("Scheduling single cron job for activated users");
  cron.schedule("*/3 * * * *", async () => {
    console.log("🔄 Checking for upcoming events for activated users...");
    try {
      const activatedUsers = await User.find({ isActivated: true }).select(
        "email phoneNumber oauthCredentials"
      );
      if (activatedUsers.length === 0) {
        console.log("✅ No activated users found.");
        return;
      }
      for (const user of activatedUsers) {
        console.log(`Processing user: ${user.email}`);
        if (!user.oauthCredentials?.access_token) {
          console.warn(`Skipping user ${user.email}: No OAuth credentials`);
          continue;
        }
        const oauth2Client = new OAuth2Client({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          redirectUri: process.env.GOOGLE_REDIRECT_URI,
        });
        oauth2Client.setCredentials(user.oauthCredentials);
        if (
          !user.oauthCredentials.expiry_date ||
          user.oauthCredentials.expiry_date < Date.now()
        ) {
          try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);
            await User.updateOne(
              { email: user.email },
              { oauthCredentials: credentials }
            );
            console.log(`🔑 Access token refreshed for ${user.email}`);
          } catch (refreshError) {
            console.error(`Failed to refresh token for ${user.email}:`, refreshError);
            continue;
          }
        }
        const events = await getEventsInNext5Minutes(oauth2Client);
        if (events.length > 0) {
          for (const event of events) {
            if (!event.start?.dateTime && !event.start?.date) {
              console.warn(`Skipping event with no start time: ${event.summary}`);
              continue;
            }
            console.log(`📅 Upcoming event for ${user.email}: ${event.summary}`);
            try {
              await makeCustomCall(
                user.phoneNumber as string,
                `Reminder: ${event.summary} starts at ${event.start?.dateTime || event.start?.date}`
              );
            } catch (callError) {
              console.error(
                `Failed to send reminder for event ${event.summary} to ${user.email}:`,
                callError
              );
            }
          }
        } else {
          console.log(`✅ No events in the next 5 minutes for ${user.email}.`);
        }
      }
    } catch (error) {
      console.error("Error checking events for activated users:", error);
    }
  });
  isCronScheduled = true;
}