import type { PageConfig } from '../lib/components/form-builder/types';
import { Hero } from '../components/Hero';
import { Carousel } from '../components/Carousel';

export const config: PageConfig = {
    title: "Home",
    components: [
        {
            component: Hero,
            id: "hero-main",
            displayName: "HERO SECTION"
        },
        {
            component: Carousel,
            id: "carousel-main",
            displayName: "CAROUSEL SECTION"
        }
    ]
};
