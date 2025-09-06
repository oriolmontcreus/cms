import type { PageConfig } from '../lib/components/form-builder/types';
import { GlobalVariables } from '../components/GlobalVariables';

export const config: PageConfig = {
    title: "Global Variables",
    components: [
        {
            component: GlobalVariables,
            id: "global-variables-main",
            displayName: "GLOBAL VARIABLES"
        }
    ]
};
