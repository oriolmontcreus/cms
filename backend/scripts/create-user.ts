import enquirer from 'enquirer';
import { UserModel } from '../src/models/user.model.js';
import { UserRegisterPayload } from '@shared/types/user.type.js';
import { Roles } from '../../../shared/constants/role.type.js';
import mongoose from 'mongoose';

// Mongoose connection configuration (matching your main app config)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/froggy';

interface UserCreationData {
    name: string;
    email: string;
    password: string;
    role: 'client' | 'developer' | 'super_admin';
    isInitialized: boolean;
}

function getRolePermissions(role: string): number {
    switch (role) {
        case 'client':
            return Roles.CLIENT;
        case 'developer':
            return Roles.DEVELOPER;
        case 'super_admin':
            return Roles.SUPER_ADMIN;
        default:
            return Roles.CLIENT;
    }
}

function getRoleDisplayName(role: string): string {
    switch (role) {
        case 'client':
            return 'Client';
        case 'developer':
            return 'Developer';
        case 'super_admin':
            return 'Super Admin';
        default:
            return 'Client';
    }
}

async function connectToDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

async function createUser() {
    await connectToDatabase();

    try {
        // Get user information through enquirer prompts
        const response = await enquirer.prompt<UserCreationData>([
            {
                type: 'input',
                name: 'name',
                message: 'What is the user\'s full name?',
                validate: (value: string) => {
                    if (!value.trim()) return 'Name is required';
                    return true;
                }
            },
            {
                type: 'input',
                name: 'email',
                message: 'What is the user\'s email address?',
                validate: (value: string) => {
                    if (!value.trim()) return 'Email is required';
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        return 'Please enter a valid email address';
                    }
                    return true;
                }
            },
            {
                type: 'password',
                name: 'password',
                message: 'Enter a password for the user:',
                validate: (value: string) => {
                    if (!value) return 'Password is required';
                    if (value.length < 6) return 'Password must be at least 6 characters long';
                    return true;
                }
            },
            {
                type: 'select',
                name: 'role',
                message: 'What role should this user have?',
                choices: [
                    {
                        name: 'client',
                        message: getRoleDisplayName('client'),
                        value: 'client'
                    },
                    {
                        name: 'developer',
                        message: getRoleDisplayName('developer'),
                        value: 'developer'
                    },
                    {
                        name: 'super_admin',
                        message: getRoleDisplayName('super_admin'),
                        value: 'super_admin'
                    }
                ]
            },
            {
                type: 'confirm',
                name: 'isInitialized',
                message: 'Should this user be fully initialized (ready to use)?',
                initial: true
            }
        ]);

        // Check if user already exists
        const existingUser = await UserModel.findOne({ email: response.email });
        if (existingUser) {
            console.log('❌ A user with this email already exists!');
            process.exit(1);
        }

        // Prepare user data
        const userData: UserRegisterPayload & { isInitialized: boolean } = {
            name: response.name,
            email: response.email,
            password: response.password,
            permissions: getRolePermissions(response.role),
            isInitialized: response.isInitialized
        };

        // Create the user
        const newUser = new UserModel(userData);
        const savedUser = await newUser.save();

        console.log('✅ User created successfully!');
        console.log(`📧 Email: ${savedUser.email}`);
        console.log(`👤 Name: ${savedUser.name}`);
        console.log(`🔐 Role: ${getRoleDisplayName(response.role)}`);
        console.log(`✨ Initialized: ${savedUser.isInitialized ? 'Yes' : 'No'}`);
        console.log(`🆔 User ID: ${savedUser._id}`);

        if (!savedUser.isInitialized) {
            console.log('💡 This user will need to complete setup before they can log in.');
        }

    } catch (error) {
        if (error instanceof Error && error.message === 'canceled') {
            console.log('❌ User creation cancelled');
        } else {
            console.error('❌ Error creating user:', error);
        }
    } finally {
        await mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');
    }
}

// Handle command line execution
createUser().catch(error => {
    if (error instanceof Error && error.message === 'canceled') {
        console.log('❌ User creation cancelled');
        return;
    }
    console.error('❌ Error creating user:', error);
});

export { createUser };
