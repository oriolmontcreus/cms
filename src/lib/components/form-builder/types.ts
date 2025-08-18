export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'dateRange' | 'select' | 'email' | 'password' | 'url' | 'tel' | 'checkbox' | 'radio' | 'toggle' | 'color' | 'richtext' | 'file' | 'repeater' | 'tags';

/**
 * Error messages for invalid field names with descriptive feedback
 */
type FieldNameError<T extends string> =
    T extends `${string}-${string}`
    ? `Field name "${T}" cannot contain hyphens. Use camelCase instead (e.g., "myField")`
    : T extends `${string} ${string}`
    ? `Field name "${T}" cannot contain spaces. Use camelCase instead (e.g., "myField")`
    : T extends `${number}${string}`
    ? `Field name "${T}" cannot start with a number. Use a letter instead (e.g., "field${T}")`
    : T extends `${string}.${string}`
    ? `Field name "${T}" cannot contain dots. Use camelCase instead (e.g., "myField")`
    : T extends `${string}@${string}`
    ? `Field name "${T}" cannot contain @ symbol. Use camelCase instead (e.g., "emailField")`
    : T extends `${string}#${string}`
    ? `Field name "${T}" cannot contain # symbol. Use camelCase instead (e.g., "myField")`
    : T extends `${string}$${string}`
    ? `Field name "${T}" cannot contain $ symbol. Use camelCase instead (e.g., "myField")`
    : T extends `${string}%${string}`
    ? `Field name "${T}" cannot contain % symbol. Use camelCase instead (e.g., "myField")`
    : T extends `${string}&${string}`
    ? `Field name "${T}" cannot contain & symbol. Use camelCase instead (e.g., "myField")`
    : T extends `${string}*${string}`
    ? `Field name "${T}" cannot contain * symbol. Use camelCase instead (e.g., "myField")`
    : T extends `${string}+${string}`
    ? `Field name "${T}" cannot contain + symbol. Use camelCase instead (e.g., "myField")`
    : T extends `${string}=${string}`
    ? `Field name "${T}" cannot contain = symbol. Use camelCase instead (e.g., "myField")`
    : T extends `${string}|${string}`
    ? `Field name "${T}" cannot contain | symbol. Use camelCase instead (e.g., "myField")`
    : T extends `${string}\\${string}`
    ? `Field name "${T}" cannot contain backslash. Use camelCase instead (e.g., "myField")`
    : T extends `${string}/${string}`
    ? `Field name "${T}" cannot contain forward slash. Use camelCase instead (e.g., "myField")`
    : T extends `${string}?${string}`
    ? `Field name "${T}" cannot contain question mark. Use camelCase instead (e.g., "myField")`
    : T extends `${string}<${string}`
    ? `Field name "${T}" cannot contain < symbol. Use camelCase instead (e.g., "myField")`
    : T extends `${string}>${string}`
    ? `Field name "${T}" cannot contain > symbol. Use camelCase instead (e.g., "myField")`
    : T extends `${string},${string}`
    ? `Field name "${T}" cannot contain comma. Use camelCase instead (e.g., "myField")`
    : T extends `${string};${string}`
    ? `Field name "${T}" cannot contain semicolon. Use camelCase instead (e.g., "myField")`
    : T extends `${string}:${string}`
    ? `Field name "${T}" cannot contain colon. Use camelCase instead (e.g., "myField")`
    : T extends `${string}"${string}`
    ? `Field name "${T}" cannot contain double quotes. Use camelCase instead (e.g., "myField")`
    : T extends `${string}'${string}`
    ? `Field name "${T}" cannot contain single quotes. Use camelCase instead (e.g., "myField")`
    : T extends `${string}\`${string}`
    ? `Field name "${T}" cannot contain backticks. Use camelCase instead (e.g., "myField")`
    : T extends `${string}[${string}`
    ? `Field name "${T}" cannot contain square brackets. Use camelCase instead (e.g., "myField")`
    : T extends `${string}]${string}`
    ? `Field name "${T}" cannot contain square brackets. Use camelCase instead (e.g., "myField")`
    : T extends `${string}{${string}`
    ? `Field name "${T}" cannot contain curly braces. Use camelCase instead (e.g., "myField")`
    : T extends `${string}}${string}`
    ? `Field name "${T}" cannot contain curly braces. Use camelCase instead (e.g., "myField")`
    : T extends `${string}(${string}`
    ? `Field name "${T}" cannot contain parentheses. Use camelCase instead (e.g., "myField")`
    : T extends `${string})${string}`
    ? `Field name "${T}" cannot contain parentheses. Use camelCase instead (e.g., "myField")`
    : T extends `${string}!${string}`
    ? `Field name "${T}" cannot contain exclamation mark. Use camelCase instead (e.g., "myField")`
    : T extends `${string}~${string}`
    ? `Field name "${T}" cannot contain tilde. Use camelCase instead (e.g., "myField")`
    : T extends `${string}^${string}`
    ? `Field name "${T}" cannot contain caret. Use camelCase instead (e.g., "myField")`
    : T extends ''
    ? `Field name cannot be empty. Please provide a valid field name (e.g., "myField")`
    : never;

/**
 * Validates field names to be valid JavaScript/TypeScript variable names.
 * Provides descriptive error messages when invalid names are used.
 * 
 * Examples:
 * ✅ Valid: "title", "userName", "email", "firstName", "user_id"
 * ❌ Invalid: "flip-words", "user name", "123field", "my-field"
 */
