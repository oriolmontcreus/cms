<script lang="ts">
    import { setContext } from "svelte";
    import { cn } from "$lib/utils";

    type StepperProps = {
        class?: string;
        value?: number;
        defaultValue?: number;
        children?: any;
    };

    let {
        class: className = "",
        value = undefined,
        defaultValue = 1,
        children,
        ...restProps
    }: StepperProps = $props();

    let currentStep = $state(value ?? defaultValue);

    // Update currentStep when value prop changes
    $effect(() => {
        if (value !== undefined) {
            currentStep = value;
        }
    });

    // Provide context for child components
    setContext("stepper", {
        get currentStep() {
            return currentStep;
        },
        setStep: (step: number) => {
            currentStep = step;
        },
    });
</script>

<div class={cn("flex", className)} {...restProps}>
    {@render children?.()}
</div>
