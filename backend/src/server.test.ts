process.env.NODE_ENV = "test";
import assert from "node:assert";
import { test, describe } from "node:test";
import app from "./server";

describe("Backend API Integration Tests", () => {
  test("GET /health returns status ok", async () => {
    // Test Express route logic directly
    const req = {} as any;
    let resData: any = null;
    const res = {
      json: (data: any) => {
        resData = data;
      },
    } as any;

    // Call health route handler logic
    const routes = app._router.stack.filter((r: any) => r.route && r.route.path === "/health");
    assert.strictEqual(routes.length, 1);
    await routes[0].route.stack[0].handle(req, res);

    assert.strictEqual(resData.status, "ok");
    assert.strictEqual(resData.service, "fountain-gate-backend");
    assert.ok(resData.time);
  });
});
