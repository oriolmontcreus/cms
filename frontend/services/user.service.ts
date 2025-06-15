import type { PublicUser, User } from "@shared/types/user";
import { api } from "@/utils/api";
import { loggedUser } from "@/stores/loggedUser";

const root = "/user";

export async function deleteUserAccount(): Promise<boolean> {
    const { data } = await api.delete(root);
    loggedUser.set(null);
    return data;
}
