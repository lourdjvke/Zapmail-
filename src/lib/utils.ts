import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
  // Remove inline event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/\son\w+="[^"]*"/gim, "");
  sanitized = sanitized.replace(/\son\w+='[^']*'/gim, "");
  // Remove javascript: pseudo-protocol
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gim, 'href="#"');
  
  return sanitized;
}
