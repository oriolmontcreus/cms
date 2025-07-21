import { api } from "@/lib/utils/api";
import { loggedUser } from "@/stores/loggedUser";
import type { User, UserRegisterPayload, UserUpdatePayload } from "@shared/types/user.type";

const root = "/user";

export async function getAllUsers(): Promise<User[]> {
    const { data } = await api.get(root);
    return data;
}

export async function getUserById(id: string): Promise<User> {
    const { data } = await api.get(`${root}/${id}`);
    return data;
}

export async function createUser(userData: UserRegisterPayload): Promise<User> {
    const { data } = await api.post(root, userData);
    return data;
}

export async function updateUser(id: string, userData: UserUpdatePayload): Promise<User> {
    const { data } = await api.put(`${root}/${id}`, userData);
    return data;
}

export async function deleteUser(id: string): Promise<{ success: boolean }> {
    const { data } = await api.delete(`${root}/${id}`);
    return data;
}

export async function deleteUserAccount(): Promise<boolean> {
    const { data } = await api.delete(root);
    loggedUser.set(null);
    return data;
}
