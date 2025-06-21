import { api } from "@/lib/utils/api";
import { fetchWithToast } from "@/lib/utils/safeFetch";

const root = "/build";

//region routes
export async function triggerBuild(): Promise<{ message: string; pagesBuilt: number }> {
    const { data } = await api.post<{ message: string; pagesBuilt: number }>(root, {});
    return data;
}
//endregion

//region handlers
export async function handleTriggerBuild(): Promise<{ message: string; pagesBuilt: number } | null> {
    const [data, err] = await fetchWithToast(triggerBuild(), {
        loading: 'Building site...',
        success: (data) => `${data.message} (${data.pagesBuilt} pages)`,
        error: 'Error building site. Please try again.'
    });
    return err ? null : data;
}
//endregion 