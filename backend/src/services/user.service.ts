import { UserModel } from "@/src/models/user.model.js";
import { User, UserRegisterPayload, UserUpdatePayload, UserCreatePayload, UserSetupPayload } from "@shared/types/user.type.js";
import NotFound from "@/errors/NotFound.js";
import AlreadyExists from "@/errors/AlreadyExists.js";
import BadRequest from "@/errors/BadRequest.js";
import { invalidateUserCache } from "@/src/services/auth.service.js";
import * as crypto from "crypto";

export async function getUserById(id: string): Promise<User> {
  const user = await UserModel.findById(id);
  if (!user) throw new NotFound("User not found");
  return user.toJSON();
}

export async function getAllUsers(): Promise<User[]> {
  const users = await UserModel.find({})
    .sort({ createdAt: -1 })
    .lean();

  return users.map(user => ({
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    permissions: user.permissions,
    isInitialized: user.isInitialized,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }));
}

export async function createUser(userData: UserRegisterPayload): Promise<User> {
  const existingUser = await UserModel.findOne({ email: userData.email });

  if (existingUser) {
    throw new AlreadyExists("User with this email already exists");
  }

  const allowedFields: UserRegisterPayload = {
    name: userData.name,
    email: userData.email,
    password: userData.password,
    permissions: userData.permissions
  };

  const newUser = new UserModel({
    ...allowedFields,
    isInitialized: true
  });
  const savedUser = await newUser.save();
  return savedUser.toJSON();
}

export async function createUserWithoutPassword(userData: UserCreatePayload): Promise<{ user: User; setupToken: string; setupUrl: string }> {
  const existingUser = await UserModel.findOne({ email: userData.email });

  if (existingUser) throw new AlreadyExists("User with this email already exists");

  const newUser = new UserModel({
    name: userData.name,
    email: userData.email,
    permissions: userData.permissions,
    isInitialized: false
  });

  const setupToken = newUser.generateSetupToken();
  await newUser.save();

  const setupUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/setup-user/${setupToken}`;

  return {
    user: newUser.toJSON(),
    setupToken,
    setupUrl
  };
}

export async function setupUserAccount(token: string, setupData: UserSetupPayload): Promise<User> {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await UserModel.findOne({
    setupToken: hashedToken,
    setupTokenExpires: { $gt: new Date() }
  }).select('+setupToken +setupTokenExpires +password');

  if (!user) {
    throw new BadRequest("Invalid or expired setup token");
  }

  if (user.isInitialized) {
    throw new BadRequest("User account is already initialized");
  }

  // Update user with password and mark as initialized
  (user as any).password = setupData.password;
  if (setupData.name) {
    user.name = setupData.name;
  }
  user.isInitialized = true;
  (user as any).setupToken = undefined;
  (user as any).setupTokenExpires = undefined;

  await user.save();
  return user.toJSON();
}

export async function regenerateSetupToken(userId: string): Promise<{ setupToken: string; setupUrl: string }> {
  const user = await UserModel.findById(userId);
  if (!user) throw new NotFound("User not found");

  if (user.isInitialized) {
    throw new BadRequest("Cannot regenerate setup token for initialized user");
  }

  const setupToken = user.generateSetupToken();
  await user.save();

  const setupUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/setup-user/${setupToken}`;

  return { setupToken, setupUrl };
}

export async function updateUser(userId: string, updateData: UserUpdatePayload): Promise<User> {
  const user = await UserModel.findById(userId);
  if (!user) throw new NotFound("User not found");

  // Check if email is being updated and if it conflicts with existing user
  if (updateData.email && updateData.email !== user.email) {
    const existingUser = await UserModel.findOne({ email: updateData.email });
    if (existingUser) {
      throw new AlreadyExists("User with this email already exists");
    }
  }

  // Update the user
  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!updatedUser) throw new NotFound("User not found");

  // Invalidate cache for this user
  invalidateUserCache(userId);

  return updatedUser.toJSON();
}

export async function deleteUser(userId: string): Promise<void> {
  const user = await UserModel.findById(userId);
  if (!user) throw new NotFound("User not found");

  await UserModel.findByIdAndDelete(userId);

  // Invalidate cache for this user
  invalidateUserCache(userId);
}

export async function deleteUserAccount(userId: string): Promise<void> {
  // Alias for backward compatibility
  return deleteUser(userId);
}
