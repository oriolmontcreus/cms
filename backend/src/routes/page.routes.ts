import { Hono } from "hono";
import { PageController } from "@/src/controllers/page.controller.js";

export const pageRouter = new Hono()
  .get("/", PageController.getPages)
  .get("/:slug", PageController.getPageBySlug)
  .post("/", PageController.createPage)
  .put("/:slug", PageController.updatePage)
  .post("/:slug/form-data", PageController.saveFormData); 