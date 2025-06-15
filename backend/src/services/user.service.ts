import { UserModel } from "@/src/models/user.model.js";
import { User } from "@shared/types/user.type.js";
import NotFound from "@/errors/NotFound.js";

export async function getUserById(id: string): Promise<User> {
  const user = await UserModel.findById(id);
  if (!user) throw new NotFound("User not found");
  return user.toJSON();
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const user = await UserModel.findById(userId);
  if (!user) throw new NotFound("User not found");
  await UserModel.findByIdAndDelete(userId);
}
