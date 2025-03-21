import type { ContextState, GlobalContext } from "./types";

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

/**
 * Attempts to return the global `this` object in a way that works across different JavaScript environments,
 * including browsers, Node.js, and web workers.
 *
 * @returns The global `this` object. This could be `globalThis`, `window`, `global`, `self`, or the result of `Function("return this")()`.
 */
export function getGlobalThis(): GlobalContext {
	if (typeof globalThis !== "undefined") return globalThis as GlobalContext;
	if (typeof window !== "undefined") return window as GlobalContext;
	if (typeof global !== "undefined") return global as GlobalContext;
	if (typeof self !== "undefined") return self as GlobalContext;
	return Function("return this")();
}
