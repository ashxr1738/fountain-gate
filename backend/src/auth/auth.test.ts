import assert from "node:assert";
import { test, describe } from "node:test";
import { AuthService } from "./auth.service";
import { extractToken } from "./auth.middleware";

describe("Auth Logic & Utilities Unit Tests", () => {
  test("isAdmin returns true for ADMIN and DEVELOPER roles", () => {
    assert.strictEqual(AuthService.isAdmin("ADMIN"), true);
    assert.strictEqual(AuthService.isAdmin("DEVELOPER"), true);
    assert.strictEqual(AuthService.isAdmin("USER"), false);
    assert.strictEqual(AuthService.isAdmin(undefined), false);
  });

  test("extractToken correctly extracts Bearer tokens from authorization header", () => {
    const mockReq = {
      headers: {
        authorization: "Bearer test_bearer_token_12345",
      },
      cookies: {},
    } as any;

    const token = extractToken(mockReq);
    assert.strictEqual(token, "test_bearer_token_12345");
  });

  test("extractToken correctly extracts token from cookies when header is missing", () => {
    const mockReq = {
      headers: {},
      cookies: {
        access_token: "cookie_token_abc",
      },
    } as any;

    const token = extractToken(mockReq);
    assert.strictEqual(token, "cookie_token_abc");
  });

  test("extractToken returns null when no token is present", () => {
    const mockReq = {
      headers: {},
      cookies: {},
    } as any;

    const token = extractToken(mockReq);
    assert.strictEqual(token, null);
  });
});
