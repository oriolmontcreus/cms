import { Hono } from "hono";
import { BuildController } from "@/src/controllers/build.controller.js";

export const buildRouter = new Hono()
    .post("/", BuildController.triggerBuild); 