import type { Component } from "@/lib/components/form-builder/types";
import { getAllPagesWithData } from "@/lib/page-registry";

// Cache for discovered components
let componentCache: Record<string, Component> | null = null;

/**
 * Automatically discover all components from page configurations
 * This scans all registered pages and extracts their component definitions
 */
function discoverComponents(): Record<string, Component> {
    if (componentCache) return componentCache;

    const components: Record<string, Component> = {};
    const pageConfigs = getAllPagesWithData();

    console.log('🔍 Discovering components from page registry...');
    console.log('📄 Found page configs:', Object.keys(pageConfigs));

    // Scan all page configurations for component definitions
    Object.values(pageConfigs).forEach(pageConfig => {
        pageConfig.components.forEach(componentInstance => {
            const component = componentInstance.component;
            if (component && component.name) {
                components[component.name] = component;
                console.log(`✅ Discovered component: ${component.name}`);
            }
        });
    });

    console.log('🎯 Total components discovered:', Object.keys(components));
    componentCache = components;
    return components;
}

/**
 * Get a component definition by name
 * Automatically discovers components from page configurations
 */
export function getComponentByName(componentName: string): Component | null {
    const components = discoverComponents();
    return components[componentName] || null;
}

/**
 * Get all available component names
 */
export function getAvailableComponentNames(): string[] {
    const components = discoverComponents();
    return Object.keys(components);
}

/**
 * Clear the component cache (useful for development/testing)
 */
export function clearComponentCache(): void {
    componentCache = null;
}

/**
 * Get all discovered components
 */
export function getAllComponents(): Record<string, Component> {
    return discoverComponents();
}