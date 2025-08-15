import { fetchWithToast, safeFetch } from "@/lib/utils/safeFetch";
import { errorToast } from "@/services/toast.service";
import { api } from "@/lib/utils/api";
import { FRONTEND_URL } from "@shared/env";

//region Local data helpers
async function getExistingGlobalVariablesData(): Promise<Record<string, any>> {
    try {
        const response = await fetch(`${FRONTEND_URL}/src/data/globalVariables.json?t=${Date.now()}`, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch globalVariables.json');
        return await response.json();
    } catch (error) {
        console.warn('No existing globalVariables.json found or error fetching it, returning empty object');
        return {};
    }
}
//endregion

//region Local routes (no API calls)
/**
 * Get global variables from static JSON file
 */
export async function getGlobalVariables(): Promise<Record<string, any>> {
    return await getExistingGlobalVariablesData();
}

/**
 * Get global variable names for autocomplete
 */
export async function getGlobalVariableNames(): Promise<string[]> {
    const data = await getExistingGlobalVariablesData();
    return Object.keys(data).filter(key =>
        key !== 'translations' &&
        key !== 'updatedAt' &&
        typeof data[key] !== 'object'
    );
}

/**
 * Update global variables
 */
export async function updateGlobalVariables(data: Record<string, any>): Promise<{ message: string; data: Record<string, any> }> {
    const { data: result } = await api.put<{ message: string; data: Record<string, any> }>(`/global-variables`, data);
    return result;
}
//endregion

//region Handlers
export async function handleGetGlobalVariables(): Promise<Record<string, any>> {
    const [data, err] = await safeFetch(getGlobalVariables());
    if (err) errorToast('Error loading global variables.');
    return data || {};
}

export async function handleUpdateGlobalVariables(data: Record<string, any>): Promise<{ message: string; data: Record<string, any> } | null> {
    const [result, err] = await fetchWithToast(updateGlobalVariables(data), {
        loading: 'Updating global variables...',
        success: () => `Global variables updated successfully.`,
        error: 'Error updating global variables. Please try again.'
    });
    return err ? null : result;
}
//endregion
