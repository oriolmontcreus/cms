<script lang="ts">
    import type { FormField } from '../types';
    import { Input } from '@components/ui/input';

    export let field: FormField;
    export let fieldId: string;
    export let value: string;
</script>

<Input
    type="text"
    id={fieldId}
    name={fieldId}
    placeholder={field.placeholder}
    required={field.required}
    disabled={field.disabled}
    readonly={field.readonly}
    minlength={field.min}
    maxlength={field.max}
    pattern={field.pattern}
    bind:value
/> 