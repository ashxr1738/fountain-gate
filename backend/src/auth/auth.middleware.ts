import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import type { Profile } from "../types";

export interface AuthenticatedRequest extends Request {
  user?: any;
  profile?: Profile | null;
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  if (req.cookies && (req.cookies.access_token || req.cookies["sb-access-token"])) {
    return req.cookies.access_token || req.cookies["sb-access-token"];
  }
  return null;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized: Missing authentication token" });
    return;
  }

  try {
    const verified = await AuthService.verifyToken(token);
    if (!verified || !verified.user) {
      res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
      return;
    }

    req.user = verified.user;
    req.profile = verified.profile;
    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Authentication error" });
  }
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, () => {
    if (!req.profile || !AuthService.isAdmin(req.profile.role)) {
      res.status(403).json({ error: "Forbidden: Administrator privileges required" });
      return;
    }
    next();
  });
}
