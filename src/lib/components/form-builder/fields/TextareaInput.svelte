<script lang="ts">
    import type { FormField } from '../types';
    import { Textarea } from '@components/ui/textarea';

    export let field: FormField;
    export let fieldId: string;
    export let value: string;
</script>

<Textarea
    id={fieldId}
    name={fieldId}
    placeholder={field.placeholder}
    required={field.required}
    disabled={field.disabled}
    readonly={field.readonly}
    minlength={field.min}
    maxlength={field.max}
    bind:value
/> 