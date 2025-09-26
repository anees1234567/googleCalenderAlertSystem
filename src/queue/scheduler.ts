import { Queue } from "bullmq";
import cron from "node-cron";
import { OAuth2Client } from "google-auth-library";
import { redisConfig } from "../config/redisConfig";
import User, { IUser } from "../UserModel/UserModel";
import connectDB from "../config/Database"


const testQueue = new Queue("test-queue", {
  connection: redisConfig,
});

connectDB();
async function scheduleEventChecks() {
  try {
    console.log("🔄 Checking for activated users to schedule jobs...");
    const activatedUsers: IUser[] = await User.find({ isActivated: true }).select(
      "email phoneNumber oauthCredentials"
    );

    if (activatedUsers.length === 0) {
      console.log("No activated users found.");
      return;
    }

    for (const user of activatedUsers) {
      console.log(`Scheduling job for user: ${user.email}`);
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

      await testQueue.add(
        `check-events-${user.email}`,
        {
          email: user.email,
          phoneNumber: user.phoneNumber,
          oauthCredentials: user.oauthCredentials,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        }
      );
      console.log(`Job added for ${user.email}`);
    }
  } catch (error) {
    console.error("Error scheduling event checks:", error);
  }
}

cron.schedule("* * * * *", async () => {
  await scheduleEventChecks();
});

scheduleEventChecks().then(() => {
  console.log("Scheduler running...");
});