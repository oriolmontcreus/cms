import chalk from 'chalk';
import boxen from 'boxen';

// Progress indication utilities for VS Code terminal compatibility
export function logStep(message: string, type: 'start' | 'success' | 'error' | 'info' = 'start') {
    const icons = {
        start: chalk.blue('◐'),
        success: chalk.green('✓'),
        error: chalk.red('✗'),
        info: chalk.cyan('ℹ')
    };

    const colors = {
        start: chalk.blue,
        success: chalk.green,
        error: chalk.red,
        info: chalk.cyan
    };

    console.log(`${icons[type]} ${colors[type](message)}`);
}

export function printHeader(title: string, color: 'cyan' | 'magenta' | 'blue' | 'green' = 'cyan') {
    const styledTitle = chalk.bold[color](title);
    console.log(boxen(styledTitle, {
        padding: 1,
        margin: 0,
        borderStyle: 'round',
        borderColor: color,
        backgroundColor: 'black'
    }));
}

export function printSuccessBox(title: string, content: string) {
    console.log(boxen(
        chalk.green.bold(title) + '\n\n' + content,
        {
            padding: 1,
            margin: 0,
            borderStyle: 'round',
            borderColor: 'green'
        }
    ));
}

export function printErrorBox(title: string, content: string) {
    console.log(boxen(
        chalk.red.bold(title) + '\n' + chalk.red(content),
        {
            padding: 1,
            margin: 0,
            borderStyle: 'round',
            borderColor: 'red'
        }
    ));
}

export function printWarningBox(title: string, content: string) {
    console.log(boxen(
        chalk.yellow.bold(title) + '\n\n' + content,
        {
            padding: 1,
            margin: 0,
            borderStyle: 'round',
            borderColor: 'yellow'
        }
    ));
}

export function printInfoBox(title: string, content: string) {
    console.log(boxen(
        chalk.cyan.bold(title) + '\n\n' + content,
        {
            padding: 1,
            margin: 0,
            borderStyle: 'round',
            borderColor: 'cyan'
        }
    ));
}

export function printCancelledBox(message: string = 'Operation cancelled') {
    console.log(boxen(
        chalk.yellow(`⏹️  ${message}`),
        {
            padding: 1,
            margin: 0,
            borderStyle: 'round',
            borderColor: 'yellow'
        }
    ));
}

// Handle script execution errors with consistent styling
export function handleScriptError(error: unknown, scriptName: string) {
    if (error instanceof Error && error.message === 'canceled') {
        printCancelledBox(`${scriptName} cancelled`);
        return;
    }
    printErrorBox('💥 Unexpected error', String(error));
    process.exit(1);
}
