import { createToken, verifyToken } from "@/lib/jwt.js";
import { UserModel, UserWithPassword } from "@/src/models/user.model.js";
import AlreadyExists from "@/errors/AlreadyExists.js";
import Unauthorized from "@/errors/Unauthorized.js";
import InvalidToken from "@/errors/InvalidToken.js";
import { User, UserRegisterPayload } from "@shared/types/user.type.js";
import { DecodedSession } from "@/src/types/session.js";
import { getUserById } from "@/src/services/user.service.js";
import { isValidObjectId } from "mongoose";
import { JWTPayload } from "jose";
import { USER_DATA_CACHE_TTL } from "@/constants/env.js";
import { Roles } from "@shared/constants/role.type.js";

const userCache = new Map();
const CACHE_TTL = USER_DATA_CACHE_TTL;

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: User }> {
  const user = await UserModel.findOne({ email: String(email) }).select(
    "+password",
  );

  if (!user) throw new Unauthorized();

  if (!user.isInitialized) {
    throw new Unauthorized("Account not initialized. Please complete setup first.");
  }

  if (!password || !await user.comparePassword(password)) {
    throw new Unauthorized();
  }

  const payload: DecodedSession = {
    email: user.email,
    _id: user._id.toString(),
  };

  const userObj = user.toJSON() as unknown as UserWithPassword;
  delete (userObj as Partial<UserWithPassword>).password;
  const token = await createToken(payload);
  return { token, user: userObj };
}

export async function register(r: UserRegisterPayload): Promise<User> {
  const existingUser = await UserModel.findOne({ email: r.email });

  if (existingUser) {
    throw new AlreadyExists("User with this email already exists");
  }

  const allowedFields: UserRegisterPayload = {
    name: r.name,
    email: r.email,
    password: r.password,
    permissions: r.permissions
  };

  const newUser = new UserModel(allowedFields);
  const res = await newUser.save();
  return res.toJSON();
}

export async function getCurrentUser(token: string | undefined): Promise<User> {
  if (!token) throw new InvalidToken();

  const cacheKey = token;
  const cached = userCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) return cached.user;

  const res: JWTPayload = await verifyToken(token);
  if (!isValidObjectId(res._id)) throw new InvalidToken();

  const user = await getUserById(String(res._id));

  // Cache the result
  userCache.set(cacheKey, {
    user,
    expiry: Date.now() + CACHE_TTL,
  });

  return user;
}

export async function hasUsers(): Promise<boolean> {
  const userCount = await UserModel.countDocuments();
  return userCount > 0;
}

export async function setupSuperAdmin(r: UserRegisterPayload): Promise<User> {
  const hasAnyUsers = await hasUsers();
  if (hasAnyUsers) {
    throw new AlreadyExists("System has already been set up");
  }

  // Create the superadmin user
  const superAdminPayload: UserRegisterPayload = {
    name: r.name,
    email: r.email,
    password: r.password,
    permissions: Roles.SUPER_ADMIN,
  };

  const newUser = new UserModel(superAdminPayload);
  const res = await newUser.save();
  return res.toJSON();
}

/**
 * Invalidate cached user data for a specific user ID
 * Should be called whenever user data is updated
 */
export function invalidateUserCache(userId: string): void {
  for (const [token, cached] of userCache.entries()) {
    if (cached.user && cached.user._id === userId) {
      userCache.delete(token);
    }
  }
}