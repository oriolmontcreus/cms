import { TextInput } from '@/lib/components/form-builder/fields';
import type { Component } from '@/lib/components/form-builder/types';

export const ProductDetailsComponent: Component = {
    name: 'ProductDetails',
    schema: [
        TextInput('test').label('Test Field').helperText('aaa')
    ]
};
