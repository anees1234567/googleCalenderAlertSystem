import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import ResponseHandlerMiddleware from "../src/Middleware/ResposeHandler";
import { HOST, PORT } from "../src/config/index";
import ErrorHandlerMiddleware from "../src/Middleware/ErrorHandler";
import { ActivatEvent, googleCallback, redirectToGoogle } from "./controller/authController";
import { getTodayEvents } from "./controller/eventController";
import connectDB from "./config/Database";
import "../src/jobs/eventReminder";
dotenv.config();
let isCronInitialized = false;

const app = express();
connectDB();
const server = http.createServer(app);
// Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true in production with HTTPS
  })
);
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(ResponseHandlerMiddleware);

// Routes
app.use("/auth/login", redirectToGoogle);
app.use("/auth/google/callback", googleCallback);
app.use("/events/today", getTodayEvents);
app.use("/events/Activate", ActivatEvent);
app.use(ErrorHandlerMiddleware);

// Start server
server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});