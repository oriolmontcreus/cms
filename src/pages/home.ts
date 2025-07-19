import type { PageConfig } from '../lib/components/form-builder/types';
import { HeroComponent } from '../components/Hero';
import { ContactInfo } from '../components/ContactInfo';

export const config: PageConfig = {
    title: "Home",
    slug: "home",
    components: [
        {
            component: HeroComponent,
            id: "hero-main",
            displayName: "HERO SECTION"
        },
        {
            component: ContactInfo,
            id: 'contact-info',
            displayName: 'CONTACT INFORMATION'
        }
    ]
};
