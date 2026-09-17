import { randomUUID } from "node:crypto";
import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../auth/auth.middleware";
import { getRequestQueue } from "./request.queue";

export const requestRouter = Router();

requestRouter.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { assetId, purpose, requestedFrom, requestedUntil } = req.body ?? {};
  const from = new Date(requestedFrom);
  const until = new Date(requestedUntil);
  if (!req.user?.id || !assetId || typeof purpose !== "string" || !purpose.trim() || Number.isNaN(from.getTime()) || Number.isNaN(until.getTime()) || until <= from) {
    res.status(400).json({ error: "A valid asset, purpose, start time, and later return time are required." });
    return;
  }

  try {
    const requestId = randomUUID();
    const queue = getRequestQueue();
    await queue.add("create-request", {
      requestId,
      userId: req.user.id,
      assetId: String(assetId),
      purpose: purpose.trim(),
      requestedFrom: from.toISOString(),
      requestedUntil: until.toISOString(),
    }, { jobId: requestId, attempts: 5, backoff: { type: "exponential", delay: 2000 }, removeOnComplete: 1000, removeOnFail: false });
    await queue.close();
    res.status(202).json({ requestId, status: "queued" });
  } catch (error: any) {
    res.status(503).json({ error: error.message || "Request queue is unavailable." });
  }
});
