export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'dateRange' | 'select' | 'email' | 'password' | 'url' | 'tel' | 'checkbox' | 'radio' | 'toggle' | 'color' | 'richtext' | 'file' | 'repeater';

export enum RenderMode {
    CONTENT = 'content',
    TRANSLATION = 'translation'
}

export type PrefixSuffix = string | any; // Can be either a string or an icon component

// Layout Types
export type LayoutType = 'grid' | 'tabs';

export interface GridLayout {
    type: 'grid';
    columns?: number; // Number of columns (1-12, default: 2)
    gap?: number; // Gap between grid items (1-8, default: 4)
    responsive?: {
        sm?: number; // Columns on small screens
        md?: number; // Columns on medium screens
        lg?: number; // Columns on large screens
    };
    schema: FormField[]; // Fields contained in this grid
    hidden?: boolean; // Whether this grid should be hidden from rendering
}

export interface TabsLayout {
    type: 'tabs';
    tabs: TabDefinition[];
    activeTab?: number; // Index of the initially active tab (0-based)
}

export interface TabDefinition {
    id: string;
    label: string;
    icon?: any; // Icon component
    schema: FormField[]; // Fields contained in this tab
}

export type Layout = GridLayout | TabsLayout;

// New tab definition for component-level tabs
export interface ComponentTab {
    name: string; // Identifier (used in field.tab())
    label: string; // Display name
    icon?: any; // Optional icon component
}

export interface TabsSelector {
    type: 'tabs-selector';
    id: string;
}

export interface Tab {
    type: 'tab';
    name: string;
    label: string;
    icon?: any;
    schema: SchemaItem[];
    hidden?: boolean; // Whether this tab should be hidden from rendering
}

export interface TabsContainer {
    type: 'tabs-container';
    name: string;
    tabs: Tab[];
    activeTab?: string;
    hidden?: boolean; // Whether this tabs container should be hidden from rendering
}

export interface TabBuilder {
    make(name: string): TabBuilder;
    label(text: string): TabBuilder;
    icon(iconComponent: any): TabBuilder;
    schema(fields: SchemaItem[]): TabBuilder;
    hidden(isHidden?: boolean): TabBuilder;
    toJSON(): Tab;
}

export interface TabsBuilder {
    make(name: string): TabsBuilder;
    tabs(tabsArray: (Tab | TabBuilder)[]): TabsBuilder;
    activeTab(tabName: string): TabsBuilder;
    hidden(isHidden?: boolean): TabsBuilder;
    toJSON(): TabsContainer;
}

export interface FormField {
    type: FieldType;
    label: string;
    name: string;
    required?: boolean;
    placeholder?: string;
    options?: string[]; // For select/radio fields
    min?: number; // For text/textarea (min length) or number (min value)
    max?: number; // For text/textarea (max length) or number (max value)
    step?: number; // For number fields
    decimalSeparator?: ',' | '.'; // For number fields - decimal separator preference
    allowDecimals?: boolean; // For number fields - whether decimal values are allowed
    multiple?: boolean; // For select fields
    disabled?: boolean;
    readonly?: boolean;
    pattern?: string; // For text validation
    helperText?: string; // Additional help text
    searchable?: boolean; // For searchable select fields
    prefix?: PrefixSuffix; // Prefix icon or text
    suffix?: PrefixSuffix; // Suffix icon or text
    // Textarea-specific options
    rows?: number; // For textarea fields - number of visible rows
    resizable?: boolean; // For textarea fields - whether it can be resized (default: true)
    // Date-specific formatting options
    locale?: string; // For date fields (e.g., 'en-US', 'es-ES')
    weekdayFormat?: 'short' | 'long' | 'narrow'; // For date fields
    yearFormat?: 'numeric' | '2-digit'; // For date fields
    monthFormat?: 'numeric' | '2-digit' | 'short' | 'long' | 'narrow'; // For date fields
    dateStyle?: 'full' | 'long' | 'medium' | 'short'; // For date fields display style
    // Date range constraints
    minDate?: string; // For date fields - minimum selectable date (ISO string format)
    maxDate?: string; // For date fields - maximum selectable date (ISO string format)
    // File upload specific options
    allowedMimeTypes?: string[]; // For file fields - allowed MIME types (default: all)
    maxFileSize?: number; // For file fields - maximum file size in bytes
    // Repeater specific options
    schema?: SchemaItem[]; // For repeater fields - the schema to repeat
    contained?: boolean; // For repeater fields - whether to show items in a container
    responsiveGrid?: {
        columns?: number; // Number of columns (1-12, default: 2)
        gap?: number; // Gap between grid items (1-8, default: 4)
        responsive?: {
            sm?: number; // Columns on small screens
            md?: number; // Columns on medium screens
            lg?: number; // Columns on large screens
        };
    }; // For repeater fields - responsive grid configuration
    // Layout properties
    columnSpan?: number; // For grid layout - how many columns this field should span
    tab?: string; // Tab name this field belongs to
    // Translation properties
    translatable?: boolean; // Whether this field supports translations
    // Visibility properties
    hidden?: boolean; // Whether this field should be hidden from rendering
}

