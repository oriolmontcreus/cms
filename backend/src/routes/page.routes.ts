import { Hono } from "hono";
import { PageController } from "@/src/controllers/page.controller.js";

export const pageRouter = new Hono()
  .get("/", PageController.getPages)
  .post("/", PageController.createPage); 