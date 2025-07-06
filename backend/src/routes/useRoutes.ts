import { Hono } from "hono";
import { authRouter } from "@/src/routes/auth.routes.js";
import { userRouter } from "@/src/routes/user.routes.js";
import { pageRouter } from "@/src/routes/page.routes.js";
import { buildRouter } from "@/src/routes/build.routes.js";
import { fileRouter } from "@/src/routes/file.routes.js";

export const useRoutes = (app: Hono) => {
  app.route("/api/auth", authRouter);
  app.route("/api/user", userRouter);
  app.route("/api/pages", pageRouter);
  app.route("/api/build", buildRouter);
  app.route("/api/files", fileRouter);
};
