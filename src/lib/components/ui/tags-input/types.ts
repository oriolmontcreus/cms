import type { HTMLInputAttributes } from 'svelte/elements';

export type TagsInputPropsWithoutHTML = {
    value?: string[];
    validate?: (val: string, tags: string[]) => string | undefined;
    allowDuplicates?: boolean;
};

export type TagsInputProps = TagsInputPropsWithoutHTML & Omit<HTMLInputAttributes, 'value'>;