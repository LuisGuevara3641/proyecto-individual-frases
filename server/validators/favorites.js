import { z } from 'zod';

// Body del POST a favoritos: content y author obligatorios (no vacíos), nota opcional
export const favoriteBodySchema = z.object({
  content: z
    .string()
    .transform((s) => (s ?? '').trim())
    .pipe(z.string().min(1, 'El contenido de la frase es obligatorio')),
  author: z
    .string()
    .transform((s) => (s ?? '').trim())
    .pipe(z.string().min(1, 'El autor es obligatorio')),
  nota: z
    .string()
    .optional()
    .default('')
    .transform((s) => (s == null ? '' : String(s).trim())),
});

// Devuelve { success, data } o { success: false, error }
export function validateFavoriteBody(body) {
  const result = favoriteBodySchema.safeParse(body ?? {});
  if (result.success) {
    return { success: true, data: result.data };
  }
  const message = result.error.errors[0]
    ? `${result.error.errors[0].path.join('.') || 'body'}: ${result.error.errors[0].message}`
    : result.error.message || 'Datos inválidos';
  return { success: false, error: message };
}
