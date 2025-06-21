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

const userCache = new Map();
const CACHE_TTL = USER_DATA_CACHE_TTL;

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: User }> {
  const user = await UserModel.findOne({ email: String(email) }).select(
    "+password",
  );

  if (!user || !password || !await user.comparePassword(password)) {
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
  };

  const newUser = new UserModel(allowedFields);
  const res = await newUser.save();
  return res.toJSON();
}

export async function getCurrentUser(token: string | undefined): Promise<User> {
  if (!token) throw new InvalidToken();

  // Check cache first
  const cacheKey = token;
  const cached = userCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.user;
  }

  try {
    const res: JWTPayload = await verifyToken(token);
    if (!isValidObjectId(res._id)) throw new InvalidToken();
    
    const user = await getUserById(String(res._id));

    // Cache the result
    userCache.set(cacheKey, {
      user,
      expiry: Date.now() + CACHE_TTL,
    });

    return user;
  } catch (error) {
    throw new InvalidToken();
  }
}
