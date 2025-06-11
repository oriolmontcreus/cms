import { writable } from 'svelte/store';
import type { AuthState } from '../../../shared/types/auth';

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false
};

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>(initialState);

    return {
        subscribe,
        setUser: (user: AuthState['user']) => update(state => ({ ...state, user, isAuthenticated: !!user })),
        setToken: (token: string | null) => update(state => ({ ...state, token })),
        logout: () => set(initialState)
    };
}

export const authStore = createAuthStore(); 