<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/utils";

    type StepperTriggerProps = {
        class?: string;
        children?: any;
    };

    let {
        class: className = "",
        children,
        ...restProps
    }: StepperTriggerProps = $props();

    const stepperContext = getContext<{
        currentStep: number;
        setStep: (step: number) => void;
    }>("stepper");
</script>

<button
    class={cn("flex items-center justify-center", className)}
    {...restProps}
>
    {@render children?.()}
</button>
