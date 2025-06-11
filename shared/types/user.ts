import { ObjectId } from 'mongodb';

export interface IUser {
    _id?: ObjectId;
    email: string;
    password: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export enum UserRole {
    ADMIN = 'admin',
    EDITOR = 'editor',
    VIEWER = 'viewer'
}

export const UserSchema = {
    email: { type: 'string', required: true, unique: true },
    password: { type: 'string', required: true },
    name: { type: 'string', required: true },
    role: { type: 'string', enum: Object.values(UserRole), default: UserRole.VIEWER },
    isActive: { type: 'boolean', default: true },
    createdAt: { type: 'date', default: Date.now },
    updatedAt: { type: 'date', default: Date.now }
}; 