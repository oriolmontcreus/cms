import { HeroComponent } from '@/components/Hero';
import type { PageConfig } from '../../lib/components/form-builder/types';

export const config: PageConfig = {
    title: "Services",
    slug: "services",
    parentSlug: "home",
    components: [
        {
            component: HeroComponent,
            id: "hero-main-a",
            displayName: "test"
        },
    ]
};
