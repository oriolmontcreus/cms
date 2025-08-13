import { Hono } from "hono";
import { GlobalVariablesController } from "@/src/controllers/globalVariables.controller.js";

export const globalVariablesRouter = new Hono()
    .put("/", GlobalVariablesController.updateGlobalVariables);
