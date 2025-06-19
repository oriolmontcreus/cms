import type { PageConfig } from '../types';

export const config: PageConfig = {
  "title": "mister",
  "slug": "mister",
  "fields": [
    {
      "type": "text",
      "name": "nombre",
      "label": "Nombre",
      "required": true,
      "placeholder": "Introduce tu nombre"
    },
    {
      "type": "number",
      "name": "edad",
      "label": "Edad",
      "required": true,
      "placeholder": "Entra tu edad"
    }
  ]
};
