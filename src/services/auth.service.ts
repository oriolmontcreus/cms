import { loggedUser } from "@/stores/loggedUser";
import { api } from "@/lib/utils/api";
import type { User } from "@shared/types/user.type";
import { fetchWithToast } from "@/lib/utils/safeFetch";
import { goto } from "$app/navigation";

const root = "/auth";

//region routes
export async function login(email: string, password: string): Promise<void> {
    const { data } = await api.post<User>(`${root}/login`, { email, password });
    loggedUser.set(data);
}

export async function logout(): Promise<void> {
    await api.post(`${root}/logout`);
    loggedUser.set(null);
}
//endregion

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

//region handlers
export async function handleLogin(email: string, password: string, redirect: boolean = false): Promise<void> {
    const [ok, err] = await fetchWithToast(login(email, password), {
        loading: 'Logging in...',
        success: () => `Logged in successfully.`,
        error: 'Error logging in. Please try again.'
    });
    if (!err) if (redirect) goto('/');
}
//endregion