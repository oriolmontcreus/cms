import { tick } from "svelte";
import { writable } from "svelte/store";

export interface VariablePopoverState {
    open: boolean;
    searchQuery: string;
    selectedIndex: number;
    filteredVariables: string[];
}

export function useVariablePopover(
    getAvailableVariables: () => string[],
    onVariableSelect: (variable: string) => void
) {
    const state = writable<VariablePopoverState>({
        open: false,
        searchQuery: "",
        selectedIndex: -1,
        filteredVariables: []
    });

    let currentState: VariablePopoverState = {
        open: false,
        searchQuery: "",
        selectedIndex: -1,
        filteredVariables: []
    };

    state.subscribe(value => {
        currentState = value;
    });

    function updateFilteredVariables(query: string) {
        const availableVariables = getAvailableVariables();
        let filtered: string[];
        if (!query) {
            filtered = availableVariables.slice(0, 10);
        } else {
            const lowerQuery = query.toLowerCase();
            filtered = availableVariables
                .filter((name) => name.toLowerCase().includes(lowerQuery))
                .slice(0, 10);
        }

        state.update(s => ({
            ...s,
            searchQuery: query,
            filteredVariables: filtered,
            selectedIndex: -1
        }));
    }

    function openPopover(query: string = "") {
        updateFilteredVariables(query);
        state.update(s => ({
            ...s,
            open: true,
            searchQuery: query
        }));
    }

    function closePopover() {
        state.update(s => ({
            ...s,
            open: false,
            searchQuery: "",
            selectedIndex: -1
        }));
    }

    function navigateDown() {
        state.update(s => ({
            ...s,
            selectedIndex: s.selectedIndex < 0 ? 0 : (s.selectedIndex + 1) % s.filteredVariables.length
        }));
    }

    function navigateUp() {
        state.update(s => ({
            ...s,
            selectedIndex: s.selectedIndex < 0
                ? s.filteredVariables.length - 1
                : s.selectedIndex === 0
                    ? s.filteredVariables.length - 1
                    : s.selectedIndex - 1
        }));
    }

    function selectCurrentVariable() {
        if (currentState.selectedIndex >= 0 && currentState.filteredVariables.length > 0) {
            const selectedVariable = currentState.filteredVariables[currentState.selectedIndex];
            onVariableSelect(selectedVariable);
            closePopover();
        }
    }

    function selectVariable(variable: string) {
        onVariableSelect(variable);
        closePopover();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (!currentState.open || currentState.filteredVariables.length === 0) {
            return false;
        }

        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                navigateDown();
                return true;
            case "ArrowUp":
                event.preventDefault();
                navigateUp();
                return true;
            case "Enter":
            case "Tab":
                event.preventDefault();
                selectCurrentVariable();
                return true;
            case "Escape":
                closePopover();
                return true;
        }
        return false;
    }

    return {
        state,
        openPopover,
        closePopover,
        updateFilteredVariables,
        selectVariable,
        handleKeydown,
        get isOpen() { return currentState.open; },
        get selectedIndex() { return currentState.selectedIndex; },
        get filteredVariables() { return currentState.filteredVariables; }
    };
}
