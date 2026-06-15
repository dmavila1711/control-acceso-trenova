import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Json } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export function compactAddress(input: {
  calle: string;
  numero_exterior: string;
  numero_interior?: string | null;
}) {
  return `${input.calle} ${input.numero_exterior}${input.numero_interior ? ` Int. ${input.numero_interior}` : ""}`;
}

export function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
