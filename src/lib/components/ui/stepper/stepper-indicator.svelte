<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/utils";

    type StepperIndicatorProps = {
        class?: string;
        asChild?: boolean;
        children?: any;
    };

    let {
        class: className = "",
        asChild = false,
        children,
        ...restProps
    }: StepperIndicatorProps = $props();

    const stepperContext = getContext<{
        currentStep: number;
        setStep: (step: number) => void;
    }>("stepper");

    // Get the step number from the parent StepperItem
    const stepperItem = getContext<{
        step: number;
        isActive: boolean;
        isCompleted: boolean;
    }>("stepperItem");

    const isActive = $derived(
        stepperContext?.currentStep === stepperItem?.step,
    );
    const isCompleted = $derived(
        stepperContext
            ? stepperContext.currentStep > (stepperItem?.step || 0)
            : false,
    );
</script>

{#if asChild}
    <div
        class={cn("relative overflow-hidden rounded-full", className)}
        {...restProps}
    >
        <div class="absolute inset-0 bg-gray-200 dark:bg-gray-700"></div>
        <div
            class="h-full transition-all duration-300 {isCompleted
                ? 'bg-blue-600 w-full'
                : isActive
                  ? 'bg-blue-600 w-1/2'
                  : 'bg-transparent w-0'}"
        ></div>
        {@render children?.()}
    </div>
{:else}
    <div
        class={cn(
            "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all duration-300",
            isCompleted
                ? "bg-blue-600 border-blue-600 text-white"
                : isActive
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400",
            className,
        )}
        {...restProps}
    >
        {@render children?.()}
    </div>
{/if}
