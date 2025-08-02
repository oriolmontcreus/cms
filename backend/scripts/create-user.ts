import enquirer from 'enquirer';
import colors from 'colors';
import { UserModel } from '../src/models/user.model.js';
import { UserRegisterPayload } from '@shared/types/user.type.js';
import { Roles } from '@shared/constants/role.type.js';
import mongoose from 'mongoose';

// Mongoose connection configuration (matching your main app config)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/froggy';

// Role styling configuration matching frontend
const roleStyles = new Map([
    [Roles.SUPER_ADMIN, { color: 'magenta', label: 'Super Admin', description: 'Full system access and administration' }],
    [Roles.DEVELOPER, { color: 'blue', label: 'Developer', description: 'Content management and development tools' }],
    [Roles.CLIENT, { color: 'green', label: 'Client', description: 'Basic content viewing and interaction' }],
]);

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

function getRoleStyle(role: string) {
    const permissions = getRolePermissions(role);
    return roleStyles.get(permissions) || roleStyles.get(Roles.CLIENT)!;
}

function getRoleDisplayName(role: string): string {
    const style = getRoleStyle(role);
    switch (style.color) {
        case 'magenta':
            return colors.magenta(style.label);
        case 'blue':
            return colors.blue(style.label);
        case 'green':
            return colors.green(style.label);
        default:
            return colors.green(style.label);
    }
}

function printHeader() {
    console.log(colors.cyan('\n╔═══════════════════════════════════════╗'));
    console.log(colors.cyan('║') + colors.bold.white('           USER CREATION WIZARD        ') + colors.cyan('║'));
    console.log(colors.cyan('╚═══════════════════════════════════════╝\n'));
}

async function connectToDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
    } catch (error) {
        console.error(colors.red('❌ Error connecting to MongoDB:'), error);
        process.exit(1);
    }
}

