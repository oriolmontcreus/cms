import type { SchemaItem } from '@/lib/components/form-builder/types';
import { FEATURE_CARD_SCHEMA, CONTACT_INFO_SCHEMA } from './predefinedSchemas';

// Helper function to embed a component's schema directly
export function ComponentSchema(componentName: string): SchemaItem[] {
    switch (componentName) {
        case 'FeatureCard':
            return [...FEATURE_CARD_SCHEMA];
        case 'ContactInfo':
            return [...CONTACT_INFO_SCHEMA];
        default:
            console.warn(`Component schema "${componentName}" not found`);
            return [];
    }
}
