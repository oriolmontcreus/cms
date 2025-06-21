import type { PageConfig } from './components/form-builder/types';

// Import all page configurations
import { config as homeConfig } from '../pages/home';

// Page registry - add new pages here
const pageConfigs: Record<string, PageConfig> = {
    'home': homeConfig
};

export function getPageConfig(slug: string): PageConfig | null {
    return pageConfigs[slug] || null;
}

export function getAllPageSlugs(): string[] {
    return Object.keys(pageConfigs);
}

export function getAllPagesWithData(): Record<string, PageConfig> {
    return pageConfigs;
}

export default pageConfigs; 