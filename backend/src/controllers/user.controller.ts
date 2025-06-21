import { Context } from "hono";
import * as userService from "@/src/services/user.service.js";
import * as authService from "@/src/services/auth.service.js";
import { User } from "@shared/types/user.type.js";
import { getCookie } from "hono/cookie";
import { log } from "@/lib/log.js";
import { SESSION_COOKIE } from "@/constants/env.js";

export class UserController {
  async deleteUser(c: Context) {
    try {
      const user: User = await authService.getCurrentUser(
        getCookie(c, SESSION_COOKIE),
      );
      await userService.deleteUserAccount(user._id);

      c.header(
        "Set-Cookie",
        `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`,
      );

      return c.json(true);
    } catch (err) {
      log("ERROR", `Error in deleteUser controller: ${err}`);
      throw err;
    }
  }
}
