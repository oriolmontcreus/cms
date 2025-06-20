import type { FormField } from './types';

// Base field builder class
abstract class BaseField {
    protected field: Partial<FormField> = {};

    constructor(name: string) {
        this.field.name = name;
    }

    label(text: string): this {
        this.field.label = text;
        return this;
    }

    placeholder(text: string): this {
        this.field.placeholder = text;
        return this;
    }

    required(isRequired: boolean = true): this {
        this.field.required = isRequired;
        return this;
    }

    disabled(isDisabled: boolean = true): this {
        this.field.disabled = isDisabled;
        return this;
    }

    readonly(isReadonly: boolean = true): this {
        this.field.readonly = isReadonly;
        return this;
    }

    helperText(text: string): this {
        this.field.helperText = text;
        return this;
    }

    build(): FormField {
        if (!this.field.label) {
            throw new Error(`Field "${this.field.name}" must have a label`);
        }
        return this.field as FormField;
    }
}

// Text input field builder
export class TextInputField extends BaseField {
    constructor(name: string) {
        super(name);
        this.field.type = 'text';
    }

    min(minLength: number): this {
        this.field.min = minLength;
        return this;
    }

    max(maxLength: number): this {
        this.field.max = maxLength;
        return this;
    }

    pattern(regex: string): this {
        this.field.pattern = regex;
        return this;
    }
}

// Textarea field builder
export class TextareaField extends BaseField {
    constructor(name: string) {
        super(name);
        this.field.type = 'textarea';
    }

    min(minLength: number): this {
        this.field.min = minLength;
        return this;
    }

    max(maxLength: number): this {
        this.field.max = maxLength;
        return this;
    }
}

// Number input field builder
export class NumberField extends BaseField {
    constructor(name: string) {
        super(name);
        this.field.type = 'number';
    }

    min(minValue: number): this {
        this.field.min = minValue;
        return this;
    }

    max(maxValue: number): this {
        this.field.max = maxValue;
        return this;
    }

    step(stepValue: number): this {
        this.field.step = stepValue;
        return this;
    }
}

// Date input field builder
export class DateField extends BaseField {
    constructor(name: string) {
        super(name);
        this.field.type = 'date';
    }
}

// Select field builder
export class SelectField extends BaseField {
    constructor(name: string) {
        super(name);
        this.field.type = 'select';
        this.field.options = [];
    }

    options(optionsList: string[]): this {
        this.field.options = optionsList;
        return this;
    }

    multiple(isMultiple: boolean = true): this {
        this.field.multiple = isMultiple;
        return this;
    }
}

// Factory functions for easier usage (similar to Filament)
export const TextInput = (name: string) => new TextInputField(name);
export const Textarea = (name: string) => new TextareaField(name);
export const Number = (name: string) => new NumberField(name);
export const Date = (name: string) => new DateField(name);
export const Select = (name: string) => new SelectField(name);

// Helper function to build an array of fields
export function buildFields(...fields: BaseField[]): FormField[] {
    return fields.map(field => field.build());
} 