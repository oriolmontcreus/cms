# CMS Documentation

Welcome to the Excalibur CMS documentation. This directory contains all the documentation related to the CMS system.

## 📚 Documentation Index

### CLI Tool
- [`cli-tool.md`](./cli-tool.md) - Excalibur CLI tool documentation with commands, usage, and examples

### Core API Documentation
- [`global-variables-api.md`](./global-variables-api.md) - Comprehensive Global Variables API documentation with features, usage examples, and integration guides
- [`global-variables-usage.md`](./global-variables-usage.md) - Simple usage guide for Global Variables in Astro components

### Development & Context
- [`context-llm.md`](./context-llm.md) - Context information for LLM about the CMS project structure and conventions
- [`devtool-integration.md`](./devtool-integration.md) - Excalibur CMS DevTool integration setup and usage guide

### Components Documentation
- [`components/form-builder.md`](./components/form-builder.md) - Form Builder component documentation with schema types and usage examples

## 🏗️ Project Structure

This CMS is built with:
- **Frontend**: SvelteKit with shadcn-svelte components
- **Backend**: HonoJS 
- **Database**: MongoDB
- **Architecture**: Monorepo structure

The goal is to create something similar to Filament V3 (PHP admin panel) but with modern JavaScript technologies.

## 🔧 Development Guidelines

- Use shadcn-svelte components (latest version)
- Avoid try-catch blocks (error handling is implemented via wrappers)
- Follow the established monorepo structure

## 📖 Getting Started

1. Check the main [`../README.md`](../README.md) for project setup
2. Review the Global Variables API for dynamic content management
3. Explore component documentation for UI building blocks
4. Use the DevTool integration for debugging and development

---

*This documentation is organized to provide clear guidance for both development and usage of the Excalibur CMS system.*
