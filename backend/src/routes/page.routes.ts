import { Hono } from "hono";
import { PageController } from "@/src/controllers/page.controller.js";

export const pageRouter = new Hono()
  .put("/:slug/components", PageController.updateComponents)
  .put("/:slug/components/:instanceId", PageController.updateComponentFormData); 