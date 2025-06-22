import { api } from "@/lib/utils/api";
import type { Page, Component } from "@shared/types/pages.type";
import { fetchWithToast, safeFetch } from "@/lib/utils/safeFetch";
import { errorToast } from "@/services/toast.service";

const root = "/pages";

//region routes
export async function getPages(): Promise<Page[]> {
    const { data } = await api.get<Page[]>(root);
    return data;
}

export async function getPageBySlug(slug: string): Promise<Page> {
    const { data } = await api.get<Page>(`${root}/${slug}`);
    return data;
}

export async function updateComponents(slug: string, components: Component[]): Promise<Page> {
    const { data } = await api.put<Page>(`${root}/${slug}/components`, { components });
    return data;
}
//endregion

//region handlers
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
    const [data, err] = await fetchWithToast(updateComponents(slug, components), {
        loading: 'Updating components...',
        success: () => `Components updated successfully.`,
        error: 'Error updating components. Please try again.'
    });
    return err ? null : data;
}
//endregion 