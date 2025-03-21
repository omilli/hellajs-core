import { generateKey } from "../utils";
import type { ContextState, GlobalContext, RootContext } from "./types";

const CONTEXT_KEY = "domContext";
const contextStore: Map<string, ContextState> = new Map();
let currentContext: ContextState | null = null;

export function createContext(id?: string): ContextState {
	id ??= `hella-dom-${generateKey()}`;

	contextStore.set(id, {
		id,
		rootStore: new Map(),
		elementPool: new Map(),
	});

	return contextStore.get(id)!;
}

export function getCurrentContext(): ContextState | null {
	return currentContext;
}

export function setCurrentContext(id?: string): void {
	currentContext = id ? (contextStore.get(id) ?? null) : null;
}

export function cleanupContext(id: string): void {
	contextStore.delete(id);
}

export function getContext(): ContextState {
	const currentContext = getCurrentContext();

	if (currentContext) {
		return currentContext;
	}

	const context = getGlobalThis();

	if (!context[CONTEXT_KEY]) {
		context[CONTEXT_KEY] = createContext();
	}

	return context[CONTEXT_KEY] as ContextState;
}

export function getRootContext(rootSelector: string): RootContext {
	const ctx = getContext();

	if (!ctx.rootStore.has(rootSelector)) {
		ctx.rootStore.set(rootSelector, {
			elements: new Map(),
			events: {
				delegates: new Set(),
				listeners: new Map(),
			},
		});
	}

	return ctx.rootStore.get(rootSelector)!;
}

/**
 * Attempts to return the global `this` object in a way that works across different JavaScript environments,
 * including browsers, Node.js, and web workers.
 *
 * @returns The global `this` object. This could be `globalThis`, `window`, `global`, `self`, or the result of `Function("return this")()`.
 */
function getGlobalThis(): GlobalContext {
	if (typeof globalThis !== "undefined") return globalThis as GlobalContext;
	if (typeof window !== "undefined") return window as GlobalContext;
	if (typeof global !== "undefined") return global as GlobalContext;
	if (typeof self !== "undefined") return self as GlobalContext;
	return Function("return this")();
}
