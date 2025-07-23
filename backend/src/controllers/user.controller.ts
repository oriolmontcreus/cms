import { Context } from "hono";
import * as userService from "@/src/services/user.service.js";
import * as authService from "@/src/services/auth.service.js";
import { User, UserRegisterPayload, UserUpdatePayload, UserCreatePayload, UserSetupPayload } from "@shared/types/user.type.js";
import { getCookie, deleteCookie } from "hono/cookie";
import { SESSION_COOKIE } from "@/constants/env.js";
import BadRequest from "@/errors/BadRequest.js";

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

    const user = await userService.createUser(userData);
    return c.json(user);
  }

  async createUserWithoutPassword(c: Context) {
    const userData: UserCreatePayload = await c.req.json();

    if (!userData.email || !userData.name) {
      throw new BadRequest("Email and name are required");
    }

    const result = await userService.createUserWithoutPassword(userData);
    return c.json(result);
  }

  async setupUserAccount(c: Context) {
    const token = c.req.param('token');
    if (!token) throw new BadRequest("Setup token is required");

    const setupData: UserSetupPayload = await c.req.json();
    if (!setupData.password) {
      throw new BadRequest("Password is required");
    }

    const user = await userService.setupUserAccount(token, setupData);
    return c.json(user);
  }

  async regenerateSetupToken(c: Context) {
    const userId = c.req.param('id');
    if (!userId) throw new BadRequest("User ID is required");

    const result = await userService.regenerateSetupToken(userId);
    return c.json(result);
  }

  async updateUser(c: Context) {
    const userId = c.req.param('id');
    if (!userId) throw new BadRequest("User ID is required");
    const updateData: UserUpdatePayload = await c.req.json();

    const user = await userService.updateUser(userId, updateData);
    return c.json(user);
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

    deleteCookie(c, SESSION_COOKIE);
    return c.json(true);
  }
}
