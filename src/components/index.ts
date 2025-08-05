import type { Component } from '@/lib/components/form-builder/types';
import { ContactInfo } from './ContactInfo';
import { FeatureCardComponent } from './FeatureCard';
import { HeroComponent } from './Hero';

// Registry of all available components
export const COMPONENT_REGISTRY: Record<string, Component> = {
    'ContactInfo': ContactInfo,
    'FeatureCard': FeatureCardComponent,
    'Hero': HeroComponent
};

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
