import { Context } from "hono";
import * as authService from "@/src/services/auth.service.js";
import BadRequest from "@/errors/BadRequest.js";
import { User } from "@shared/types/user.type.js";
import {
  setCookie,
  deleteCookie,
} from 'hono/cookie'
import { SESSION_COOKIE, ENV, Environment } from "@/constants/env.js";

export class AuthController {

  private getSessionCookieOptions() {
    return {
      httpOnly: true,
      secure: ENV === Environment.PRODUCTION,
      path: "/",
      sameSite: "Lax" as const,
      maxAge: 24 * 60 * 60, // 24 hours in seconds
    };
  }

  private setSessionCookie(c: Context, token: string) {
    setCookie(c, SESSION_COOKIE, token, this.getSessionCookieOptions());
  }

  async login(c: Context) {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      throw new BadRequest("Email and password are required");
    }
    const { token, user } = await authService.login(email, password);

    this.setSessionCookie(c, token);
    return c.json(user);
  }

  async register(c: Context) {
    const payload = await c.req.json();
    const res: User = await authService.register(payload);
    return c.json(res);
  }

  async checkSetupStatus(c: Context) {
    const hasUsers = await authService.hasUsers();
    return c.json({ needsSetup: !hasUsers });
  }

  async setupSuperAdmin(c: Context) {
    const payload = await c.req.json();
    const { token, user } = await authService.setupSuperAdmin(payload);

    this.setSessionCookie(c, token);
    return c.json(user);
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
