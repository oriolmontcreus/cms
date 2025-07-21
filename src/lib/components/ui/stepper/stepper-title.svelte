<script lang="ts">
    import { cn } from "$lib/utils";

    type StepperTitleProps = {
        class?: string;
        children?: any;
    };

    let {
        class: className = "",
        children,
        ...restProps
    }: StepperTitleProps = $props();
</script>

<div class={cn("text-sm font-medium", className)} {...restProps}>
    {@render children?.()}
</div>
