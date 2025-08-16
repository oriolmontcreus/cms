<script lang="ts">
    import type { FormField } from "../types";
    import { Switch } from "@components/ui/switch";
    import { Label } from "@components/ui/label";

    export let field: FormField;
    export let fieldId: string;
    export let value: boolean = field.defaultValue ?? false;
</script>

<div class="inline-flex items-center gap-2">
    <Switch
        id={fieldId}
        bind:checked={value}
        disabled={field.disabled}
        aria-describedby={field.helperText ? `${fieldId}-help` : undefined}
    />
    <Label for={fieldId}>{field.label}</Label>
</div>
