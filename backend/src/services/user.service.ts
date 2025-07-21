import { UserModel } from "@/src/models/user.model.js";
import { User, UserRegisterPayload, UserUpdatePayload } from "@shared/types/user.type.js";
import NotFound from "@/errors/NotFound.js";
import AlreadyExists from "@/errors/AlreadyExists.js";
import { invalidateUserCache } from "@/src/services/auth.service.js";

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

  const newUser = new UserModel(allowedFields);
  const savedUser = await newUser.save();
  return savedUser.toJSON();
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
