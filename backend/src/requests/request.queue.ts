import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { createAdminClient } from "../supabase/client";

export type RequestJob = {
  requestId: string;
  userId: string;
  assetId: string;
  purpose: string;
  requestedFrom: string;
  requestedUntil: string;
};

const queueName = "equipment-requests";

function redisConnection(): IORedis {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) throw new Error("REDIS_URL is not configured.");
  return new IORedis(redisUrl, { maxRetriesPerRequest: null });
}

export function getRequestQueue() {
  return new Queue<RequestJob>(queueName, { connection: redisConnection() });
}

async function processRequest(job: Job<RequestJob>) {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("request_asset_from_queue", {
    p_request_id: job.data.requestId,
    p_user_id: job.data.userId,
    p_asset_id: job.data.assetId,
    p_purpose: job.data.purpose,
    p_requested_from: job.data.requestedFrom,
    p_requested_until: job.data.requestedUntil,
  });
  if (error) throw new Error(error.message);
}

export function startRequestWorker() {
  if (!process.env.REDIS_URL) {
    console.warn("[Request Worker] REDIS_URL is not configured; worker is disabled.");
    return null;
  }
  const worker = new Worker<RequestJob>(queueName, processRequest, {
    connection: redisConnection(),
    concurrency: 4,
    limiter: { max: 20, duration: 1000 },
  });
  worker.on("completed", (job) => console.log(`[Request Worker] completed ${job.id}`));
  worker.on("failed", (job, error) => console.error(`[Request Worker] failed ${job?.id}: ${error.message}`));
  console.log("[Request Worker] listening for equipment requests");
  return worker;
}
