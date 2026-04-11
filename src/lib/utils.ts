import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeHtml(html: string): string {
  // Remove script tags
  let sanitized = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
  // Remove excessive whitespace/newlines
  sanitized = sanitized.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
  return sanitized;
}
