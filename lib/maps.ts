import type { EventFn } from "./types";

export const elementMap = new Map<string, HTMLElement | Text | DocumentFragment>();
export const eventMap = new Map<string, Map<string, EventFn>>();
