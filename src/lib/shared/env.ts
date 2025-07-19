// Locale configuration
export const SITE_LOCALES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' }
] as const;

export const CMS_LOCALE = 'en';

// Other environment constants that might be needed
export const CMS_NAME = process.env.CMS_NAME || 'Froggy CMS';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';