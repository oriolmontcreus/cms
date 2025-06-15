import { Collection, Db, ObjectId } from 'mongodb';
import * as bcrypt from 'bcrypt';
import { IUser, UserRole } from '@shared/types/user.js';

export interface IUserWithPassword extends IUser {
    password: string;
}

export interface IUserMethods {
    comparePassword(password: string): Promise<boolean>;
}

export class UserModel {
    private collection: Collection<IUserWithPassword>;

    constructor(db: Db) {
        this.collection = db.collection<IUserWithPassword>('users');
        this.initializeIndexes();
    }

    private async initializeIndexes() {
        await this.collection.createIndex({ email: 1 }, { unique: true });
    }

    async create(userData: Omit<IUserWithPassword, '_id'>): Promise<IUserWithPassword> {
        const salt = await bcrypt.genSalt(8);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        const user: IUserWithPassword = {
            ...userData,
            _id: new ObjectId(),
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await this.collection.insertOne(user);
        return user;
    }

    async findByEmail(email: string): Promise<IUserWithPassword | null> {
        return this.collection.findOne({ email });
    }

    async findById(id: string): Promise<IUserWithPassword | null> {
        return this.collection.findOne({ _id: new ObjectId(id) });
    }

    async update(id: string, updateData: Partial<IUserWithPassword>): Promise<boolean> {
        const update: any = { ...updateData, updatedAt: new Date() };

        if (updateData.password) {
            const salt = await bcrypt.genSalt(8);
            update.password = await bcrypt.hash(updateData.password, salt);
        }

        const result = await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: update }
        );

        return result.modifiedCount > 0;
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount > 0;
    }

    async comparePassword(user: IUserWithPassword, password: string): Promise<boolean> {
        return bcrypt.compare(password, user.password);
    }

    async list(limit = 10, skip = 0): Promise<IUserWithPassword[]> {
        return this.collection
            .find()
            .skip(skip)
            .limit(limit)
            .toArray();
    }
} 