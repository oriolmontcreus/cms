import enquirer from 'enquirer';
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import Table from 'cli-table3';
import { UserModel } from '../src/models/user.model.js';
import { UserRegisterPayload } from '@shared/types/user.type.js';
import { Roles } from '@shared/constants/role.type.js';
import mongoose from 'mongoose';

// Mongoose connection configuration (matching your main app config)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/froggy';

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

function printHeader() {
    const title = chalk.bold.cyan('🚀 USER CREATION WIZARD');
    console.log('\n' + boxen(title, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        backgroundColor: 'black'
    }));
}

async function connectToDatabase() {
    const spinner = ora('Connecting to MongoDB...').start();
    try {
        await mongoose.connect(MONGODB_URI);
        spinner.succeed(chalk.green('Connected to MongoDB successfully'));
    } catch (error) {
        spinner.fail(chalk.red('Failed to connect to MongoDB'));
        console.error(chalk.red('❌ Error:'), error);
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
            console.log('\n' + boxen(
                chalk.red('❌ User Already Exists') + '\n\n' +
                chalk.yellow(`User: ${existingUser.name} (${existingUser.email})`),
                {
                    padding: 1,
                    borderStyle: 'round',
                    borderColor: 'red'
                }
            ));
            process.exit(1);
        }

        // Show confirmation with beautiful table
        console.log('\n' + chalk.cyan.bold('📋 User Creation Summary'));

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
            console.log('\n' + boxen(
                chalk.yellow('⏹️  User creation cancelled'),
                {
                    padding: 1,
                    borderStyle: 'round',
                    borderColor: 'yellow'
                }
            ));
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

        // Create the user with spinner
        const createSpinner = ora('Creating user...').start();
        const newUser = new UserModel(userData);
        const savedUser = await newUser.save();
        createSpinner.succeed(chalk.green('User created successfully!'));

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

        console.log('\n' + boxen(
            chalk.green.bold('� User Created Successfully!') + '\n\n' + userDetailsTable.toString(),
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'green'
            }
        ));

        if (!savedUser.isInitialized) {
            console.log('\n' + boxen(
                chalk.yellow('💡 This user will need to complete setup before they can log in.'),
                {
                    padding: 1,
                    borderStyle: 'round',
                    borderColor: 'yellow'
                }
            ));
        }

    } catch (error) {
        if (error instanceof Error && error.message === 'canceled') {
            console.log('\n' + boxen(
                chalk.yellow('⏹️  User creation cancelled by user'),
                {
                    padding: 1,
                    borderStyle: 'round',
                    borderColor: 'yellow'
                }
            ));
        } else {
            console.log('\n' + boxen(
                chalk.red('💥 Error creating user') + '\n\n' + chalk.red(String(error)),
                {
                    padding: 1,
                    borderStyle: 'round',
                    borderColor: 'red'
                }
            ));
        }
    } finally {
        await mongoose.disconnect();
    }
}

// Handle command line execution with enhanced error handling
createUser().catch(error => {
    if (error instanceof Error && error.message === 'canceled') {
        console.log('\n' + boxen(
            chalk.yellow('⏹️  User creation cancelled'),
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'yellow'
            }
        ));
        return;
    }
    console.log('\n' + boxen(
        chalk.red('💥 Unexpected error') + '\n\n' + chalk.red(String(error)),
        {
            padding: 1,
            borderStyle: 'round',
            borderColor: 'red'
        }
    ));
    process.exit(1);
});

export { createUser };
