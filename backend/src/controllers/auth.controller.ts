import { Context } from "hono";
import * as authService from "@/src/services/auth.service.js";
import BadRequest from "@/errors/BadRequest.js";
import AlreadyExists from "@/errors/AlreadyExists.js";
import { User } from "@shared/types/user.type.js";
import {
  setCookie,
  deleteCookie,
} from 'hono/cookie'
import { SESSION_COOKIE, ENV, Environment } from "@/constants/env.js";

export class AuthController {

  async login(c: Context) {

    const { email, password } = await c.req.json();
    if (!email || !password) {
      throw new BadRequest("Email and password are required");
    }
    const { token, user } = await authService.login(email, password);

    const cookieOptions = {
      httpOnly: true,
      secure: ENV === Environment.PRODUCTION,
      path: "/",
      sameSite: "Lax" as const,
      maxAge: 24 * 60 * 60, // 24 hours in seconds
    };
    setCookie(c, SESSION_COOKIE, token, cookieOptions);
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

  async checkSetupStatus(c: Context) {
    const hasUsers = await authService.hasUsers();
    return c.json({ needsSetup: !hasUsers });
  }

  async setupSuperAdmin(c: Context) {
    const payload = await c.req.json();
    try {
      const { token, user } = await authService.setupSuperAdmin(payload);

      // Set session cookie for automatic login
      const cookieOptions = {
        httpOnly: true,
        secure: ENV === Environment.PRODUCTION,
        path: "/",
        sameSite: "Lax" as const,
        maxAge: 24 * 60 * 60, // 24 hours in seconds
      };
      setCookie(c, SESSION_COOKIE, token, cookieOptions);

      return c.json(user);
    } catch (err) {
      if (err instanceof AlreadyExists) {
        throw new BadRequest("System has already been set up");
      }
      throw err;
    }
  }

  async getCurrentUser(c: Context) {
    const user = c.get("user");
    return c.json(user);
  }

  logout(c: Context) {
    deleteCookie(c, SESSION_COOKIE);
    return c.json(null);
  }
}
