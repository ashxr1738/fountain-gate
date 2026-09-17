import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { authRouter } from "./auth/auth.routes";
import { getSupabaseConfig } from "./supabase/config";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: [frontendUrl, "http://localhost:3000"],
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

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`[Backend Server] running on http://localhost:${port}`);
    console.log(`[Backend Auth] endpoints ready at http://localhost:${port}/api/auth`);
  });
}

export default app;
