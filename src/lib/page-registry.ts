import type { PageConfig } from './components/form-builder/types';

// Import all page configurations
import { config as homeConfig } from '../pages/home';
import { config as homeServicesConfig } from '../pages/home/services';

// Page registry - add new pages here
const pageConfigs: Record<string, PageConfig> = {
    'index': homeConfig,
    'index/services': homeServicesConfig,
};

export function getPageConfig(slug: string): PageConfig | null {
    return pageConfigs[slug] || null;
} export function getAllPageSlugs(): string[] {
    return Object.keys(pageConfigs);
}

export function getAllPagesWithData(): Record<string, PageConfig> {
    return pageConfigs;
}

export default pageConfigs; 