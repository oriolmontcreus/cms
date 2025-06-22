import type { PageConfig } from '../lib/components/form-builder/types';
import { HeroComponent } from '../components/Hero';

export const config: PageConfig = {
    title: "Home",
    slug: "home",
    components: [
        {
            component: HeroComponent,
            id: "hero-main",
            displayName: "Main Hero Section"
        }
    ]
};
