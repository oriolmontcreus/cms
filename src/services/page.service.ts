import { api } from "@/lib/utils/api";
import type { Page, Component } from "@shared/types/pages";
import type { PageConfig } from "@/lib/components/form-builder/types";
import { getPageConfig } from "@/lib/page-registry";
import { fetchWithToast, safeFetch } from "@/lib/utils/safeFetch";
import { errorToast } from "@/services/toast.service";

const root = "/pages";

//region routes
export async function createPage(title: string, slug: string, config?: Record<string, any>): Promise<Page> {
    const { data } = await api.post<Page>(root, { title, slug, config });
    return data;
}

export async function getPages(): Promise<Page[]> {
    const { data } = await api.get<Page[]>(root);
    return data;
}

export async function getPageBySlug(slug: string): Promise<Page> {
    const { data } = await api.get<Page>(`${root}/${slug}`);
    
    // Load TypeScript configuration and merge with database data
    const tsConfig = getPageConfig(slug);
    if (tsConfig) {
        data.config = tsConfig;
    }
    
    return data;
}

export async function updatePage(slug: string, content: string): Promise<Page> {
    const { data } = await api.put<Page>(`${root}/${slug}`, { content });
    return data;
}

export async function updateComponents(slug: string, components: Component[]): Promise<Page> {
    const { data } = await api.put<Page>(`${root}/${slug}/components`, { components });
    return data;
}

export async function updateComponentFormData(slug: string, instanceId: string, formData: Record<string, any>): Promise<Page> {
    const { data } = await api.put<Page>(`${root}/${slug}/components/${instanceId}`, { formData });
    return data;
}
//endregion

//region handlers
export async function handleCreatePage(title: string, slug: string, config?: Record<string, any>): Promise<Page | null> {
    const [data, err] = await fetchWithToast(createPage(title, slug, config), {
        loading: 'Creating page...',
        success: () => `Page created successfully.`,
        error: 'Error creating page. Please try again.'
    });
    return err ? null : data;
}

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

export async function handleUpdatePage(slug: string, content: string): Promise<Page | null> {
    const [data, err] = await fetchWithToast(updatePage(slug, content), {
        loading: 'Updating page...',
        success: () => `Page updated successfully.`,
        error: 'Error updating page. Please try again.'
    });
    return err ? null : data;
}

export async function handleUpdateComponents(slug: string, components: Component[]): Promise<Page | null> {
    const [data, err] = await fetchWithToast(updateComponents(slug, components), {
        loading: 'Updating components...',
        success: () => `Components updated successfully.`,
        error: 'Error updating components. Please try again.'
    });
    return err ? null : data;
}

export async function handleUpdateComponentFormData(slug: string, instanceId: string, formData: Record<string, any>): Promise<Page | null> {
    const [data, err] = await fetchWithToast(updateComponentFormData(slug, instanceId, formData), {
        loading: 'Updating component data...',
        success: () => `Component data updated successfully.`,
        error: 'Error updating component data. Please try again.'
    });
    return err ? null : data;
}
//endregion 