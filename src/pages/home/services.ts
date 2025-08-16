import { Hero } from '@/components/Hero';
import type { PageConfig } from '../../lib/components/form-builder/types';

export const config: PageConfig = {
    title: "Services",
    components: [
        {
            component: Hero,
            id: "hero-main-a",
            displayName: "test"
        },
    ]
};