async function createUser() {
    printHeader();
    await connectToDatabase();

    try {
        // Get user information through enhanced enquirer prompts
        const response = await enquirer.prompt<UserCreationData>([
            {
                type: 'input',
                name: 'name',
                message: colors.cyan('👤 What is the user\'s full name?'),
                validate: (value: string) => {
                    if (!value.trim()) return colors.red('❌ Name is required');
                    if (value.trim().length < 2) return colors.red('❌ Name must be at least 2 characters long');
                    return true;
                },
                result: (value: string) => value.trim()
            },
            {
                type: 'input',
                name: 'email',
                message: colors.cyan('📧 What is the user\'s email address?'),
                validate: (value: string) => {
                    if (!value.trim()) return colors.red('❌ Email is required');
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        return colors.red('❌ Please enter a valid email address');
                    }
                    return true;
                },
                result: (value: string) => value.trim().toLowerCase()
            },
            {
                type: 'password',
                name: 'password',
                message: colors.cyan('🔐 Enter a password for the user:'),
                validate: (value: string) => {
                    if (!value) return colors.red('❌ Password is required');
                    if (value.length < 6) return colors.red('❌ Password must be at least 6 characters long');
                    if (value.length > 128) return colors.red('❌ Password is too long (max 128 characters)');
                    return true;
                }
            },
            {
                type: 'select',
                name: 'role',
                message: colors.cyan('🎭 What role should this user have?'),
                choices: [
                    {
                        name: 'client',
                        message: `${getRoleDisplayName('client')} - ${getRoleStyle('client').description}`,
                        value: 'client'
                    },
                    {
                        name: 'developer',
                        message: `${getRoleDisplayName('developer')} - ${getRoleStyle('developer').description}`,
                        value: 'developer'
                    },
                    {
                        name: 'super_admin',
                        message: `${getRoleDisplayName('super_admin')} - ${getRoleStyle('super_admin').description}`,
                        value: 'super_admin'
                    }
                ]
            },
            {
                type: 'confirm',
                name: 'isInitialized',
                message: colors.cyan('✨ Should this user be fully initialized (ready to use)?'),
                initial: true
            }
        ]);

        // Check if user already exists with enhanced feedback
        const existingUser = await UserModel.findOne({ email: response.email });
        if (existingUser) {
            console.log(colors.red('\n❌ A user with this email already exists!'));
            console.log(colors.yellow(`   User: ${existingUser.name} (${existingUser.email})`));
            process.exit(1);
        }

        // Show confirmation before creating user
        console.log(colors.cyan('\n📋 User Creation Summary:'));
        console.log(colors.gray('─'.repeat(40)));
        console.log(colors.white(`   Name: ${colors.bold(response.name)}`));
        console.log(colors.white(`   Email: ${colors.bold(response.email)}`));
        console.log(colors.white(`   Role: ${getRoleDisplayName(response.role)}`));
        console.log(colors.white(`   Initialized: ${response.isInitialized ? colors.green('✓ Yes') : colors.yellow('⚠ No (requires setup)')}`));
        console.log(colors.gray('─'.repeat(40)));

        const confirmCreation = await enquirer.prompt<{ confirm: boolean }>({
            type: 'confirm',
            name: 'confirm',
            message: colors.cyan('🚀 Proceed with user creation?'),
            initial: true
        });

        if (!confirmCreation.confirm) {
            console.log(colors.yellow('\n⏹️  User creation cancelled'));
            return;
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

        // Ask if user wants to see the password
        const showPasswordPrompt = await enquirer.prompt<{ showPassword: boolean }>({
            type: 'confirm',
            name: 'showPassword',
            message: colors.cyan('👁️  Would you like to display the password in the summary?'),
            initial: false
        });

        // Success message with enhanced styling
        console.log(colors.green('\n🎉 User created successfully!'));
        console.log(colors.cyan('\n╔═══════════════════════════════════════╗'));
        console.log(colors.cyan('║') + colors.bold.white('           USER DETAILS                ') + colors.cyan('║'));
        console.log(colors.cyan('╠═══════════════════════════════════════╣'));
        console.log(colors.cyan('║') + colors.white(` 📧 Email: ${savedUser.email}`.padEnd(38)) + colors.cyan('║'));
        console.log(colors.cyan('║') + colors.white(` 👤 Name: ${savedUser.name}`.padEnd(38)) + colors.cyan('║'));
        if (showPasswordPrompt.showPassword) {
            console.log(colors.cyan('║') + colors.white(` 🔐 Password: ${response.password}`.padEnd(38)) + colors.cyan('║'));
        }
        console.log(colors.cyan('║') + ` 🎭 Role: ${getRoleDisplayName(response.role)}`.padEnd(47) + colors.cyan('║'));
        console.log(colors.cyan('║') + colors.white(` ✨ Initialized: ${savedUser.isInitialized ? colors.green('Yes') : colors.yellow('No')}`.padEnd(47)) + colors.cyan('║'));
        console.log(colors.cyan('║') + colors.white(` 🆔 User ID: ${savedUser._id}`.padEnd(38)) + colors.cyan('║'));
        console.log(colors.cyan('╚═══════════════════════════════════════╝'));

        if (!savedUser.isInitialized) {
            console.log(colors.yellow('\n💡 This user will need to complete setup before they can log in.'));
        } else {
            console.log(colors.green('\n✅ User is ready to log in immediately!'));
        }

    } catch (error) {
        if (error instanceof Error && error.message === 'canceled') {
            console.log(colors.yellow('\n⏹️  User creation cancelled by user'));
        } else {
            console.log(colors.red('\n💥 Error creating user:'));
            console.error(colors.red('   '), error);
        }
    } finally {
        await mongoose.disconnect();
        console.log(colors.cyan('\n👋 Thanks for using the User Creation Wizard!\n'));
    }
}

// Handle command line execution with enhanced error handling
createUser().catch(error => {
    if (error instanceof Error && error.message === 'canceled') {
        console.log(colors.yellow('\n⏹️  User creation cancelled'));
        return;
    }
    console.error(colors.red('\n💥 Unexpected error:'), error);
    process.exit(1);
});

export { createUser };
