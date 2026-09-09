import { revalidatePath } from 'next/cache';

/**
 * Re-validate one or more paths after a mutation.
 */
export function revalidate(...paths: string[]) {
  paths.forEach((p) => revalidatePath(p));
}

