import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { authRouter } from "./auth/auth.routes";
import { getSupabaseConfig } from "./supabase/config";
import { requestRouter } from "./requests/request.routes";
import { startRequestWorker } from "./requests/request.queue";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

const allowedOrigins = [
  frontendUrl,
  "http://localhost:3000",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:19000",
  "http://localhost:19006",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like native mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith("exp://") ||
        origin.startsWith("http://192.168.") ||
        origin.startsWith("http://10.") ||
        origin.startsWith("capacitor://")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get("/health", (_req, res) => {
  const config = getSupabaseConfig();
  res.json({
    status: "ok",
    service: "fountain-gate-backend",
    supabaseConfigured: config.isConfigured,
    time: new Date().toISOString(),
  });
});

// Mount authentication routes under /api/auth
app.use("/api/auth", authRouter);
app.use("/api/requests", requestRouter);

if (process.env.NODE_ENV !== "test") {
  startRequestWorker();
  app.listen(port, "0.0.0.0", () => {
    console.log(`[Backend Server] running on http://0.0.0.0:${port}`);
    console.log(`[Backend Auth] endpoints ready at http://localhost:${port}/api/auth`);
  });
}

export default app;
