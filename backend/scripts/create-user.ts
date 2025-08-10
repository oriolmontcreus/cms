import enquirer from 'enquirer';
import chalk from 'chalk';
import Table from 'cli-table3';
import { UserModel } from '../src/models/user.model.js';
import { UserRegisterPayload } from '@shared/types/user.type.js';
import { Roles } from '@shared/constants/role.type.js';
import mongoose from 'mongoose';
import { logStep, printHeader, printSuccessBox, printErrorBox, printWarningBox, printCancelledBox, handleScriptError } from './utils/terminal-ui.js';

// Mongoose connection configuration (matching your main app config)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/excalibur';

// Role styling configuration with chalk
const roleStyles = new Map([
    [Roles.SUPER_ADMIN, {
        color: chalk.magenta,
        label: 'Super Admin',
        description: 'Full system access and administration',
        emoji: '👑'
    }],
    [Roles.DEVELOPER, {
        color: chalk.blue,
        label: 'Developer',
        description: 'Content management and development tools',
        emoji: '⚡'
    }],
    [Roles.CLIENT, {
        color: chalk.green,
        label: 'Client',
        description: 'Basic content viewing and interaction',
        emoji: '👤'
    }],
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
    return style.color(style.label);
}

async function connectToDatabase() {
    logStep('Connecting to database...');
    try {
        await mongoose.connect(MONGODB_URI);
        logStep('Connected to database successfully', 'success');
    } catch (error) {
        logStep('Failed to connect to database', 'error');
        console.error(chalk.red('❌ Error:'), error);
        process.exit(1);
    }
}

async function createUser() {
    printHeader('USER CREATION WIZARD', 'cyan');
    await connectToDatabase();

    try {
        // Get user information through enhanced enquirer prompts
        const response = await enquirer.prompt<UserCreationData>([
            {
                type: 'input',
                name: 'name',
                message: chalk.cyan('👤 What is the user\'s full name?'),
                validate: (value: string) => {
                    if (!value.trim()) return chalk.red('❌ Name is required');
                    if (value.trim().length < 2) return chalk.red('❌ Name must be at least 2 characters long');
                    return true;
                },
                result: (value: string) => value.trim()
            },
            {
                type: 'input',
                name: 'email',
                message: chalk.cyan('📧 What is the user\'s email address?'),
                validate: (value: string) => {
                    if (!value.trim()) return chalk.red('❌ Email is required');
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        return chalk.red('❌ Please enter a valid email address');
                    }
                    return true;
                },
                result: (value: string) => value.trim().toLowerCase()
            },
            {
                type: 'password',
                name: 'password',
                message: chalk.cyan('🔐 Enter a password for the user:'),
                validate: (value: string) => {
                    if (!value) return chalk.red('❌ Password is required');
                    if (value.length < 6) return chalk.red('❌ Password must be at least 6 characters long');
                    if (value.length > 128) return chalk.red('❌ Password is too long (max 128 characters)');
                    return true;
                }
            },
            {
                type: 'select',
                name: 'role',
                message: chalk.cyan('🎭 What role should this user have?'),
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
                message: chalk.cyan('✨ Should this user be fully initialized (ready to use)?'),
                initial: true
            }
        ]);

        // Check if user already exists with enhanced feedback
        const existingUser = await UserModel.findOne({ email: response.email });
        if (existingUser) {
            printErrorBox(
                '❌ User already exists',
                `\nUser: ${existingUser.name} (${existingUser.email})`
            );
            process.exit(1);
        }

        // Show confirmation with beautiful table
        console.log('\n' + chalk.cyan.bold('📋 User creation summary'));

        const summaryTable = new Table({
            colWidths: [15, 50],
            style: {
                border: ['gray']
            }
        });

        summaryTable.push(
            [chalk.blue('Name'), chalk.bold(response.name)],
            [chalk.blue('Email'), chalk.bold(response.email)],
            [chalk.blue('Role'), getRoleDisplayName(response.role)],
            [chalk.blue('Initialized'), response.isInitialized ? chalk.green('✓ Yes') : chalk.yellow('⚠ No (requires setup)')]
        );

        console.log(summaryTable.toString());

        const confirmCreation = await enquirer.prompt<{ confirm: boolean }>({
            type: 'confirm',
            name: 'confirm',
            message: chalk.cyan('🚀 Proceed with user creation?'),
            initial: true
        });

        if (!confirmCreation.confirm) {
            printCancelledBox('User creation cancelled');
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

        // Create the user with progress indication
        logStep('Creating user...');
        const newUser = new UserModel(userData);
        const savedUser = await newUser.save();
        logStep('User created successfully!', 'success');

        // Ask if user wants to see the password
        const showPasswordPrompt = await enquirer.prompt<{ showPassword: boolean }>({
            type: 'confirm',
            name: 'showPassword',
            message: chalk.cyan('👁️  Would you like to display the password in the summary?'),
            initial: false
        });

        // Success message with beautiful table
        const userDetailsTable = new Table({
            colWidths: [15, 50],
            style: {
                border: ['gray']
            }
        });

        userDetailsTable.push(
            [chalk.blue('Email'), savedUser.email],
            [chalk.blue('Name'), savedUser.name],
            ...(showPasswordPrompt.showPassword ? [[chalk.blue('Password'), response.password]] : []),
            [chalk.blue('Role'), getRoleDisplayName(response.role)],
            [chalk.blue('Initialized'), savedUser.isInitialized ? chalk.green('Yes') : chalk.yellow('No')],
            [chalk.blue('User ID'), savedUser._id.toString()]
        );

        printSuccessBox(
            '✅ User created successfully!',
            userDetailsTable.toString()
        );

        if (!savedUser.isInitialized) {
            printWarningBox(
                '💡 Setup required',
                'This user will need to complete setup before they can log in.'
            );
        }

    } catch (error) {
        // Special handling for enquirer interruptions
        if (!error || error === '' ||
            (error instanceof Error && (!error.message || error.message.trim() === ''))) {
            printCancelledBox('User creation cancelled');
            return;
        }
        handleScriptError(error, 'User creation');
    } finally {
        await mongoose.disconnect();
    }
}

// Handle command line execution with enhanced error handling
createUser().catch(error => {
    handleScriptError(error, 'User creation');
});

// Handle process interruption gracefully
process.on('SIGINT', () => {
    printCancelledBox('User creation interrupted');
    process.exit(0);
});

process.on('SIGTERM', () => {
    printCancelledBox('User creation terminated');
    process.exit(0);
});

export { createUser };
