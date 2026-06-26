// src/config/env.schema.ts

export const EnvSchema = {
   NODE_ENV: ['development', 'production', 'test'] as const,
   COOKIE_SAME_SITE: ['Strict', 'Lax', 'None'] as const,
}
