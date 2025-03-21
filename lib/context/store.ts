import { ContextState } from "./types";

export const contextStore: Map<string, ContextState> = new Map();
let currentContext: ContextState | null = null;


export function getCurrentContext(): ContextState | null {
  return currentContext;
}

export function setCurrentContext(id?: string): void {
  currentContext = id ? (contextStore.get(id) ?? null) : null;
}

export function cleanupContext(id: string): void {
  contextStore.delete(id);
}
