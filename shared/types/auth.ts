import { IUser } from './user';

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: IUser;
    token: string;
}

export interface AuthState {
    user: IUser | null;
    token: string | null;
    isAuthenticated: boolean;
} 