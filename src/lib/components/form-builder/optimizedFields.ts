import type { FormField, FieldType, PrefixSuffix, SchemaItem } from './types';

/**
 * Optimized field builder that reduces object mutations and method call overhead
 * Uses a more functional approach with fewer intermediate mutations
 */

interface FieldConfig {
    type: FieldType;
    name: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    helperText?: string;
    prefix?: PrefixSuffix;
    suffix?: PrefixSuffix;
    min?: number;
    max?: number;
    step?: number;
    decimalSeparator?: ',' | '.';
    allowDecimals?: boolean;
    pattern?: string;
    options?: string[];
    multiple?: boolean;
    searchable?: boolean;
    locale?: string;
    weekdayFormat?: 'short' | 'long' | 'narrow';
    yearFormat?: 'numeric' | '2-digit';
    monthFormat?: 'numeric' | '2-digit' | 'short' | 'long' | 'narrow';
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    minDate?: string | Date;
    maxDate?: string | Date;
    rows?: number;
    resizable?: boolean;
    allowedMimeTypes?: string[];
    maxFileSize?: number;
    columnSpan?: number;
    tab?: string;
    translatable?: boolean;
    schema?: SchemaItem[];
    contained?: boolean;
    responsiveGrid?: {
        columns: number;
        gap: number;
        responsive?: { sm?: number; md?: number; lg?: number };
    };
}

class OptimizedFieldBuilder {
    private config: FieldConfig;

    constructor(type: FieldType, name: string) {
        this.config = { type, name };
    }

    // Batch configuration method for better performance
    configure(config: Partial<FieldConfig>): this {
        Object.assign(this.config, config);
        return this;
    }

    // Essential methods kept for API compatibility
    label(text: string): this {
        this.config.label = text;
        return this;
    }

    required(isRequired: boolean = true): this {
        this.config.required = isRequired;
        return this;
    }

    placeholder(text: string): this {
        this.config.placeholder = text;
        return this;
    }

    helperText(text: string): this {
        this.config.helperText = text;
        return this;
    }

    translatable(isTranslatable: boolean = true): this {
        this.config.translatable = isTranslatable;
        return this;
    }

    // Validation methods
    min(value: number): this {
        this.config.min = value;
        return this;
    }

    max(value: number): this {
        this.config.max = value;
        return this;
    }

    pattern(regex: string): this {
        this.config.pattern = regex;
        return this;
    }

    url(): this {
        this.config.pattern = '^https?://.+';
        return this;
    }

    // Options for select fields
    options(optionsList: string[]): this {
        this.config.options = optionsList;
        return this;
    }

    multiple(isMultiple: boolean = true): this {
        this.config.multiple = isMultiple;
        return this;
    }

    // File input specific
    allowedMimeTypes(types: string[]): this {
        this.config.allowedMimeTypes = types;
        return this;
    }

    maxFileSize(size: number, unit: 'b' | 'kb' | 'mb' | 'gb' = 'mb'): this {
        const multipliers = { 'b': 1, 'kb': 1024, 'mb': 1024 * 1024, 'gb': 1024 * 1024 * 1024 };
        this.config.maxFileSize = size * multipliers[unit];
        return this;
    }

    // Layout and structure
    columnSpan(span: number): this {
        this.config.columnSpan = span;
        return this;
    }

    tab(tabName: string): this {
        this.config.tab = tabName;
        return this;
    }

    // For repeatable fields
    schema(items: SchemaItem[]): this {
        this.config.schema = items;
        return this;
    }

    contained(isContained: boolean = true): this {
        this.config.contained = isContained;
        return this;
    }

    responsiveGrid(
        columns: number = 2,
        gap: number = 4,
        responsive?: { sm?: number; md?: number; lg?: number }
    ): this {
        this.config.responsiveGrid = { columns, gap, responsive };
        return this;
    }

    // State modifiers
    disabled(isDisabled: boolean = true): this {
        this.config.disabled = isDisabled;
        return this;
    }

    readonly(isReadonly: boolean = true): this {
        this.config.readonly = isReadonly;
        return this;
    }

