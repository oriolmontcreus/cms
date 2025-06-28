import type { FormField, FieldType, PrefixSuffix, ComponentTab, TabsSelector, FieldBuilder as IFieldBuilder } from './types';

class FieldBuilder implements IFieldBuilder {
    private field: FormField;

    constructor(type: FieldType, name: string) {
        this.field = {
            type,
            name,
            label: ''
        };
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

    prefix(value: PrefixSuffix): this {
        this.field.prefix = value;
        return this;
    }

    suffix(value: PrefixSuffix): this {
        this.field.suffix = value;
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

    allowDecimals(allow: boolean = true): this {
        this.field.allowDecimals = allow;
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

    rows(count: number): this {
        this.field.rows = count;
        return this;
    }

    resizable(isResizable: boolean = true): this {
        this.field.resizable = isResizable;
        return this;
    }

    columnSpan(span: number): this {
        this.field.columnSpan = span;
        return this;
    }

    tab(tabName: string): this {
        this.field.tab = tabName;
        return this;
    }

    toJSON(): FormField { return this.field;}
    get type(): FieldType { return this.field.type; }
    get name(): string { return this.field.name; }
}

// Factory functions that return FieldBuilder instances
export const TextInput = (name: string) => new FieldBuilder('text', name);
export const Textarea = (name: string) => new FieldBuilder('textarea', name);
export const Number = (name: string) => new FieldBuilder('number', name);
export const DatePicker = (name: string) => new FieldBuilder('date', name);
export const DateRangePicker = (name: string) => new FieldBuilder('dateRange', name);
export const Email = (name: string) => new FieldBuilder('email', name);
export const Select = (name: string) => new FieldBuilder('select', name);
export const Toggle = (name: string) => new FieldBuilder('toggle', name);
export const ColorPicker = (name: string) => new FieldBuilder('color', name);
export const RichEditor = (name: string) => new FieldBuilder('richtext', name);

export function defineTab(name: string, label: string, icon?: any): ComponentTab {
    return {
        name,
        label,
        icon
    };
}

export function defineTabs(...tabs: ComponentTab[]): ComponentTab[] {
    return tabs;
}

// Create a tabs placeholder that defines where tabs should render in the schema flow
export function TabsSelector(id: string = 'tabs'): TabsSelector {
    return {
        type: 'tabs-selector',
        id
    };
}

// Grid creation utilities
export function defineGrid(
    columns: number = 2,
    gap: number = 4,
    responsive?: { sm?: number; md?: number; lg?: number }
): { 
    type: 'grid',
    columns: number,
    gap: number,
    responsive?: { sm?: number; md?: number; lg?: number },
    schema: FormField[]
} {
    return {
        type: 'grid',
        columns,
        gap,
        responsive,
        schema: []
    };
}

export function GridContainer(
    columns: number = 2,
    gap: number = 4,
    responsive?: { sm?: number; md?: number; lg?: number }
) {
    const grid = defineGrid(columns, gap, responsive);
    
    return {
        ...grid,
        add(...fields: (FormField | FieldBuilder)[]): typeof grid {
            fields.forEach(field => {
                const formField = field instanceof FieldBuilder ? field.toJSON() : field;
                grid.schema.push(formField);
            });
            return grid;
        }
    };
}