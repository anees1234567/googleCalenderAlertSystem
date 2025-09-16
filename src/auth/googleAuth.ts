
import { oauth2Client } from "../config/Oauth";
import { google } from "googleapis";


export const getTokens = async (code: string) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
};


export const getUserInfo = async () => {
  const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
  const { data } = await oauth2.userinfo.get();
  return data;
};