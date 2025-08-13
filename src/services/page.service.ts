import type { Page, Component } from "@/lib/shared/types/pages.type";
import { fetchWithToast, safeFetch } from "@/lib/utils/safeFetch";
import { errorToast } from "@/services/toast.service";
import { getPageConfig, getAllPageSlugs } from "@/lib/page-registry";
import { api } from "@/lib/utils/api";
import { CMS_FULLNAME, FRONTEND_URL } from "@shared/env";

//region Local data helpers
async function getExistingPagesData(): Promise<Page[]> {
    try {
        const response = await fetch(`${FRONTEND_URL}/src/data/pages.json?t=${Date.now()}`, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch pages.json');
        return await response.json();
    } catch (error) {
        console.warn(`${CMS_FULLNAME} No existing pages.json found or error fetching it, starting fresh`);
        return [];
    }
}

function configToPageDTO(config: any, fullSlug: string, existingPage?: Page): Page {
    const components: Component[] = config.components.map((comp: any) => {
        // Find existing component data
        const existingComponent = existingPage?.components?.find((c: Component) => c.instanceId === comp.id);

        return {
            componentName: comp.component.name,
            instanceId: comp.id,
            displayName: comp.displayName || comp.component.name,
            formData: existingComponent?.formData || {}
        };
    });

    return {
        _id: existingPage?._id || fullSlug,
        title: config.title,
        slug: fullSlug, // Use the full slug (e.g., "home/services") instead of config.slug
        parentSlug: config.parentSlug,
        content: existingPage?.content || "",
        config: config,
        components: components,
        createdAt: existingPage?.createdAt || new Date().toISOString(),
        updatedAt: existingPage?.updatedAt || new Date().toISOString()
    };
}
//endregion

//region Local routes (no API calls)
export async function getPages(): Promise<Page[]> {
    const slugs = getAllPageSlugs();
    const existingPages = await getExistingPagesData();
    const pages: Page[] = [];

    for (const slug of slugs) {
        const config = getPageConfig(slug);
        if (config) {
            const existingPage = existingPages.find(p => p.slug === slug);
            pages.push(configToPageDTO(config, slug, existingPage));
        }
    }

    return pages;
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
    const config = getPageConfig(slug);
    if (!config) return null;

    const existingPages = await getExistingPagesData();
    const existingPage = existingPages.find(p => p.slug === slug);

    return configToPageDTO(config, slug, existingPage);
}

export async function updateComponents(slug: string, components: Component[]): Promise<Page> {
    const apiSlug = slug === '/' ? 'index' : slug;
    const { data } = await api.put<Page>(`/pages/${apiSlug}/components`, { components });
    return data;
}
//endregion

//region Handlers
export async function handleGetPages(): Promise<Page[]> {
    const [data, err] = await safeFetch(getPages());
    if (err) errorToast('Error loading pages.');
    return data || [];
}

export async function handleGetPageBySlug(slug: string): Promise<Page | null> {
    const [data, err] = await safeFetch(getPageBySlug(slug));
    if (err) errorToast('Error loading page.');
    return data || null;
}

export async function handleUpdateComponents(slug: string, components: Component[]): Promise<Page | null> {
    // Special handling for global variables
    if (slug === "global-variables") {
        // Import global variables service dynamically to avoid circular dependencies
        const { updateGlobalVariables } = await import("@/services/globalVariables.service");

        if (components.length > 0) {
            const globalVariablesComponent = components[0];
            const formData = globalVariablesComponent.formData;

            console.log("🔄 Redirecting to global variables service:", formData);

            const [result, err] = await fetchWithToast(updateGlobalVariables(formData), {
                loading: 'Updating global variables...',
                success: () => `Global variables updated successfully.`,
                error: 'Error updating global variables. Please try again.'
            });

            if (err) return null;

            // Return a Page-like structure for consistency
            return {
                _id: slug,
                slug: slug,
                title: "Global Variables",
                parentSlug: undefined,
                content: "",
                config: {
                    title: "Global Variables",
                    slug: "global-variables",
                    components: []
                },
                components: components,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            } as Page;
        }
    }    // Regular page handling
    const [data, err] = await fetchWithToast(updateComponents(slug, components), {
        loading: 'Updating components...',
        success: () => `Components updated successfully.`,
        error: 'Error updating components. Please try again.'
    });
    return err ? null : data;
}
//endregion 