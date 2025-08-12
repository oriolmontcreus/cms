import type { PageConfig } from '../lib/components/form-builder/types';
import { Hero } from '../components/Hero';
import { CarouselComponent } from '@/components/Carousel';
export const config: PageConfig = {
    title: "Home",
    slug: "home",
    components: [
        {
            component: Hero,
            id: "hero-main",
            displayName: "HERO SECTION"
        },
        {
            component: CarouselComponent,
            id: "carousel-main",
            displayName: "CAROUSEL SECTION"
        }
    ]
};
