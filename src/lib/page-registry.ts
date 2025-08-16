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
}

export function getAllPageSlugs(): string[] {
    return Object.keys(pageConfigs);
}

export function getAllPagesWithData(): Record<string, PageConfig> {
    return pageConfigs;
}

// Helper functions to extract slug information from registry keys
export function getSlugFromKey(key: string): string {
    const parts = key.split('/');
    return parts[parts.length - 1];
}

export function getParentSlugFromKey(key: string): string | undefined {
    const parts = key.split('/');
    if (parts.length <= 1) return undefined;
    return parts.slice(0, -1).join('/');
}

export function getPageConfigWithSlugInfo(key: string): (PageConfig & { slug: string; parentSlug?: string }) | null {
    const config = getPageConfig(key);
    if (!config) return null;

    return {
        ...config,
        slug: getSlugFromKey(key),
        parentSlug: getParentSlugFromKey(key)
    };
}

export default pageConfigs; 