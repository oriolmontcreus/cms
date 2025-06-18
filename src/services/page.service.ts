import { api } from "@/lib/utils/api";
import type { Page } from "@shared/types/pages";
import { fetchWithToast, safeFetch } from "@/lib/utils/safeFetch";
import { errorToast } from "@/services/toast.service";

const root = "/pages";

//region routes
export async function createPage(title: string, slug: string): Promise<Page> {
    const { data } = await api.post<Page>(root, { title, slug });
    return data;
}

export async function getPages(): Promise<Page[]> {
    const { data } = await api.get<Page[]>(root);
    return data;
}
//endregion

//region handlers
export async function handleCreatePage(title: string, slug: string): Promise<Page | null> {
    const [data, err] = await fetchWithToast(createPage(title, slug), {
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
//endregion 