export type ValidFieldName<T extends string> = T extends `${string}-${string}`
    ? FieldNameError<T>
    : T extends `${string} ${string}`
    ? FieldNameError<T>
    : T extends `${number}${string}`
    ? FieldNameError<T>
    : T extends `${string}.${string}`
    ? FieldNameError<T>
    : T extends `${string}@${string}`
    ? FieldNameError<T>
    : T extends `${string}#${string}`
    ? FieldNameError<T>
    : T extends `${string}$${string}`
    ? FieldNameError<T>
    : T extends `${string}%${string}`
    ? FieldNameError<T>
    : T extends `${string}&${string}`
    ? FieldNameError<T>
    : T extends `${string}*${string}`
    ? FieldNameError<T>
    : T extends `${string}+${string}`
    ? FieldNameError<T>
    : T extends `${string}=${string}`
    ? FieldNameError<T>
    : T extends `${string}|${string}`
    ? FieldNameError<T>
    : T extends `${string}\\${string}`
    ? FieldNameError<T>
    : T extends `${string}/${string}`
    ? FieldNameError<T>
    : T extends `${string}?${string}`
    ? FieldNameError<T>
    : T extends `${string}<${string}`
    ? FieldNameError<T>
    : T extends `${string}>${string}`
    ? FieldNameError<T>
    : T extends `${string},${string}`
    ? FieldNameError<T>
    : T extends `${string};${string}`
    ? FieldNameError<T>
    : T extends `${string}:${string}`
    ? FieldNameError<T>
    : T extends `${string}"${string}`
    ? FieldNameError<T>
    : T extends `${string}'${string}`
    ? FieldNameError<T>
    : T extends `${string}\`${string}`
    ? FieldNameError<T>
    : T extends `${string}[${string}`
    ? FieldNameError<T>
    : T extends `${string}]${string}`
    ? FieldNameError<T>
    : T extends `${string}{${string}`
    ? FieldNameError<T>
    : T extends `${string}}${string}`
    ? FieldNameError<T>
    : T extends `${string}(${string}`
    ? FieldNameError<T>
    : T extends `${string})${string}`
    ? FieldNameError<T>
    : T extends `${string}!${string}`
    ? FieldNameError<T>
    : T extends `${string}~${string}`
    ? FieldNameError<T>
    : T extends `${string}^${string}`
    ? FieldNameError<T>
    : T extends ''
    ? FieldNameError<T>
    : T;

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
    schema: SchemaItem[]; // Fields contained in this grid
    hidden?: boolean; // Whether this grid should be hidden from rendering
}

export interface TabDefinition {
    id: string;
    label: string;
    icon?: any; // Icon component
    schema: FormField[]; // Fields contained in this tab
}

export type Layout = GridLayout;

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
    autoResize?: boolean; // For textarea fields - whether it should automatically resize based on content
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
    // Tags input specific options
    maxTags?: number; // For tags fields - maximum number of tags allowed
    validateTag?: (tag: string, existingTags: string[]) => string | undefined; // For tags fields - custom tag validation function
    allowDuplicates?: boolean; // For tags fields - whether to allow duplicate tags (default: false)
    // Repeater specific options
    schema?: SchemaItem[] | ((index: number) => SchemaItem[]); // For repeater fields - the schema to repeat (can be function for dynamic fields)
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
    // Default values
    defaultValue?: any; // Default value for the field
    // Variable support
    allowVariables?: boolean; // Whether this field supports global variables (default: true for text-based fields)
    // Visibility properties
    hidden?: boolean; // Whether this field should be hidden from rendering
}

// Type for FieldBuilder instances (for better type checking)
export interface FieldBuilder {
    fieldType: FieldType;
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
    type(inputType: 'text' | 'email' | 'password' | 'url' | 'tel'): FieldBuilder;
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
    autoResize(isAutoResize?: boolean): FieldBuilder;
    allowedMimeTypes(types: string[]): FieldBuilder;
    maxFileSize(size: number): FieldBuilder;
    maxTags(count: number): FieldBuilder;
    validateTag(validator: (tag: string, existingTags: string[]) => string | undefined): FieldBuilder;
    allowDuplicates(allow?: boolean): FieldBuilder;
    columnSpan(span: number): FieldBuilder;
    tab(tabName: string): FieldBuilder;
    responsiveGrid(columns?: number, gap?: number, responsive?: { sm?: number; md?: number; lg?: number }): FieldBuilder;
    translatable(isTranslatable?: boolean): FieldBuilder;
    default(value: any): FieldBuilder;
    allowVariables(allow?: boolean): FieldBuilder;
    hidden(isHidden?: boolean): FieldBuilder;
}

// Schema item can be either a field, field builder, tabs container, tabs builder, or grid layout
export type SchemaItem = FormField | FieldBuilder | TabsSelector | TabsContainer | GridLayout | TabBuilder | TabsBuilder;

export interface Component {
    name: string;
    schema: SchemaItem[];
    tabs?: ComponentTab[]; // Component-level tab definitions
    activeTab?: string; // Name of the initially active tab
    validate?: (data: Record<string, any>) => string[];
    transform?: (data: Record<string, any>) => Record<string, any>;
}

export interface ComponentInstance {
    component: Component; // All components use the same interface now
    id: string; // Unique identifier for this instance
    displayName?: string; // Optional custom display name for this instance
}

export interface PageConfig {
    title: string;
    components: ComponentInstance[];
    // Form builder configuration
    formBuilder?: {
        defaultExpanded?: boolean; // If true, all components are expanded by default
        hideComponentTitles?: boolean; // If true, component titles are hidden
        disableCollapsible?: boolean; // If true, components are not collapsible/expandable
    };
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