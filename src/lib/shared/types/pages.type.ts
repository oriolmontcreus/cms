// Page and Component types
export interface Component {
    componentName: string;
    instanceId: string;
    displayName?: string;
    formData: Record<string, any>;
}

export interface Page {
    _id: string;
    slug: string;
    title: string;
    parentSlug?: string;
    content?: string;
    config?: any;
    components: Component[];
    createdAt: string;
    updatedAt: string;
}