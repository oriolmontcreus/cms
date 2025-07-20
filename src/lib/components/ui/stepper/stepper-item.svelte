<script lang="ts">
    import { getContext, setContext } from "svelte";
    import { cn } from "$lib/utils";

    type StepperItemProps = {
        class?: string;
        step: number;
        children?: any;
    };

    let {
        class: className = "",
        step,
        children,
        ...restProps
    }: StepperItemProps = $props();

    const stepperContext = getContext<{
        currentStep: number;
        setStep: (step: number) => void;
    }>("stepper");

    const isActive = $derived(stepperContext?.currentStep === step);
    const isCompleted = $derived(
        stepperContext ? stepperContext.currentStep > step : false,
    );

    // Provide context for child components
    setContext("stepperItem", {
        step,
        get isActive() {
            return isActive;
        },
        get isCompleted() {
            return isCompleted;
        },
    });
</script>

<div
    class={cn("relative", className)}
    data-step={step}
    data-active={isActive}
    data-completed={isCompleted}
    {...restProps}
>
    {@render children?.()}
</div>