// Type for FieldBuilder instances (for better type checking)
export interface FieldBuilder {
    type: FieldType;
    name: string;
    toJSON(): FormField;
    label(text: string): FieldBuilder;
    placeholder(text: string): FieldBuilder;
    required(isRequired?: boolean): FieldBuilder;
    disabled(isDisabled?: boolean): FieldBuilder;
    readonly(isReadonly?: boolean): FieldBuilder;
    helperText(text: string): FieldBuilder;
    prefix(value: PrefixSuffix): FieldBuilder;
    suffix(value: PrefixSuffix): FieldBuilder;
    min(value: number): FieldBuilder;
    max(value: number): FieldBuilder;
    step(value: number): FieldBuilder;
    decimalSeparator(separator: ',' | '.'): FieldBuilder;
    allowDecimals(allow?: boolean): FieldBuilder;
    pattern(regex: string): FieldBuilder;
    url(): FieldBuilder;
    options(optionsList: string[]): FieldBuilder;
    multiple(isMultiple?: boolean): FieldBuilder;
    searchable(isSearchable?: boolean): FieldBuilder;
    locale(localeString: string): FieldBuilder;
    weekdayFormat(format: 'short' | 'long' | 'narrow'): FieldBuilder;
    yearFormat(format: 'numeric' | '2-digit'): FieldBuilder;
    monthFormat(format: 'numeric' | '2-digit' | 'short' | 'long' | 'narrow'): FieldBuilder;
    dateStyle(style: 'full' | 'long' | 'medium' | 'short'): FieldBuilder;
    minDate(date: string | Date): FieldBuilder;
    maxDate(date: string | Date): FieldBuilder;
    rows(count: number): FieldBuilder;
    resizable(isResizable?: boolean): FieldBuilder;
    allowedMimeTypes(types: string[]): FieldBuilder;
    maxFileSize(size: number): FieldBuilder;
    columnSpan(span: number): FieldBuilder;
    tab(tabName: string): FieldBuilder;
    responsiveGrid(columns?: number, gap?: number, responsive?: { sm?: number; md?: number; lg?: number }): FieldBuilder;
    translatable(isTranslatable?: boolean): FieldBuilder;
    hidden(isHidden?: boolean): FieldBuilder;
}

// Schema item can be either a field, field builder, tabs container, or grid layout
export type SchemaItem = FormField | FieldBuilder | TabsSelector | TabsContainer | GridLayout;

export interface Component {
    name: string;
    schema: Layout | SchemaItem[]; // Can be a layout or mixed array of fields and placeholders
    tabs?: ComponentTab[]; // Component-level tab definitions
    activeTab?: string; // Name of the initially active tab
    validate?: (data: Record<string, any>) => string[];
    transform?: (data: Record<string, any>) => Record<string, any>;
}

export interface ComponentInstance {
    component: Component;
    id: string; // Unique identifier for this instance
    displayName?: string; // Optional custom display name for this instance
}

export interface PageConfig {
    title: string;
    slug: string;
    parentSlug?: string;
    components: ComponentInstance[];
}

export interface FormData {
    [componentId: string]: {
        [fieldName: string]: any;
    };
}

export interface TranslationData {
    [componentId: string]: {
        [locale: string]: {
            [fieldName: string]: any;
        };
    };
} 