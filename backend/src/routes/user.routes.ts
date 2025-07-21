import { Hono } from "hono";
import { UserController } from "@/src/controllers/user.controller.js";
import { withAuth } from "@/src/guards/auth.guard.js";
import { withRateLimit } from "@/src/guards/rate-limit.guard.js";
import { Roles } from "@shared/constants/role.type.js";

const router = new Hono();
const userController = new UserController();

// Get all users (superadmin only)
router.get(
  "/",
  withAuth(withRateLimit(userController.getAllUsers.bind(userController), {
    limit: 30,
    windowSecs: 60,
    message: "Too many requests. Please try again later.",
  }), Roles.SUPER_ADMIN),
);

// Get user by ID (superadmin only)
router.get(
  "/:id",
  withAuth(withRateLimit(userController.getUserById.bind(userController), {
    limit: 30,
    windowSecs: 60,
    message: "Too many requests. Please try again later.",
  }), Roles.SUPER_ADMIN),
);

// Create new user (superadmin only)
router.post(
  "/",
  withAuth(withRateLimit(userController.createUser.bind(userController), {
    limit: 10,
    windowSecs: 300, // 5 minutes
    message: "Too many user creation attempts. Please try again later.",
  }), Roles.SUPER_ADMIN),
);

// Update user (superadmin only)
router.put(
  "/:id",
  withAuth(withRateLimit(userController.updateUser.bind(userController), {
    limit: 20,
    windowSecs: 300, // 5 minutes
    message: "Too many update attempts. Please try again later.",
  }), Roles.SUPER_ADMIN),
);

// Delete user by ID (superadmin only)
router.delete(
  "/:id",
  withAuth(withRateLimit(userController.deleteUserById.bind(userController), {
    limit: 5,
    windowSecs: 600, // 10 minutes
    message: "User deletion requests are limited. Please try again later.",
  }), Roles.SUPER_ADMIN),
);

// Delete own account (any authenticated user)
router.delete(
  "/",
  withAuth(withRateLimit(userController.deleteUser.bind(userController), {
    limit: 3,
    windowSecs: 600,
    message: "Account deletion requests are limited. Please try again later.",
  })),
);

export { router as userRouter };
