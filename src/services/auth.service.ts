import { loggedUser } from "@/stores/loggedUser";
import { api } from "@/lib/utils/api";
import type { User } from "@shared/types/user.type";
import { fetchWithToast } from "@/lib/utils/safeFetch";
import { goto } from "$app/navigation";
import { get } from "svelte/store";

const root = "/auth";

//region Routes
export async function login(email: string, password: string): Promise<void> {
    const { data } = await api.post<User>(`${root}/login`, { email, password });
    loggedUser.set(data);
}

export async function logout(): Promise<void> {
    await api.post(`${root}/logout`);
    loggedUser.set(null);
}

export async function checkSetupStatus(): Promise<{ needsSetup: boolean }> {
    const { data } = await api.get<{ needsSetup: boolean }>(`${root}/setup/status`);
    return data;
}

export async function setupSuperAdmin(email: string, password: string, name: string): Promise<User> {
    const { data } = await api.post<User>(`${root}/setup/superadmin`, { email, password, name });
    return data;
}
//endregion

export async function autoLogin(): Promise<User | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    let setupStatus: { needsSetup: boolean } | null = null;

    try {
        setupStatus = await checkSetupStatus();
        if (setupStatus.needsSetup) {
            loggedUser.set(null);
            goto('/setup');
            return null;
        }

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
        if (get(loggedUser) === null) {
            const currentPath = window.location.pathname;
            if (currentPath !== '/setup' && !setupStatus!.needsSetup) goto('/login');
        }
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

export async function handleLogout(): Promise<void> {
    const [ok, err] = await fetchWithToast(logout(), {
        loading: 'Logging out...',
        success: () => `Logged out successfully.`,
        error: 'Error logging out. Please try again.'
    });
    if (!err) goto('/login');
}

export async function handleSetupSuperAdmin(email: string, password: string, name: string, redirect: boolean = false): Promise<void> {
    const [ok, err] = await fetchWithToast(setupSuperAdmin(email, password, name), {
        loading: 'Setting up your account...',
        success: () => `Welcome to Froggy CMS! Your account has been created successfully.`,
        error: 'Error setting up your account. Please try again.'
    });
    if (!err) {
        if (redirect) goto('/login');
    }
}
//endregion