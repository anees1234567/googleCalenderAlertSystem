import dotenv from "dotenv";
dotenv.config();


export const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
// export const DB_URL = process.env.databaseUrl || 'database_url';
export const HOST = process.env.HOST || 'localhost';


export const allowedOrigins: string[] = [
  "http://localhost:3001",
  "https://blogiflow.netlify.app"
];



