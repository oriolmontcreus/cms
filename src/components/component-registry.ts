import type { Component } from '@/lib/components/form-builder/types';
import { FeatureCard } from './FeatureCard';
import { Hero } from './Hero';
// Registry of all available embeddable components (simple schemas)
export const COMPONENT_REGISTRY: Record<string, Component> = {
    'FeatureCard': FeatureCard,
    'Hero': Hero,
};

// Export the embeddable components for direct use
export { FeatureCard, Hero };

// Get all component names for selection
export function getAvailableComponents(): string[] {
    return Object.keys(COMPONENT_REGISTRY);
}

// Get component by name
export function getComponentByName(name: string): Component | undefined {
    return COMPONENT_REGISTRY[name];
}

// Get component options for select fields
export function getComponentSelectOptions(): string[] {
    return getAvailableComponents();
}
