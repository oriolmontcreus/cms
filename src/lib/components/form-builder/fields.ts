import type { FormField, FieldType, PrefixSuffix, ComponentTab, TabsSelector, FieldBuilder as IFieldBuilder, TabBuilder as ITabBuilder, TabsBuilder as ITabsBuilder, Tab, TabsContainer, SchemaItem, ValidFieldName } from './types';

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

    type(inputType: 'text' | 'email' | 'password' | 'url' | 'tel'): this {
        this.field.type = inputType as FieldType;
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

    autoResize(isAutoResize: boolean = true): this {
        this.field.autoResize = isAutoResize;
        return this;
    }

    allowedMimeTypes(types: string[]): this {
        this.field.allowedMimeTypes = types;
        return this;
    }

    maxFileSize(size: number, unit: 'b' | 'kb' | 'mb' | 'gb' = 'mb'): this {
        const multipliers: Record<'b' | 'kb' | 'mb' | 'gb', number> = {
            'b': 1,
            'kb': 1024,
            'mb': 1024 * 1024,
            'gb': 1024 * 1024 * 1024
        };
        this.field.maxFileSize = size * multipliers[unit];
        return this;
    }

    maxTags(count: number): this {
        this.field.maxTags = count;
        return this;
    }

    validateTag(validator: (tag: string, existingTags: string[]) => string | undefined): this {
        this.field.validateTag = validator;
        return this;
    }

    allowDuplicates(allow: boolean = true): this {
        this.field.allowDuplicates = allow;
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

    translatable(isTranslatable: boolean = true): this {
        this.field.translatable = isTranslatable;
        return this;
    }

    schema(items: SchemaItem[] | ((index: number) => SchemaItem[])): this {
        this.field.schema = items;
        return this;
    }

    contained(isContained: boolean = true): this {
        this.field.contained = isContained;
        return this;
    }

    responsiveGrid(
        columns: number = 2,
        gap: number = 4,
        responsive?: { sm?: number; md?: number; lg?: number }
    ): this {
        this.field.responsiveGrid = {
            columns,
            gap,
            responsive
        };
        return this;
    }

    hidden(isHidden: boolean = true): this {
        this.field.hidden = isHidden;
        return this;
    }

    default(value: any): this {
        this.field.defaultValue = value;
        return this;
    }

    allowVariables(allow: boolean = true): this {
        this.field.allowVariables = allow;
        return this;
    }

    previewWidth(width: number): this {
        this.field.preview = { ...this.field.preview, width };
        return this;
    }
    previewHeight(height: number): this {
        this.field.preview = { ...this.field.preview, height };
        return this;
    }
    previewClass(className: string): this {
        this.field.preview = { ...this.field.preview, class: className };
        return this;
    }
    previewAspect(aspect: 'square' | 'video' | 'wide' | 'portrait' | string): this {
        this.field.preview = { ...this.field.preview, aspect };
        return this;
    }

    toJSON(): FormField { return this.field; }
    get fieldType(): FieldType { return this.field.type; }
    get name(): string { return this.field.name; }
}

// Factory functions that return FieldBuilder instances
// TextInput: Regular text input with variable support. Use .type() to specify input type (email, password, etc.)
export const TextInput = <T extends string>(name: ValidFieldName<T>) => new FieldBuilder('text', name);
export const Textarea = <T extends string>(name: ValidFieldName<T>) => new FieldBuilder('textarea', name);
export const NumberInput = <T extends string>(name: ValidFieldName<T>) => new FieldBuilder('number', name);
export const DatePicker = <T extends string>(name: ValidFieldName<T>) => new FieldBuilder('date', name);
export const DateRangePicker = <T extends string>(name: ValidFieldName<T>) => new FieldBuilder('dateRange', name);
export const Select = <T extends string>(name: ValidFieldName<T>) => new FieldBuilder('select', name);
export const Toggle = <T extends string>(name: ValidFieldName<T>) => new FieldBuilder('toggle', name);
export const ColorPicker = <T extends string>(name: ValidFieldName<T>) => new FieldBuilder('color', name);
export const RichEditor = <T extends string>(name: ValidFieldName<T>) => new FieldBuilder('richtext', name);
export const FileInput = <T extends string>(name: ValidFieldName<T>) => new FieldBuilder('file', name);
export const Repeater = <T extends string>(name: ValidFieldName<T>) => new FieldBuilder('repeater', name);
export const TagsInput = <T extends string>(name: ValidFieldName<T>) => new FieldBuilder('tags', name);

class TabBuilderImpl implements ITabBuilder {
    private tab: Tab;

    constructor(name: string) {
        this.tab = {
            type: 'tab',
            name,
            label: name,
            schema: []
        };
    }

    label(text: string): this {
        this.tab.label = text;
        return this;
    }

    icon(iconComponent: any): this {
        this.tab.icon = iconComponent;
        return this;
    }

    schema(fields: SchemaItem[]): this {
        this.tab.schema = fields;
        return this;
    }

    hidden(isHidden: boolean = true): this {
        this.tab.hidden = isHidden;
        return this;
    }

    toJSON(): Tab {
        return this.tab;
    }

    make(name: string): TabBuilderImpl {
        return new TabBuilderImpl(name);
    }
}

class TabsBuilderImpl implements ITabsBuilder {
    private tabsContainer: TabsContainer;

    constructor(name: string) {
        this.tabsContainer = {
            type: 'tabs-container',
            name,
            tabs: []
        };
    }

    tabs(tabsArray: (Tab | ITabBuilder)[]): this {
        this.tabsContainer.tabs = tabsArray.map(tab =>
            'toJSON' in tab ? tab.toJSON() : tab
        );
        return this;
    }

    activeTab(tabName: string): this {
        this.tabsContainer.activeTab = tabName;
        return this;
    }

    hidden(isHidden: boolean = true): this {
        this.tabsContainer.hidden = isHidden;
        return this;
    }

    toJSON(): TabsContainer {
        return this.tabsContainer;
    }

    make(name: string): TabsBuilderImpl {
        return new TabsBuilderImpl(name);
    }
}

export const Tabs = <T extends string>(name: ValidFieldName<T>) => new TabsBuilderImpl(name);
export const TabField = <T extends string>(name: ValidFieldName<T>) => new TabBuilderImpl(name);

export function defineTab<T extends string>(name: ValidFieldName<T>, label: string, icon?: any): ComponentTab {
    return {
        name,
        label,
        icon
    };
}

export function defineTabs(...tabs: ComponentTab[]): ComponentTab[] {
    return tabs;
}

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
    schema: SchemaItem[],
    hidden?: boolean
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

    const container = {
        ...grid,
        add(...fields: SchemaItem[]) {
            fields.forEach(field => {
                grid.schema.push(field);
            });
            return container;
        },
        hidden(isHidden: boolean = true) {
            grid.hidden = isHidden;
            return container;
        }
    };

    return container;
}