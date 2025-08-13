import { writable } from 'svelte/store';
import { handleGetGlobalVariables } from '@/services/globalVariables.service';

interface GlobalVariablesState {
    data: Record<string, any>;
    variableNames: string[];
    isLoading: boolean;
    isLoaded: boolean;
    error: string | null;
}

const initialState: GlobalVariablesState = {
    data: {},
    variableNames: [],
    isLoading: false,
    isLoaded: false,
    error: null
};

function createGlobalVariablesStore() {
    const { subscribe, set, update } = writable<GlobalVariablesState>(initialState);

    // Keep track of ongoing requests to prevent duplicate API calls
    let loadingPromise: Promise<void> | null = null;

    return {
        subscribe,
        async load() {
            // If already loaded, return immediately
            if (initialState.isLoaded) {
                return;
            }

            // If already loading, wait for the existing promise
            if (loadingPromise) {
                return loadingPromise;
            }

            // Start loading
            update(state => ({ ...state, isLoading: true, error: null }));

            loadingPromise = (async () => {
                try {
                    console.log('[GlobalVariablesStore] Loading global variables...');
                    const data = await handleGetGlobalVariables();

                    // Extract variable names (excluding 'translations' and 'updatedAt')
                    const variableNames = Object.keys(data).filter(
                        (key) =>
                            key !== "translations" &&
                            key !== "updatedAt" &&
                            typeof data[key] !== "object",
                    );

                    set({
                        data,
                        variableNames,
                        isLoading: false,
                        isLoaded: true,
                        error: null
                    });

                    console.log('[GlobalVariablesStore] Global variables loaded successfully:', {
                        variableCount: variableNames.length,
                        variables: variableNames
                    });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to load global variables';
                    console.error('[GlobalVariablesStore] Failed to load global variables:', error);
                    set({
                        data: {},
                        variableNames: [],
                        isLoading: false,
                        isLoaded: false,
                        error: errorMessage
                    });
                } finally {
                    loadingPromise = null;
                }
            })();

            return loadingPromise;
        },
        reset() {
            set(initialState);
            loadingPromise = null;
        }
    };
}

export const globalVariablesStore = createGlobalVariablesStore();
