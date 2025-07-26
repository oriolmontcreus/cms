import { api } from "@/lib/utils/api";
import { loggedUser } from "@/stores/loggedUser";
import type { User, UserRegisterPayload, UserUpdatePayload, UserCreatePayload, UserSetupPayload } from "@shared/types/user.type";
import { fetchWithToast, safeFetch } from "@/lib/utils/safeFetch";
import { errorToast } from "./toast.service";

const root = "/user";

//region Routes
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

export async function createUserWithoutPassword(userData: UserCreatePayload): Promise<{ user: User; setupToken: string; setupUrl: string }> {
    const { data } = await api.post(`${root}/create-uninitialized`, userData);
    return data;
}

export async function setupUserAccount(token: string, setupData: UserSetupPayload): Promise<User> {
    const { data } = await api.post(`${root}/setup/${token}`, setupData);
    return data;
}

export async function regenerateSetupToken(userId: string): Promise<{ setupToken: string; setupUrl: string }> {
    const { data } = await api.post(`${root}/${userId}/regenerate-setup-token`);
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
//endregion

//region Handlers
export async function handleGetAllUsers(): Promise<User[] | null> {
    const [data, err] = await safeFetch(getAllUsers());
    if (err || !data) errorToast("Failed to load users. Please try again.");
    return data || null;
}

export async function handleGetUserById(id: string): Promise<User | null> {
    const [data, err] = await fetchWithToast(getUserById(id), {
        loading: 'Loading user...',
        success: () => 'User loaded successfully.',
        error: 'Failed to load user. Please try again.'
    });
    return data || null;
}

export async function handleCreateUser(userData: UserRegisterPayload): Promise<User | null> {
    const [data, err] = await fetchWithToast(createUser(userData), {
        loading: 'Creating user...',
        success: () => `User "${userData.name}" created successfully.`,
        error: 'Failed to create user. Please check the information and try again.'
    });
    return data || null;
}

export async function handleCreateUserWithoutPassword(userData: UserCreatePayload): Promise<{ user: User; setupToken: string; setupUrl: string } | null> {
    const [data, err] = await fetchWithToast(createUserWithoutPassword(userData), {
        loading: 'Creating user...',
        success: () => `User "${userData.name}" created successfully. Setup link generated.`,
        error: 'Failed to create user. Please check the information and try again.'
    });
    return data || null;
}

export async function handleSetupUserAccount(token: string, setupData: UserSetupPayload): Promise<User | null> {
    const [data, err] = await fetchWithToast(setupUserAccount(token, setupData), {
        loading: 'Setting up your account...',
        success: () => 'Account setup completed successfully!',
        error: 'Failed to setup account. Please check your information and try again.'
    });
    return data || null;
}

export async function handleRegenerateSetupToken(userId: string, userName?: string): Promise<{ setupToken: string; setupUrl: string } | null> {
    const [data, err] = await fetchWithToast(regenerateSetupToken(userId), {
        loading: 'Regenerating setup link...',
        success: () => `Setup link regenerated for ${userName ? `"${userName}"` : 'user'}`,
        error: 'Failed to regenerate setup link. Please try again.'
    });
    return data || null;
}

export async function handleUpdateUser(id: string, userData: UserUpdatePayload): Promise<User | null> {
    const [data, err] = await fetchWithToast(updateUser(id, userData), {
        loading: 'Updating user...',
        success: () => `User "${userData.name || 'user'}" updated successfully.`,
        error: 'Failed to update user. Please check the information and try again.'
    });
    return data || null;
}

export async function handleDeleteUser(id: string, userName?: string): Promise<boolean> {
    const [data, err] = await fetchWithToast(deleteUser(id), {
        loading: 'Deleting user...',
        success: () => `User ${userName ? `"${userName}"` : ''} deleted successfully.`,
        error: 'Failed to delete user. Please try again.'
    });
    return !!data && !err;
}

export async function handleDeleteUserAccount(): Promise<boolean> {
    const [data, err] = await fetchWithToast(deleteUserAccount(), {
        loading: 'Deleting your account...',
        success: () => 'Your account has been deleted successfully.',
        error: 'Failed to delete your account. Please try again.'
    });
    return !!data && !err;
}
//endregion
