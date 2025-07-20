import { UserModel } from "@/src/models/user.model.js";
import NotFound from "@/errors/NotFound.js";
import { invalidateUserCache } from "@/src/services/auth.service.js";
export async function getUserById(id) {
    const user = await UserModel.findById(id);
    if (!user)
        throw new NotFound("User not found");
    return user.toJSON();
}
export async function updateUser(userId, updateData) {
    //TODO: Implement
    const user = await UserModel.findById(userId);
    if (!user)
        throw new NotFound("User not found");
    // Update the user
    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });
    if (!updatedUser)
        throw new NotFound("User not found");
    // Invalidate cache for this user
    invalidateUserCache(userId);
    return updatedUser.toJSON();
}
export async function deleteUserAccount(userId) {
    const user = await UserModel.findById(userId);
    if (!user)
        throw new NotFound("User not found");
    await UserModel.findByIdAndDelete(userId);
    // Invalidate cache for this user
    invalidateUserCache(userId);
}
