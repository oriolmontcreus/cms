import type { SchemaItem, Layout } from '@/lib/components/form-builder/types';

// Schema cache to avoid circular dependencies
let schemaCache: Record<string, SchemaItem[]> = {};

// Helper function to register a component schema
export function registerComponentSchema(componentName: string, schema: Layout | SchemaItem[]): void {
    console.log(`Registering schema for "${componentName}"`);
    // Convert Layout to SchemaItem[] if needed
    if (Array.isArray(schema)) {
        schemaCache[componentName] = [...schema];
        console.log(`Registered "${componentName}" with ${schema.length} schema items`);
    } else {
        // If it's a Layout, extract the schema property or convert it to an array
        console.warn(`Component "${componentName}" has a Layout schema, which cannot be embedded directly. Please use SchemaItem[] for embeddable components.`);
        schemaCache[componentName] = [];
    }
}

// Helper function to embed a component's schema directly
// This reads from the schema cache to avoid circular dependencies
export function ComponentSchema(componentName: string): SchemaItem[] {
    try {
        const schema = schemaCache[componentName];

        if (!schema) {
            console.warn(`Component schema "${componentName}" not found. Available: ${Object.keys(schemaCache).join(', ')}`);
            return [];
        }

        console.log(`Found schema for "${componentName}" with ${schema.length} items`);
        // Return a copy of the schema to avoid mutations
        return [...schema];
    } catch (error) {
        console.error(`Failed to load component schema "${componentName}":`, error);
        return [];
    }
}// Get all available component names for reference
export function getAvailableComponentNames(): string[] {
    return Object.keys(schemaCache);
}

// Clear cache (useful for testing)
export function clearSchemaCache(): void {
    schemaCache = {};
}

// Async version for when you can use async/await
export async function ComponentSchemaAsync(componentName: string): Promise<SchemaItem[]> {
    return ComponentSchema(componentName);
}