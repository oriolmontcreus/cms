import { Hono } from "hono";
import { AuthController } from "@/src/controllers/auth.controller.js";
import { withAuth } from "@/src/guards/auth.guard.js";
import { withRateLimit } from "@/src/guards/rate-limit.guard.js";

const router = new Hono();
const authController = new AuthController();

router.post(
  "/login",
  withRateLimit(authController.login.bind(authController), {
    limit: 5,
    windowSecs: 60,
    message: "Too many login attempts. Please try again in a minute.",
  }),
);
router.post("/logout", authController.logout.bind(authController));
router.post(
  "/register",
  withRateLimit(authController.register.bind(authController), {
    limit: 5,
    windowSecs: 120, // 2 minutes
    message: "Too many registration attempts. Please try again later.",
  }),
);
router.get(
  "/me",
  withRateLimit(
    withAuth(authController.getCurrentUser.bind(authController)),
    {
      limit: 30,
      windowSecs: 60,
    },
  ),
);

export { router as authRouter };
