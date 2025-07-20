import { createToken, verifyToken } from "@/lib/jwt.js";
import { UserModel } from "@/src/models/user.model.js";
import AlreadyExists from "@/errors/AlreadyExists.js";
import Unauthorized from "@/errors/Unauthorized.js";
import InvalidToken from "@/errors/InvalidToken.js";
import { Roles } from "@shared/constants/role.type.js";
import { getUserById } from "@/src/services/user.service.js";
import { isValidObjectId } from "mongoose";
import { USER_DATA_CACHE_TTL } from "@/constants/env.js";
const userCache = new Map();
const CACHE_TTL = USER_DATA_CACHE_TTL;
export async function login(email, password) {
    const user = await UserModel.findOne({ email: String(email) }).select("+password");
    if (!user || !password || !await user.comparePassword(password)) {
        throw new Unauthorized();
    }
    const payload = {
        email: user.email,
        _id: user._id.toString(),
    };
    const userObj = user.toJSON();
    delete userObj.password;
    const token = await createToken(payload);
    return { token, user: userObj };
}
export async function register(r) {
    const existingUser = await UserModel.findOne({ email: r.email });
    if (existingUser) {
        throw new AlreadyExists("User with this email already exists");
    }
    const allowedFields = {
        name: r.name,
        email: r.email,
        password: r.password,
        permissions: r.permissions,
    };
    const newUser = new UserModel(allowedFields);
    const res = await newUser.save();
    return res.toJSON();
}
export async function hasUsers() {
    const userCount = await UserModel.countDocuments();
    return userCount > 0;
}
export async function setupSuperAdmin(r) {
    // First check if any users exist
    const hasAnyUsers = await hasUsers();
    if (hasAnyUsers) {
        throw new AlreadyExists("System has already been set up");
    }
    // Create the superadmin user
    const superAdminPayload = {
        name: r.name,
        email: r.email,
        password: r.password,
        permissions: Roles.SUPER_ADMIN,
    };
    const newUser = new UserModel(superAdminPayload);
    const res = await newUser.save();
    return res.toJSON();
}
export async function getCurrentUser(token) {
    if (!token)
        throw new InvalidToken();
    const cacheKey = token;
    const cached = userCache.get(cacheKey);
    if (cached && cached.expiry > Date.now())
        return cached.user;
    const res = await verifyToken(token);
    if (!isValidObjectId(res._id))
        throw new InvalidToken();
    const user = await getUserById(String(res._id));
    // Cache the result
    userCache.set(cacheKey, {
        user,
        expiry: Date.now() + CACHE_TTL,
    });
    return user;
}
/**
 * Invalidate cached user data for a specific user ID
 * Should be called whenever user data is updated
 */
export function invalidateUserCache(userId) {
    for (const [token, cached] of userCache.entries()) {
        if (cached.user && cached.user._id === userId) {
            userCache.delete(token);
        }
    }
}
