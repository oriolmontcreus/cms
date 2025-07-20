import { Hono } from "hono";
import { UserController } from "@/src/controllers/user.controller.js";
import { withAuth } from "@/src/guards/auth.guard.js";
import { withRateLimit } from "@/src/guards/rate-limit.guard.js";
const router = new Hono();
const userController = new UserController();
router.delete("/", withAuth(withRateLimit(userController.deleteUser.bind(userController), {
    limit: 3,
    windowSecs: 600,
    message: "Account deletion requests are limited. Please try again later.",
})));
export { router as userRouter };
