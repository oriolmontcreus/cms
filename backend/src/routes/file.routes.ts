import { Hono } from "hono";
import { FileController } from "@/src/controllers/file.controller.js";
import { withAuth } from "@/src/guards/auth.guard.js";
import { withRateLimit } from "@/src/guards/rate-limit.guard.js";

const router = new Hono();
const fileController = new FileController();

router.post(
  "/upload",
    withAuth(fileController.upload.bind(fileController))
);

router.delete(
  "/delete",
    withAuth(fileController.delete.bind(fileController))
);

router.post(
  "/check-exists",
    withAuth(fileController.checkExists.bind(fileController))
);

export { router as fileRouter }; 