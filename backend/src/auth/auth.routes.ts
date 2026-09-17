import { Router } from "express";
import { AuthController } from "./auth.controller";
import { requireAuth } from "./auth.middleware";

export const authRouter = Router();

authRouter.post("/register", AuthController.register);
authRouter.post("/login", AuthController.login);
authRouter.post("/logout", AuthController.logout);
authRouter.get("/me", requireAuth, AuthController.getProfile);
authRouter.get("/status", AuthController.status);
