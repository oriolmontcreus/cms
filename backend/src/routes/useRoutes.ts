import { Hono } from "hono";
import { authRouter } from "@/src/routes/auth.routes.js";
import { userRouter } from "@/src/routes/user.routes.js";

export const useRoutes = (app: Hono) => {
  app.route("/api/auth", authRouter);
  app.route("/api/user", userRouter);
};
