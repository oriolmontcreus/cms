import type { PageConfig } from '../lib/components/form-builder/types';
import { Hero } from '../components/Hero';
import { ProductDetailsComponent } from '@/components/ProductDetails';

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
            component: ProductDetailsComponent,
            id: 'product-details',
            displayName: 'PRODUCT DETAILS'
        }
    ]
};
