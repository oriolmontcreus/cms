// Page and Component types
export interface Component {
    componentName: string;
    instanceId: string;
    displayName?: string;
    formData: Record<string, any>;
}

export interface Page {
    slug: string;
    title?: string;
    config?: any;
    components: Component[];
}