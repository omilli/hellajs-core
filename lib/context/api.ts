import { diff } from "../diff";
import { render } from "../render";
import { generateKey } from "../utils";
import type { ContextState, RootContext } from "./types";
import { getGlobalThis } from "./utils";

const contextStore: Map<string, ContextState> = new Map();

export function createContext(id?: string): ContextState {
	id ??= `hella-dom-${generateKey()}`;

	contextStore.set(id, {
		id,
		rootStore: new Map(),
		render: (...args) => render(...args),
		diff: (...args) => diff(...args),
	});

	return contextStore.get(id)!;
}

export function getContextStore() {
	return contextStore;
}

export function getDefaultContext(): ContextState {
	const context = getGlobalThis();
	const key = "domContext";

	if (!context[key]) {
		context[key] = createContext();
	}

	return context[key];
}

export function getRootContext(
	rootSelector: string,
	context = getDefaultContext(),
): RootContext {
	if (!context.rootStore.has(rootSelector)) {
		context.rootStore.set(rootSelector, {
			events: {
				delegates: new Set(),
				listeners: new Map(),
			},
		});
	}

	return context.rootStore.get(rootSelector)!;
}
