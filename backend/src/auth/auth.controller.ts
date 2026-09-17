import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { AuthenticatedRequest, extractToken } from "./auth.middleware";

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    const { email, password, name } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    try {
      const data = await AuthService.signUp(email, password, name || "");
      res.status(201).json({
        message: "Registration successful. Please check your email or proceed to login.",
        user: data.user,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Registration failed" });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    try {
      const result = await AuthService.signIn(email, password);

      if (result.session) {
        res.cookie("access_token", result.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: result.session.expires_in * 1000,
        });
      }

      res.status(200).json({
        message: "Login successful",
        session: result.session,
        user: result.user,
        profile: result.profile,
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message || "Invalid credentials" });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = extractToken(req);
      await AuthService.signOut(token || undefined);

      res.clearCookie("access_token");
      res.status(200).json({ message: "Logout successful" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Logout failed" });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(200).json({
        user: req.user,
        profile: req.profile,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to retrieve profile" });
    }
  }

  static async status(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      configured: AuthService.isConfigured(),
      timestamp: new Date().toISOString(),
    });
  }
}
