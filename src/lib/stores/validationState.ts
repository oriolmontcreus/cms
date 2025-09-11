import { writable } from 'svelte/store';
import type { ValidationError } from '$lib/components/form-builder/utils/validation';

export interface ValidationState {
    errors: ValidationError[];
    isVisible: boolean;
    totalErrors: number;
    fixedErrors: number;
    onNavigateToError: ((error: ValidationError) => void) | null;
    onNextError: (() => void) | null;
    onPreviousError: (() => void) | null;
}

const initialState: ValidationState = {
    errors: [],
    isVisible: false,
    totalErrors: 0,
    fixedErrors: 0,
    onNavigateToError: null,
    onNextError: null,
    onPreviousError: null,
};

export const globalValidationState = writable<ValidationState>(initialState);

// Helper functions to update the store
export function updateValidationState(updates: Partial<ValidationState>) {
    globalValidationState.update(state => ({
        ...state,
        ...updates
    }));
}

export function clearValidationState() {
    globalValidationState.set(initialState);
}
