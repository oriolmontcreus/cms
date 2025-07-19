// Locale configuration
export const SITE_LOCALES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' }
] as const;

export const CMS_LOCALE = 'en';

// Other environment constants that might be needed
// TODO THIS ENV SHOULD BE DELETED AS WE USE IT FROM THE "SHARED" DIRECTORY
export const CMS_NAME = 'Froggy CMS';
export const FRONTEND_URL = 'http://localhost:4321';
export const BACKEND_URL = 'http://localhost:3001';