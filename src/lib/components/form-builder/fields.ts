import type { FormField, FieldType } from './types';

class FieldBuilder {
    private field: Partial<FormField> = {};

    constructor(type: FieldType, name: string) {
        this.field.type = type;
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

    min(value: number): this {
        this.field.min = value;
        return this;
    }

    max(value: number): this {
        this.field.max = value;
        return this;
    }

    step(value: number): this {
        this.field.step = value;
        return this;
    }

    decimalSeparator(separator: ',' | '.'): this {
        this.field.decimalSeparator = separator;
        return this;
    }

    pattern(regex: string): this {
        this.field.pattern = regex;
        return this;
    }

    url(): this {
        this.field.pattern = '^https?://.+';
        return this;
    }

    options(optionsList: string[]): this {
        this.field.options = optionsList;
        return this;
    }

    multiple(isMultiple: boolean = true): this {
        this.field.multiple = isMultiple;
        return this;
    }

    searchable(isSearchable: boolean = true): this {
        this.field.searchable = isSearchable;
        return this;
    }

    locale(localeString: string): this {
        this.field.locale = localeString;
        return this;
    }

    weekdayFormat(format: 'short' | 'long' | 'narrow'): this {
        this.field.weekdayFormat = format;
        return this;
    }

    yearFormat(format: 'numeric' | '2-digit'): this {
        this.field.yearFormat = format;
        return this;
    }

    monthFormat(format: 'numeric' | '2-digit' | 'short' | 'long' | 'narrow'): this {
        this.field.monthFormat = format;
        return this;
    }

    dateStyle(style: 'full' | 'long' | 'medium' | 'short'): this {
        this.field.dateStyle = style;
        return this;
    }

    minDate(date: string | Date): this {
        this.field.minDate = date instanceof Date ? date.toISOString().split('T')[0] : date;
        return this;
    }

    maxDate(date: string | Date): this {
        this.field.maxDate = date instanceof Date ? date.toISOString().split('T')[0] : date;
        return this;
    }

    build(): FormField {
        if (!this.field.label) {
            throw new Error(`Field "${this.field.name}" must have a label`);
        }
        return this.field as FormField;
    }
}

// Factory functions for each field type
export const TextInput = (name: string) => new FieldBuilder('text', name);
export const Textarea = (name: string) => new FieldBuilder('textarea', name);
export const Number = (name: string) => new FieldBuilder('number', name);
export const DatePicker = (name: string) => new FieldBuilder('date', name);
export const Email = (name: string) => new FieldBuilder('email', name);
export const Select = (name: string) => new FieldBuilder('select', name);
export const Toggle = (name: string) => new FieldBuilder('toggle', name);

// Helper function to build an array of fields
export function buildFields(...fields: FieldBuilder[]): FormField[] {
    return fields.map(field => field.build());
} 