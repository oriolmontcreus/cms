import { Hono } from "hono";
import { AuthController } from "@/src/controllers/auth.controller.js";
import { withAuth } from "@/src/guards/auth.guard.js";
import { withRateLimit } from "@/src/guards/rate-limit.guard.js";

const router = new Hono();
const authController = new AuthController();

router.post(
  "/login",
  withRateLimit(authController.login.bind(authController), {
    limit: 10,
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

router.get(
  "/setup/status",
  withRateLimit(authController.checkSetupStatus.bind(authController), {
    limit: 10,
    windowSecs: 60,
    message: "Too many setup status requests. Please try again later.",
  }),
);

router.post(
  "/setup/superadmin",
  withRateLimit(authController.setupSuperAdmin.bind(authController), {
    limit: 3,
    windowSecs: 120,
    message: "Too many setup attempts. Please try again later in a couple of minutes.",
  }),
);

export { router as authRouter };
