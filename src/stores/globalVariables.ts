import { writable, derived, type Readable } from 'svelte/store';
import { handleGetGlobalVariables } from '@/services/globalVariables.service';

interface GlobalVariablesState {
    data: Record<string, any>;
    isLoading: boolean;
    isLoaded: boolean;
    error: string | null;
}

interface DerivedGlobalVariablesState extends GlobalVariablesState {
    variableNames: string[];
}

const EXCLUDED_KEYS = new Set(['translations', 'updatedAt']);

function createGlobalVariablesStore() {
    const initialState: GlobalVariablesState = {
        data: {},
        isLoading: false,
        isLoaded: false,
        error: null
    };

    const { subscribe, set, update } = writable<GlobalVariablesState>(initialState);

    // Keep track of ongoing requests and current state for synchronous access
    let loadingPromise: Promise<void> | null = null;
    let currentState = initialState;

    // Update currentState whenever store changes
    subscribe(state => {
        currentState = state;
    });

    return {
        subscribe,
        async load() {
            // Use current state, not initial state!
            if (currentState.isLoaded) {
                return;
            }

            if (loadingPromise) {
                return loadingPromise;
            }

            update(state => ({ ...state, isLoading: true, error: null }));

            loadingPromise = (async () => {
                try {
                    const data = await handleGetGlobalVariables();

                    set({
                        data,
                        isLoading: false,
                        isLoaded: true,
                        error: null
                    });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to load global variables';
                    console.error('[GlobalVariablesStore] Failed to load:', error);

                    set({
                        data: {},
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
            currentState = initialState;
            loadingPromise = null;
        }
    };
}

// Create base store
const baseStore = createGlobalVariablesStore();

// Create optimized derived store with memoized variable names
const derivedStore: Readable<DerivedGlobalVariablesState> = derived(
    baseStore,
    ($base, set) => {
        // Memoize variable names computation
        const variableNames = Object.keys($base.data).filter(
            key => !EXCLUDED_KEYS.has(key) && typeof $base.data[key] !== 'object'
        );

        set({
            ...$base,
            variableNames
        });
    },
    {
        data: {},
        variableNames: [],
        isLoading: false,
        isLoaded: false,
        error: null
    } as DerivedGlobalVariablesState
);

// Export the optimized derived store as the main API
export const globalVariablesStore = {
    subscribe: derivedStore.subscribe,
    load: baseStore.load,
    reset: baseStore.reset
};
