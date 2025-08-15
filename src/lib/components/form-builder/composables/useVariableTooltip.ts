import { tick } from "svelte";
import { writable } from "svelte/store";

export interface TooltipState {
    show: boolean;
    content: string;
    position: { x: number; y: number };
}

export function useVariableTooltip(getGlobalVariablesData?: () => Record<string, any>) {
    const state = writable<TooltipState>({
        show: false,
        content: "",
        position: { x: 0, y: 0 }
    });

    function showTooltip(content: string, x: number, y: number) {
        state.set({
            show: true,
            content,
            position: { x, y }
        });
    }

    function hideTooltip() {
        state.update(s => ({ ...s, show: false }));
    }

    function handleMouseOver(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (target && target.classList.contains("variable-highlight")) {
            const variableName = target.getAttribute("data-variable-name");

            if (variableName) {
                // Get the current variable value dynamically instead of relying on static attribute
                let variableValue: string;

                if (getGlobalVariablesData) {
                    const globalVariablesData = getGlobalVariablesData();
                    const currentValue = globalVariablesData[variableName];
                    variableValue = currentValue !== undefined ? String(currentValue) : "Variable not found";
                } else {
                    // Fallback to the static attribute if no dynamic getter is provided
                    variableValue = target.getAttribute("data-variable-value") || "Variable not found";
                }

                const rect = target.getBoundingClientRect();
                showTooltip(
                    variableValue,
                    rect.left + rect.width / 2,
                    rect.top - 10
                );
            }
        }
    }

    function handleMouseOut(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (target && target.classList.contains("variable-highlight")) {
            hideTooltip();
        }
    }

    return {
        state,
        showTooltip,
        hideTooltip,
        handleMouseOver,
        handleMouseOut
    };
}
