import { createComponent } from "../component";
import { diff } from "../diff";
import { render } from "../render";
import { createState } from "../state";
import { HNode } from "../types";
import { generateKey } from "../utils";
import type { Context, RootContext } from "./types";
import { getGlobalThis } from "./utils";

const contextStore: Map<string, Context<unknown>> = new Map();

export function createContext<T extends {}>(state?: T, id?: string): Context<T> {
	id ??= `hella-dom-${generateKey()}`;

	const contextState = createState(state || {});

	contextStore.set(id, {
		id,
		rootStore: new Map(),
		render: (...args) => render(...args),
		diff: (...args) => diff(...args),
		component: (hNode: () => HNode, rootSelector) => createComponent(hNode, rootSelector, contextState, contextStore.get(id)!),
		elementPool: new Map(),
		state: contextState,
	});

	return contextStore.get(id)! as Context<T>;
}

export function getContextStore() {
	return contextStore;
}

export function getDefaultContext(): Context<unknown> {
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
