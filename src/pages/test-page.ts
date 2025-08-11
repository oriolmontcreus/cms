import type { PageConfig } from '../lib/components/form-builder/types';
import { HeroComponent } from '../components/Hero';
export const config: PageConfig = {
    title: "Test Page",
    slug: "test-page",
    components: [
        {
            component: HeroComponent,
            id: "hero-test",
            displayName: "HERO SECTION"
        }]
};
