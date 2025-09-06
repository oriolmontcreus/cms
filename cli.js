#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for better output
const colors = {
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

const logo = `
${colors.blue}${colors.bold}
╔═══════════════════════════════════════╗
║                                       ║
║     EXCALIBUR CMS CLI TOOL            ║
║                                       ║
╚═══════════════════════════════════════╝
${colors.reset}
`;

const commands = {
    'create:page': {
        description: 'Create a new page',
        script: 'create-page'
    },
    'create:component': {
        description: 'Create a new component',
        script: 'create-component'
    },
    'create:user': {
        description: 'Create a new user',
        script: 'create-user'
    },
    'delete:component': {
        description: 'Delete a component',
        script: 'delete-component'
    },
    'dev': {
        description: 'Start development server (frontend + backend)',
        script: 'dev'
    },
    'build': {
        description: 'Build the application',
        script: 'build'
    },
    'preview': {
        description: 'Preview the built application',
        script: 'preview'
    },
    'check': {
        description: 'Run SvelteKit sync and type checking',
        script: 'check'
    },
    'check:watch': {
        description: 'Run type checking in watch mode',
        script: 'check:watch'
    }
};

function showHelp() {
    console.log(logo);
    console.log(`${colors.bold}Usage:${colors.reset}`);
    console.log(`  excalibur <command>\n`);

    console.log(`${colors.bold}Available Commands:${colors.reset}\n`);

    // Group commands by category
    const categories = {
        'Creation Commands': ['create:page', 'create:component', 'create:user'],
        'Deletion Commands': ['delete:component'],
        'Development Commands': ['dev'],
        'Build Commands': ['build', 'preview'],
        'Quality Commands': ['check', 'check:watch']
    };

    Object.entries(categories).forEach(([category, cmds]) => {
        console.log(`${colors.yellow}${colors.bold}${category}:${colors.reset}`);
        cmds.forEach(cmd => {
            if (commands[cmd]) {
                console.log(`  ${colors.green}excalibur ${cmd.padEnd(20)}${colors.reset} ${commands[cmd].description}`);
            }
        });
        console.log('');
    });
}

function runCommand(command) {
    const cmd = commands[command];

    if (!cmd) {
        console.log(`${colors.red}❌ Unknown command: ${command}${colors.reset}\n`);
        showHelp();
        process.exit(1);
    }

    console.log(`${colors.blue}⚔️  Excalibur CMS:${colors.reset} Running ${colors.bold}${command}${colors.reset}...\n`);

    // Run the npm script
    const npmProcess = spawn('npm', ['run', cmd.script], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
    });

    npmProcess.on('error', (error) => {
        console.error(`${colors.red}❌ Error executing command: ${error.message}${colors.reset}`);
        process.exit(1);
    });
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    process.exit(0);
}

// Handle version command
if (command === 'version' || command === '--version' || command === '-v') {
    const fs = await import('fs');
    const packageJson = JSON.parse(fs.readFileSync(join(__dirname, 'package.json'), 'utf8'));
    console.log(`${colors.blue}⚔️  Excalibur CMS v${packageJson.version}${colors.reset}`);
    process.exit(0);
} runCommand(command);
