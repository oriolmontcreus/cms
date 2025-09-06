# Excalibur CMS CLI Tool

The Excalibur CLI provides a unified command-line interface for managing your CMS development workflow.

## Installation

The CLI is automatically available after running the install command:

```bash
npm run install-cli
```

This creates a global `excalibur` command that you can use from anywhere in your terminal.

## Usage

```bash
excalibur <command>
```

## Available Commands

### Creation Commands
- `excalibur create:page` - Create a new page
- `excalibur create:component` - Create a new component  
- `excalibur create:user` - Create a new user

### Deletion Commands
- `excalibur delete:component` - Delete a component

### Development Commands
- `excalibur dev` - Start development server (frontend + backend)

### Build Commands
- `excalibur build` - Build the application for production
- `excalibur preview` - Preview the built application

### Quality Commands
- `excalibur check` - Run SvelteKit sync and type checking
- `excalibur check:watch` - Run type checking in watch mode

### Utility Commands
- `excalibur help` - Show help information
- `excalibur version` - Show version information

## Examples

```bash
# Start development with both frontend and backend
excalibur dev

# Create a new page
excalibur create:page

# Create a new component
excalibur create:component

# Build for production
excalibur build

# Check types
excalibur check
```

## Features

- 🎨 **Colorful output** - Easy to read command output with colors and emojis
- ⚡ **Fast execution** - Direct mapping to npm scripts with minimal overhead
- 📖 **Clear help** - Organized help system with command categories
- 🏗️ **Extensible** - Easy to add new commands by updating the CLI script

## Uninstalling

If you need to uninstall the global CLI:

```bash
npm run uninstall-cli
```

## Adding New Commands

To add new commands to the CLI:

1. Add the new npm script to `package.json`
2. Update the `commands` object in `cli.js` with the new command mapping
3. The command will automatically appear in the help system

## Technical Details

- Built with Node.js ES modules
- Uses `child_process.spawn` for script execution
- Maintains all stdio streams for interactive commands
- Proper exit code handling for CI/CD integration
