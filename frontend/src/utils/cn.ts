type ClassValue = string | number | false | null | undefined

/** Tiny class-name joiner. Filters out falsy values. */
export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(' ')
}
