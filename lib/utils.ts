import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS class names safely, resolving conflicts.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 * @param inputs - Any number of class values, conditionals, or arrays.
 * @returns A single merged class name string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a Date object into a human-readable string.
 * @param date - The date to format.
 * @returns A string in the format "Jan 12, 2025".
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Truncates a string to a given length and appends an ellipsis if needed.
 * @param text - The string to truncate.
 * @param length - Maximum allowed character length before truncation.
 * @returns The original string if short enough, otherwise a truncated version with "…".
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}…`;
}
