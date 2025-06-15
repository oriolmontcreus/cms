import { IUser } from './user.type';

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