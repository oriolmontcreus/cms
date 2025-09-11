<script lang="ts">
    import type { ValidationError } from "./utils/validation";
    import {
        globalValidationState,
        updateValidationState,
    } from "$lib/stores/validationState";

    export let errors: ValidationError[] = [];
    export let isVisible: boolean = false;
    export let totalErrors: number = 0;
    export let fixedErrors: number = 0;

    // Forward events
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher<{
        navigateToError: { error: ValidationError };
        nextError: void;
        previousError: void;
    }>();

    function handleNavigateToError(
        event: CustomEvent<{ error: ValidationError }>,
    ) {
        dispatch("navigateToError", event.detail);
    }

    function handleNextError() {
        dispatch("nextError");
    }

    function handlePreviousError() {
        dispatch("previousError");
    }

    // Update global validation state when props change
    $: {
        updateValidationState({
            errors,
            isVisible,
            totalErrors,
            fixedErrors,
            onNavigateToError: (error: ValidationError) =>
                handleNavigateToError({ detail: { error } } as any),
            onNextError: handleNextError,
            onPreviousError: handlePreviousError,
        });
    }
</script>

<!-- Validation is now only shown in the sidebar -->
