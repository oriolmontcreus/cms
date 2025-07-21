import { Context } from "hono";
import * as userService from "@/src/services/user.service.js";
import * as authService from "@/src/services/auth.service.js";
import { User, UserRegisterPayload, UserUpdatePayload } from "@shared/types/user.type.js";
import { getCookie } from "hono/cookie";
import { SESSION_COOKIE } from "@/constants/env.js";
import BadRequest from "@/errors/BadRequest.js";
import AlreadyExists from "@/errors/AlreadyExists.js";

export class UserController {
  async getAllUsers(c: Context) {
    const users = await userService.getAllUsers();
    return c.json(users);
  }

  async getUserById(c: Context) {
    const userId = c.req.param('id');
    if (!userId) throw new BadRequest("User ID is required");

    const user = await userService.getUserById(userId);
    return c.json(user);
  }

  async createUser(c: Context) {
    const userData: UserRegisterPayload = await c.req.json();

    if (!userData.email || !userData.password || !userData.name) {
      throw new BadRequest("Email, password, and name are required");
    }

    try {
      const user = await userService.createUser(userData);
      return c.json(user);
    } catch (err) {
      if (err instanceof AlreadyExists) {
        throw new BadRequest("User with this email already exists");
      }
      throw err;
    }
  }

  async updateUser(c: Context) {
    const userId = c.req.param('id');
    if (!userId) throw new BadRequest("User ID is required");
    const updateData: UserUpdatePayload = await c.req.json();

    try {
      const user = await userService.updateUser(userId, updateData);
      return c.json(user);
    } catch (err) {
      if (err instanceof AlreadyExists) {
        throw new BadRequest("User with this email already exists");
      }
      throw err;
    }
  }

  async deleteUserById(c: Context) {
    const userId = c.req.param('id');
    if (!userId) throw new BadRequest("User ID is required");

    // Prevent deletion of the requesting user
    const currentUser: User = c.get("user");
    if (currentUser._id === userId) {
      throw new BadRequest("Cannot delete your own account through this endpoint");
    }

    await userService.deleteUser(userId);
    return c.json({ success: true });
  }

  async deleteUser(c: Context) {
    const user: User = await authService.getCurrentUser(
      getCookie(c, SESSION_COOKIE),
    );
    await userService.deleteUserAccount(user._id);

    c.header(
      "Set-Cookie",
      `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`,
    );

    return c.json(true);
  }
}
