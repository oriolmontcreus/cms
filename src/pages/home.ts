import type { PageConfig } from '../lib/components/form-builder/types';
import { Hero } from '../components/Hero';
export const config: PageConfig = {
    title: "Home",
    components: [
        {
            component: Hero,
            id: "hero-main",
            displayName: "HERO SECTION"
        }]
};
