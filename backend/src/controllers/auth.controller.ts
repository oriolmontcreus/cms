import { Context } from "hono";
import * as authService from "@/src/services/auth.service.js";
import BadRequest from "@/errors/BadRequest.js";
import AlreadyExists from "@/errors/AlreadyExists.js";
import { User } from "@shared/types/user.type.js";
import {
  getCookie,
  setCookie,
  deleteCookie,
} from 'hono/cookie'

export class AuthController {
  async login(c: Context) {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      throw new BadRequest("Email and password are required");
    }

    const { token, user } = await authService.login(email, password);

    //TODO: IS THIS WELL DONE ENOUGH?
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "Lax" as const,
    };
    setCookie(c, "session", token, cookieOptions);
    return c.json(user);
  }

  async register(c: Context) {
    const payload = await c.req.json();
    try {
      const res: User = await authService.register(payload);
      return c.json(res);
    } catch (err) {
      if (err instanceof AlreadyExists) {
        throw new BadRequest("User with this email already exists");
      }
      throw err;
    }
  }

  async getCurrentUser(c: Context) {
    const token = getCookie(c, "session");
    const user = await authService.getCurrentUser(token);
    return c.json(user);
  }

  logout(c: Context) {
    deleteCookie(c, "session");
    return c.json(null);
  }
}
