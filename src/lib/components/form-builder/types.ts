export interface FormField {
    type: 'text' | 'textarea' | 'number' | 'date' | 'select';
    label: string;
    name: string;
    required?: boolean;
    placeholder?: string;
    options?: string[]; // For select fields
}

export interface PageConfig {
    title: string;
    slug: string;
    fields: FormField[];
}

export interface FormData {
    [key: string]: string | number | Date | null;
} 