    toJSON(): FormField {
        // Convert config to FormField format efficiently
        const field: FormField = {
            type: this.config.type,
            name: this.config.name,
            label: this.config.label || ''
        };

        // Only assign defined properties to avoid undefined pollution
        if (this.config.placeholder !== undefined) field.placeholder = this.config.placeholder;
        if (this.config.required !== undefined) field.required = this.config.required;
        if (this.config.disabled !== undefined) field.disabled = this.config.disabled;
        if (this.config.readonly !== undefined) field.readonly = this.config.readonly;
        if (this.config.helperText !== undefined) field.helperText = this.config.helperText;
        if (this.config.prefix !== undefined) field.prefix = this.config.prefix;
        if (this.config.suffix !== undefined) field.suffix = this.config.suffix;
        if (this.config.min !== undefined) field.min = this.config.min;
        if (this.config.max !== undefined) field.max = this.config.max;
        if (this.config.step !== undefined) field.step = this.config.step;
        if (this.config.decimalSeparator !== undefined) field.decimalSeparator = this.config.decimalSeparator;
        if (this.config.allowDecimals !== undefined) field.allowDecimals = this.config.allowDecimals;
        if (this.config.pattern !== undefined) field.pattern = this.config.pattern;
        if (this.config.options !== undefined) field.options = this.config.options;
        if (this.config.multiple !== undefined) field.multiple = this.config.multiple;
        if (this.config.searchable !== undefined) field.searchable = this.config.searchable;
        if (this.config.locale !== undefined) field.locale = this.config.locale;
        if (this.config.weekdayFormat !== undefined) field.weekdayFormat = this.config.weekdayFormat;
        if (this.config.yearFormat !== undefined) field.yearFormat = this.config.yearFormat;
        if (this.config.monthFormat !== undefined) field.monthFormat = this.config.monthFormat;
        if (this.config.dateStyle !== undefined) field.dateStyle = this.config.dateStyle;
        if (this.config.minDate !== undefined) {
            field.minDate = this.config.minDate instanceof Date ? 
                this.config.minDate.toISOString().split('T')[0] : this.config.minDate;
        }
        if (this.config.maxDate !== undefined) {
            field.maxDate = this.config.maxDate instanceof Date ? 
                this.config.maxDate.toISOString().split('T')[0] : this.config.maxDate;
        }
        if (this.config.rows !== undefined) field.rows = this.config.rows;
        if (this.config.resizable !== undefined) field.resizable = this.config.resizable;
        if (this.config.allowedMimeTypes !== undefined) field.allowedMimeTypes = this.config.allowedMimeTypes;
        if (this.config.maxFileSize !== undefined) field.maxFileSize = this.config.maxFileSize;
        if (this.config.columnSpan !== undefined) field.columnSpan = this.config.columnSpan;
        if (this.config.tab !== undefined) field.tab = this.config.tab;
        if (this.config.translatable !== undefined) field.translatable = this.config.translatable;
        if (this.config.schema !== undefined) field.schema = this.config.schema;
        if (this.config.contained !== undefined) field.contained = this.config.contained;
        if (this.config.responsiveGrid !== undefined) field.responsiveGrid = this.config.responsiveGrid;

        return field;
    }

    get type(): FieldType { return this.config.type; }
    get name(): string { return this.config.name; }
}

// Optimized factory functions with pre-configured builders
export const TextInputOptimized = (name: string) => new OptimizedFieldBuilder('text', name);
export const TextareaOptimized = (name: string) => new OptimizedFieldBuilder('textarea', name);
export const NumberOptimized = (name: string) => new OptimizedFieldBuilder('number', name);
export const DatePickerOptimized = (name: string) => new OptimizedFieldBuilder('date', name);
export const DateRangePickerOptimized = (name: string) => new OptimizedFieldBuilder('dateRange', name);
export const EmailOptimized = (name: string) => new OptimizedFieldBuilder('email', name);
export const SelectOptimized = (name: string) => new OptimizedFieldBuilder('select', name);
export const ToggleOptimized = (name: string) => new OptimizedFieldBuilder('toggle', name);
export const ColorPickerOptimized = (name: string) => new OptimizedFieldBuilder('color', name);
export const RichEditorOptimized = (name: string) => new OptimizedFieldBuilder('richtext', name);
export const FileInputOptimized = (name: string) => new OptimizedFieldBuilder('file', name);
export const RepeatableOptimized = (name: string) => new OptimizedFieldBuilder('repeatable', name);

// Quick field creation helpers for common patterns
export function createTextField(name: string, label: string, required = false, translatable = false): FormField {
    return new OptimizedFieldBuilder('text', name)
        .configure({ label, required, translatable })
        .toJSON();
}

export function createSelectField(name: string, label: string, options: string[], multiple = false): FormField {
    return new OptimizedFieldBuilder('select', name)
        .configure({ label, options, multiple })
        .toJSON();
}

export function createFileField(
    name: string, 
    label: string, 
    allowedTypes: string[], 
    maxSizeMB: number = 5
): FormField {
    return new OptimizedFieldBuilder('file', name)
        .configure({ label, allowedMimeTypes: allowedTypes })
        .maxFileSize(maxSizeMB, 'mb')
        .toJSON();
}

// Backward compatibility exports - can be removed once migration is complete
export {
    OptimizedFieldBuilder as FieldBuilder,
    TextInputOptimized as TextInput,
    TextareaOptimized as Textarea,
    NumberOptimized as Number,
    DatePickerOptimized as DatePicker,
    DateRangePickerOptimized as DateRangePicker,
    EmailOptimized as Email,
    SelectOptimized as Select,
    ToggleOptimized as Toggle,
    ColorPickerOptimized as ColorPicker,
    RichEditorOptimized as RichEditor,
    FileInputOptimized as FileInput,
    RepeatableOptimized as Repeatable
};

// Re-export existing components that don't need optimization
export { Tabs, TabField, GridContainer } from './fields';