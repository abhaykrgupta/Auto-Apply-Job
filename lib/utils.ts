import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export helpers for convenience
export { formatSalary, timeAgo, truncate, getStatusColor } from './utils/helpers';
