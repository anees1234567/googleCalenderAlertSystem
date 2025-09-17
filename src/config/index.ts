import dotenv from "dotenv";
dotenv.config();


export const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
export const DB_URL = process.env.MONGO_URI  || 'database_url';
export const HOST = process.env.HOST || 'localhost';






