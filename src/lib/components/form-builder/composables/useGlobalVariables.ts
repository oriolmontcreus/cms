import { onMount, onDestroy } from "svelte";
import { globalVariablesStore } from "@/stores/globalVariables";
import { writable, derived } from "svelte/store";

export interface GlobalVariableState {
    variableNames: string[];
    data: Record<string, any>;
    isLoaded: boolean;
}

export function useGlobalVariables() {
    let globalVariableNames: string[] = [];
    let globalVariablesData: Record<string, any> = {};

    const state = writable<GlobalVariableState>({
        variableNames: [],
        data: {},
        isLoaded: false
    });

    const unsubscribe = globalVariablesStore.subscribe((storeState) => {
        globalVariableNames = storeState.variableNames;
        globalVariablesData = storeState.data;

        state.set({
            variableNames: globalVariableNames,
            data: globalVariablesData,
            isLoaded: true
        });
    });

    // Create derived stores for reactive access
    const variableNames = derived(state, $state => $state.variableNames);
    const data = derived(state, $state => $state.data);

    onMount(async () => {
        await globalVariablesStore.load();
    });

    onDestroy(() => {
        unsubscribe();
    });

    return {
        state,
        variableNames,
        data,
        renderTextWithVariables: (text: string): string => {
            return text.replace(/(\{\{[^}]+\}\})/g, (match) => {
                const variableName = match.slice(2, -2);
                const variableValue = globalVariablesData[variableName] || "Variable not found";
                return `<span class="variable-highlight" data-variable-name="${variableName}" data-variable-value="${String(variableValue).replace(/"/g, "&quot;")}">${match}</span>`;
            });
        },
        getCurrentGlobalVariablesData: (): Record<string, any> => globalVariablesData
    };
}
