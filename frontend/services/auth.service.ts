import { loggedUser } from "@/stores/loggedUser";
import { api } from "@/utils/api";
import type { User, UserRegisterPayload } from "@shared/types/user";

const root = "/auth";

export async function login(email: string, password: string): Promise<void> {
    const { data } = await api.post<User>(`${root}/login`, { email, password });
    loggedUser.set(data);
}

export async function logout(): Promise<void> {
    await api.post(`${root}/logout`);
    loggedUser.set(null);
}

export async function autoLogin(): Promise<User | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const { data } = await api.get<User>(`${root}/me`, {
            signal: controller.signal,
            headers: { "Cache-Control": "no-cache" },
        });
        loggedUser.set(data);
        return data;
    } catch {
        loggedUser.set(null);
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}